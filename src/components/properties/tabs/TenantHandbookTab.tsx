
import React, { useState } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ContentCard } from "@/components/layout/ContentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpenText, 
  Home, 
  CalendarDays, 
  PhoneCall, 
  AlertCircle,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";

interface HandbookSection {
  title: string;
  content: string;
}

interface HandbookData {
  [sectionId: string]: HandbookSection;
}

export function TenantHandbookTab({ propertyId }: { propertyId: string }) {
  const [section, setSection] = useState("beginning");
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [handbookData, setHandbookData] = useState<HandbookData>({
    welcome: { title: "Welcome Letter", content: "Welcome to your new home! We're delighted to have you as a tenant and look forward to a positive relationship. This handbook contains important information to help you during your tenancy." },
    starting: { title: "Starting a Tenancy", content: "Your tenancy officially begins on the date specified in your contract. Please make sure to read your contract thoroughly and reach out if you have any questions." },
    paying: { title: "Paying Rent, Deposit and Inventories", content: "Your rent is due on the date specified in your contract. The security deposit has been protected with a government-approved scheme. A detailed inventory has been provided - please review it within 7 days of moving in." },
    checklist: { title: "Moving in Checklist", content: "• Confirm utilities are connected and in your name\n• Test smoke and carbon monoxide detectors\n• Locate main water shut-off valve\n• Check all windows and doors lock properly\n• Review and return the property inventory" },
    meters: { title: "Taking Meter Readings", content: "Take meter readings immediately upon moving in and notify utility providers. This ensures you're only charged for your usage. Take photos of the meters as evidence." },
    home: { title: "Looking After Your Home", content: "Regular cleaning and maintenance will keep your home in good condition. Report any maintenance issues promptly to prevent further damage." },
    electricity: { title: "Turning Off Electricity", content: "The main electricity switch is usually located near the meter. In case of emergency, switch it off before calling an electrician." },
    pipes: { title: "Leaking, Bursting and Frozen Pipes", content: "In case of a leak, turn off the water at the main valve. For frozen pipes, gently warm them using a hairdryer on a low setting. Never use open flames." },
    heating: { title: "Controlling Your Central Heating", content: "Set your thermostat to a reasonable temperature (18-21°C). For efficiency, it's often better to keep heating at a consistent low temperature rather than frequently turning it on and off." },
    condensation: { title: "Condensation", content: "To reduce condensation, ensure proper ventilation, use extractor fans when cooking or showering, and avoid drying clothes indoors when possible." },
    washing: { title: "Washing Machine", content: "Make sure the washing machine is level and not overloaded. Clean the filter regularly and leave the door ajar after use to prevent mold." },
    blockages: { title: "Clearing Blockages", content: "For sink blockages, try using a plunger or drain unblocker. For toilets, use a toilet plunger. Avoid using harsh chemicals as they can damage pipes." },
    lightbulbs: { title: "Changing Light Bulbs and Batteries", content: "Tenants are responsible for replacing light bulbs and batteries in smoke detectors. Ensure the power is off before changing bulbs." },
    troubleshooting: { title: "Troubleshooting", content: "Before reporting an issue, check if it's something simple like a tripped circuit breaker, blocked filter, or needs a new battery. Many minor issues can be resolved without a callout." },
    change: { title: "Change of Tenancy", content: "If there's a change in tenants during an ongoing contract, all tenants must agree and a new contract must be drawn up. Contact us to arrange this." },
    renewing: { title: "Renewing a Contract", content: "We'll contact you approximately 2 months before your tenancy end date to discuss renewal options. If you wish to renew, let us know as early as possible." },
    ending: { title: "Ending Your Tenancy", content: "Provide notice as specified in your contract (typically 1-2 months). Clean the property thoroughly, remove all belongings, and return all keys." },
    deposit: { title: "Deposit Refund", content: "Your deposit will be returned within 10 days of the end of your tenancy, less any agreed deductions for damages beyond normal wear and tear or unpaid rent." },
    fire: { title: "Fire", content: "In case of fire, evacuate immediately and call emergency services (112 or local equivalent). Only attempt to extinguish small fires if safe to do so." },
    gas: { title: "Gas", content: "If you smell gas, open windows, don't use electrical switches or naked flames, turn off the gas at the meter if possible, and call the gas emergency number immediately." },
    waterleak: { title: "Water Leak", content: "Turn off the water at the main stopcock, switch off electrical appliances in the affected area, and contact us immediately." },
    electricityloss: { title: "Loss of Electricity", content: "Check if it's a power outage in the area or just your property. Check the circuit breakers in your fuse box. If you can't restore power, contact us." },
    office: { title: "In Case Our Office is Closed", content: "For genuine emergencies outside office hours, call our emergency contact number provided in your welcome pack. For non-urgent matters, please wait until office hours." },
    property: { title: "Property Management Contacts", content: "Office Hours: Monday to Friday, 9am to 5pm\nPhone: +XX XXX XXX XXX\nEmail: support@propertymanagement.com\nEmergency (out of hours): +XX XXX XXX XXX" },
    utility: { title: "Utility Providers", content: "Electricity: Contact details will be in your welcome pack\nGas: Contact details will be in your welcome pack\nWater: Contact details will be in your welcome pack\nInternet: Contact details will be in your welcome pack" },
    misc: { title: "Miscellaneous", content: "Local Council: Details will be in your welcome pack\nWaste Collection: Details will be in your welcome pack\nLocal Police (non-emergency): Local number will be in your welcome pack\nEmergency Services: 112 (or local equivalent)" },
  });
  const [editContent, setEditContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const { toast } = useToast();
  const { userRole } = useUserRole();

  const isLandlord = userRole === "landlord";

  const fetchHandbookData = async () => {
    try {
      if (!propertyId) return;
      
      const { data, error } = await supabase
        .from('property_handbook')
        .select('handbook_data')
        .eq('property_id', propertyId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching handbook data:", error);
        return;
      }
      
      if (data && data.handbook_data) {
        setHandbookData(data.handbook_data);
      }
    } catch (error) {
      console.error("Error in fetchHandbookData:", error);
    }
  };

  React.useEffect(() => {
    fetchHandbookData();
  }, [propertyId]);

  const startEditing = (sectionId: string) => {
    setEditingSection(sectionId);
    setOriginalContent(handbookData[sectionId].content);
    setEditContent(handbookData[sectionId].content);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!editingSection) return;

    try {
      // Update local state
      const updatedData = {
        ...handbookData,
        [editingSection]: {
          ...handbookData[editingSection],
          content: editContent
        }
      };
      
      setHandbookData(updatedData);

      // Save to database
      const { error } = await supabase
        .from('property_handbook')
        .upsert({
          property_id: propertyId,
          handbook_data: updatedData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Handbook section updated successfully",
      });
    } catch (error) {
      console.error("Error saving handbook data:", error);
      // Revert to original content if save fails
      setHandbookData({
        ...handbookData,
        [editingSection]: {
          ...handbookData[editingSection],
          content: originalContent
        }
      });
      
      toast({
        title: "Error",
        description: "Failed to update handbook section",
        variant: "destructive",
      });
    } finally {
      setEditingSection(null);
      setIsEditing(false);
    }
  };

  const renderAccordionContent = (sectionId: string) => {
    if (isEditing && editingSection === sectionId) {
      return (
        <div className="space-y-4">
          <Textarea 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)} 
            className="min-h-[150px]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={cancelEditing}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEditing}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-gray-700">
          {handbookData[sectionId]?.content || "Content not available"}
        </p>
        {isLandlord && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-gray-500 hover:text-primary" 
            onClick={() => startEditing(sectionId)}
          >
            Edit
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-medium">Tenant Handbook</h3>
      </div>
      
      <ContentCard>
        <Tabs value={section} onValueChange={setSection} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="beginning" className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4" />
              <span className="hidden md:inline">Beginning</span>
            </TabsTrigger>
            <TabsTrigger value="during" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">During</span>
            </TabsTrigger>
            <TabsTrigger value="end" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">At the End</span>
            </TabsTrigger>
            <TabsTrigger value="emergencies" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden md:inline">Emergencies</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              <span className="hidden md:inline">Contacts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beginning" className="pt-2">
            <h4 className="text-lg font-medium mb-4">Starting Your Tenancy</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="welcome">
                <AccordionTrigger>Welcome Letter</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("welcome")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="starting">
                <AccordionTrigger>Starting a Tenancy</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("starting")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="paying">
                <AccordionTrigger>Paying Rent, Deposit and Inventories</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("paying")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="checklist">
                <AccordionTrigger>Moving in Checklist</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("checklist")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="meters">
                <AccordionTrigger>Taking Meter Readings</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("meters")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="during" className="pt-2">
            <h4 className="text-lg font-medium mb-4">During Your Tenancy</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="home">
                <AccordionTrigger>Looking After Your Home</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("home")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="electricity">
                <AccordionTrigger>Turning Off Electricity</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("electricity")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="pipes">
                <AccordionTrigger>Leaking, Bursting and Frozen Pipes</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("pipes")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="heating">
                <AccordionTrigger>Controlling Your Central Heating</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("heating")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="condensation">
                <AccordionTrigger>Condensation</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("condensation")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="washing">
                <AccordionTrigger>Washing Machine</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("washing")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="blockages">
                <AccordionTrigger>Clearing Blockages</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("blockages")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="lightbulbs">
                <AccordionTrigger>Changing Light Bulbs and Batteries</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("lightbulbs")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="troubleshooting">
                <AccordionTrigger>Troubleshooting</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("troubleshooting")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="end" className="pt-2">
            <h4 className="text-lg font-medium mb-4">At the End of Your Tenancy</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="change">
                <AccordionTrigger>Change of Tenancy</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("change")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="renewing">
                <AccordionTrigger>Renewing a Contract</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("renewing")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="ending">
                <AccordionTrigger>Ending Your Tenancy</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("ending")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="deposit">
                <AccordionTrigger>Deposit Refund</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("deposit")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="emergencies" className="pt-2">
            <h4 className="text-lg font-medium mb-4">Emergencies</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="fire">
                <AccordionTrigger>Fire</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("fire")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="gas">
                <AccordionTrigger>Gas</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("gas")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="waterleak">
                <AccordionTrigger>Water Leak</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("waterleak")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="electricityloss">
                <AccordionTrigger>Loss of Electricity</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("electricityloss")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="office">
                <AccordionTrigger>In Case Our Office is Closed</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("office")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="contacts" className="pt-2">
            <h4 className="text-lg font-medium mb-4">Important Contacts</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="property">
                <AccordionTrigger>Property Management Contacts</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("property")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="utility">
                <AccordionTrigger>Utility Providers</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("utility")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="misc">
                <AccordionTrigger>Miscellaneous</AccordionTrigger>
                <AccordionContent>
                  {renderAccordionContent("misc")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </ContentCard>
    </div>
  );
}
