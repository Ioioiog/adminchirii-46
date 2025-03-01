
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
  AlertCircle 
} from "lucide-react";

export function TenantHandbookTab() {
  const [section, setSection] = useState("beginning");

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
                  <p className="text-gray-700">
                    Welcome to your new home! We're delighted to have you as a tenant and look forward to a positive relationship. This handbook contains important information to help you during your tenancy.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="starting">
                <AccordionTrigger>Starting a Tenancy</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Your tenancy officially begins on the date specified in your contract. Please make sure to read your contract thoroughly and reach out if you have any questions.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="paying">
                <AccordionTrigger>Paying Rent, Deposit and Inventories</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Your rent is due on the date specified in your contract. The security deposit has been protected with a government-approved scheme. A detailed inventory has been provided - please review it within 7 days of moving in.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="checklist">
                <AccordionTrigger>Moving in Checklist</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Confirm utilities are connected and in your name</li>
                    <li>Test smoke and carbon monoxide detectors</li>
                    <li>Locate main water shut-off valve</li>
                    <li>Check all windows and doors lock properly</li>
                    <li>Review and return the property inventory</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="meters">
                <AccordionTrigger>Taking Meter Readings</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Take meter readings immediately upon moving in and notify utility providers. This ensures you're only charged for your usage. Take photos of the meters as evidence.
                  </p>
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
                  <p className="text-gray-700">
                    Regular cleaning and maintenance will keep your home in good condition. Report any maintenance issues promptly to prevent further damage.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="electricity">
                <AccordionTrigger>Turning Off Electricity</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    The main electricity switch is usually located near the meter. In case of emergency, switch it off before calling an electrician.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="pipes">
                <AccordionTrigger>Leaking, Bursting and Frozen Pipes</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    In case of a leak, turn off the water at the main valve. For frozen pipes, gently warm them using a hairdryer on a low setting. Never use open flames.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="heating">
                <AccordionTrigger>Controlling Your Central Heating</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Set your thermostat to a reasonable temperature (18-21°C). For efficiency, it's often better to keep heating at a consistent low temperature rather than frequently turning it on and off.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="condensation">
                <AccordionTrigger>Condensation</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    To reduce condensation, ensure proper ventilation, use extractor fans when cooking or showering, and avoid drying clothes indoors when possible.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="washing">
                <AccordionTrigger>Washing Machine</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Make sure the washing machine is level and not overloaded. Clean the filter regularly and leave the door ajar after use to prevent mold.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="blockages">
                <AccordionTrigger>Clearing Blockages</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    For sink blockages, try using a plunger or drain unblocker. For toilets, use a toilet plunger. Avoid using harsh chemicals as they can damage pipes.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="lightbulbs">
                <AccordionTrigger>Changing Light Bulbs and Batteries</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Tenants are responsible for replacing light bulbs and batteries in smoke detectors. Ensure the power is off before changing bulbs.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="troubleshooting">
                <AccordionTrigger>Troubleshooting</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Before reporting an issue, check if it's something simple like a tripped circuit breaker, blocked filter, or needs a new battery. Many minor issues can be resolved without a callout.
                  </p>
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
                  <p className="text-gray-700">
                    If there's a change in tenants during an ongoing contract, all tenants must agree and a new contract must be drawn up. Contact us to arrange this.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="renewing">
                <AccordionTrigger>Renewing a Contract</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    We'll contact you approximately 2 months before your tenancy end date to discuss renewal options. If you wish to renew, let us know as early as possible.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="ending">
                <AccordionTrigger>Ending Your Tenancy</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Provide notice as specified in your contract (typically 1-2 months). Clean the property thoroughly, remove all belongings, and return all keys.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="deposit">
                <AccordionTrigger>Deposit Refund</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Your deposit will be returned within 10 days of the end of your tenancy, less any agreed deductions for damages beyond normal wear and tear or unpaid rent.
                  </p>
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
                  <p className="text-gray-700">
                    In case of fire, evacuate immediately and call emergency services (112 or local equivalent). Only attempt to extinguish small fires if safe to do so.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="gas">
                <AccordionTrigger>Gas</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    If you smell gas, open windows, don't use electrical switches or naked flames, turn off the gas at the meter if possible, and call the gas emergency number immediately.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="waterleak">
                <AccordionTrigger>Water Leak</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Turn off the water at the main stopcock, switch off electrical appliances in the affected area, and contact us immediately.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="electricity">
                <AccordionTrigger>Loss of Electricity</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    Check if it's a power outage in the area or just your property. Check the circuit breakers in your fuse box. If you can't restore power, contact us.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="office">
                <AccordionTrigger>In Case Our Office is Closed</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-700">
                    For genuine emergencies outside office hours, call our emergency contact number provided in your welcome pack. For non-urgent matters, please wait until office hours.
                  </p>
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
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Office Hours:</strong> Monday to Friday, 9am to 5pm</p>
                    <p><strong>Phone:</strong> +XX XXX XXX XXX</p>
                    <p><strong>Email:</strong> support@propertymanagement.com</p>
                    <p><strong>Emergency (out of hours):</strong> +XX XXX XXX XXX</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="utility">
                <AccordionTrigger>Utility Providers</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Electricity:</strong> Contact details will be in your welcome pack</p>
                    <p><strong>Gas:</strong> Contact details will be in your welcome pack</p>
                    <p><strong>Water:</strong> Contact details will be in your welcome pack</p>
                    <p><strong>Internet:</strong> Contact details will be in your welcome pack</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="misc">
                <AccordionTrigger>Miscellaneous</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Local Council:</strong> Details will be in your welcome pack</p>
                    <p><strong>Waste Collection:</strong> Details will be in your welcome pack</p>
                    <p><strong>Local Police (non-emergency):</strong> Local number will be in your welcome pack</p>
                    <p><strong>Emergency Services:</strong> 112 (or local equivalent)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </ContentCard>
    </div>
  );
}
