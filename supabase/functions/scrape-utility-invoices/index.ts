
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { getScraperForProvider } from "./scrapers/index.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Scrape utility invoices function loaded");

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const { username, password, utilityId, provider, type, location } = requestData;
    
    if (!username || !password || !utilityId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters (username, password, utilityId)"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`Starting scraping for provider: ${provider}`);
    
    // Get the appropriate scraper for the provider
    const scraper = getScraperForProvider(provider);
    
    if (!scraper) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unsupported provider: ${provider}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Create a scraping job entry
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'pending',
        provider: provider,
        type: type,
        location: location
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error("Error creating scraping job:", jobError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create scraping job"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const jobId = jobData.id;
    console.log(`Created scraping job with ID: ${jobId}`);
    
    // We'll handle the scraping in the background
    try {
      // Execute the scraping
      console.log("Starting scraping operation");
      const result = await scraper.scrape(username, password);
      
      if (!result.success) {
        console.error("Scraping failed:", result.error);
        
        // Update job with error
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: result.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
        
        return new Response(
          JSON.stringify({
            success: false,
            jobId: jobId,
            error: result.error || "Scraping failed"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Scraping succeeded
      console.log(`Scraping succeeded. Found ${result.bills?.length || 0} bills`);
      
      // Process bills
      if (result.bills && result.bills.length > 0) {
        // Insert the bills into the utilities table
        const insertData = result.bills.map(bill => ({
          property_id: null, // This will be updated in the next step
          utility_provider_id: utilityId,
          type: bill.type || type || 'gas',
          amount: bill.amount,
          currency: 'RON', // Default for Romanian providers
          due_date: bill.due_date,
          invoice_number: bill.invoice_number,
          status: 'pending',
          issued_date: bill.issued_date || new Date().toISOString().split('T')[0]
        }));
        
        const { data: insertedBills, error: insertError } = await supabase
          .from('utilities')
          .insert(insertData)
          .select();
        
        if (insertError) {
          console.error("Error inserting bills:", insertError);
          
          // Update job with error
          await supabase
            .from('scraping_jobs')
            .update({
              status: 'failed',
              error_message: `Failed to insert bills: ${insertError.message}`,
              completed_at: new Date().toISOString()
            })
            .eq('id', jobId);
          
          return new Response(
            JSON.stringify({
              success: false,
              jobId: jobId,
              error: `Failed to insert bills: ${insertError.message}`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`Inserted ${insertedBills.length} bills into the utilities table`);
        
        // Get the property ID from the utility provider
        const { data: providerData, error: providerError } = await supabase
          .from('utility_provider_credentials')
          .select('property_id')
          .eq('id', utilityId)
          .single();
        
        if (!providerError && providerData.property_id) {
          // Update the bills with the property ID
          const { error: updateError } = await supabase
            .from('utilities')
            .update({ property_id: providerData.property_id })
            .in('id', insertedBills.map(bill => bill.id));
            
          if (updateError) {
            console.error("Error updating property ID for bills:", updateError);
          } else {
            console.log("Updated property ID for all bills");
          }
        }
      }
      
      // Update job as completed
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          bills_fetched: result.bills?.length || 0
        })
        .eq('id', jobId);
        
      console.log("Scraping job completed successfully");
      
      return new Response(
        JSON.stringify({
          success: true,
          jobId: jobId,
          message: "Scraping job completed successfully",
          billsCount: result.bills?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error in scraping operation:", error);
      
      // Update job with error
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: `Scraping error: ${error.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
        
      return new Response(
        JSON.stringify({
          success: false,
          jobId: jobId,
          error: `Error in scraping operation: ${error.message}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unexpected error: ${error.message}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
