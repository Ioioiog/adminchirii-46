
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en' } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request: "${message}" in language: ${language}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful property management platform assistant that provides concise, accurate answers.
            Focus on explaining platform features related to property management, tenant processes, maintenance requests, and payments.
            When explaining a feature, mention key screens, buttons to click, and basic steps to accomplish the task.
            Keep responses under 150 words, professional, and to the point.
            Do not introduce yourself in each response.
            The user's language is: ${language}.
            Respond in the same language as the user's question.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to generate response', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedResponse = data.choices[0].message.content;
    console.log(`Generated response: "${generatedResponse.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ response: generatedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-guide-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
