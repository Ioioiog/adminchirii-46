
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Wrench, FileText, CreditCard, Droplets, MessageCircle, Settings, Calendar, AlertCircle, Info } from "lucide-react";

export function TenantGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tenant Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the tenant guide! This comprehensive guide will help you navigate through the platform 
          and make the most out of your rental experience. Learn how to manage your properties, submit maintenance 
          requests, access important documents, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideCard 
          icon={Home}
          title="Properties"
          description="View details about your rented properties, including address, lease terms, and landlord contact information."
          steps={[
            "Navigate to the Properties page from the sidebar",
            "Click on a property card to view its details",
            "Access your rental agreement and property photos",
            "Review property amenities and features"
          ]}
          examples={[
            "Check your lease end date to plan for renewal",
            "Review property rules before inviting guests",
            "Verify utilities included in your rent"
          ]}
        />

        <GuideCard 
          icon={Wrench}
          title="Maintenance Requests"
          description="Submit and track maintenance requests for your rental property."
          steps={[
            "Go to the Maintenance page",
            "Click 'New Request' to submit a new maintenance issue",
            "Provide details and photos of the issue",
            "Track the status of your requests in the maintenance dashboard",
            "Rate and review completed maintenance work"
          ]}
          examples={[
            "Report a leaking faucet with photos of the issue",
            "Request HVAC repairs with detailed temperature issues",
            "Submit emergency maintenance requests for urgent issues like gas leaks"
          ]}
        />

        <GuideCard 
          icon={FileText}
          title="Documents"
          description="Access and manage important documents related to your tenancy."
          steps={[
            "Visit the Documents page",
            "View your lease agreement, addendums, and other documents",
            "Download or print documents as needed",
            "Upload required documents when requested by your landlord",
            "Use the search function to find specific documents quickly"
          ]}
          examples={[
            "Download your signed lease agreement for your records",
            "Access property inspection reports from move-in",
            "Review utility transfer documentation"
          ]}
        />

        <GuideCard 
          icon={CreditCard}
          title="Payments"
          description="Make and track rent payments and view your payment history."
          steps={[
            "Go to Financial → Payments",
            "View upcoming and past payments",
            "Make a payment using your preferred payment method",
            "Set up automatic payments for your recurring rent",
            "Download payment receipts for your records"
          ]}
          examples={[
            "Set up auto-pay to avoid late fees and payment reminders",
            "Generate year-end rent payment summaries for tax purposes",
            "Split payments between multiple payment methods"
          ]}
        />

        <GuideCard 
          icon={Calendar}
          title="Important Dates"
          description="Keep track of important dates related to your tenancy."
          steps={[
            "Check the Dashboard calendar for upcoming dates",
            "Set reminders for lease renewal deadlines",
            "Note scheduled maintenance visits",
            "Track payment due dates and late fee thresholds"
          ]}
          examples={[
            "Receive notifications 30 days before lease expiration",
            "Schedule reminders for quarterly property inspections",
            "Manage utility payment deadlines"
          ]}
        />

        <GuideCard 
          icon={Droplets}
          title="Utilities"
          description="Manage and track utility usage and payments."
          steps={[
            "Navigate to the Utilities page",
            "View utility accounts associated with your property",
            "Track usage and costs over time",
            "Report meter readings when required",
            "Set up payment reminders for utility bills"
          ]}
          examples={[
            "Monitor monthly electricity usage with historical charts",
            "Compare water usage across seasons",
            "Report gas meter readings through the platform"
          ]}
        />

        <GuideCard 
          icon={MessageCircle}
          title="Communication"
          description="Communicate with your landlord or property manager."
          steps={[
            "Use the Chat feature to message your landlord",
            "Receive notifications about important updates",
            "Schedule video calls for remote discussions",
            "Keep all communication documented in one place"
          ]}
          examples={[
            "Request clarification on lease terms through secure messaging",
            "Schedule a video call to discuss renewal options",
            "Send photos of minor maintenance concerns"
          ]}
        />

        <GuideCard 
          icon={Info}
          title="Property Handbook"
          description="Access detailed information about your property."
          steps={[
            "View the Property Handbook from your property details page",
            "Find information about appliance operations",
            "Learn about neighborhood amenities and services",
            "Access emergency contact information"
          ]}
          examples={[
            "Look up instructions for operating the dishwasher",
            "Find recycling and trash collection schedules",
            "Get instructions for complex heating systems"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <Settings className="mr-2 h-5 w-5" />
          Tips for Getting Started
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Complete your profile in the Settings page with all contact information</li>
          <li>Set up your preferred payment methods before your first rent due date</li>
          <li>Enable notifications to stay updated on important events and deadlines</li>
          <li>Familiarize yourself with your lease terms and property rules immediately</li>
          <li>Save your landlord's contact information for emergencies in your phone</li>
          <li>Document the condition of your rental with photos when you first move in</li>
          <li>Test all smoke detectors and safety equipment upon moving in</li>
        </ul>
      </div>

      <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mt-4">
        <h3 className="flex items-center text-lg font-medium text-amber-800 mb-3">
          <AlertCircle className="mr-2 h-5 w-5" />
          Emergency Procedures
        </h3>
        <p className="text-amber-700 mb-3">For urgent maintenance issues that require immediate attention:</p>
        <ol className="list-decimal pl-5 space-y-2 text-amber-700">
          <li>Use the emergency maintenance request option in the Maintenance section</li>
          <li>Call your landlord's emergency contact number listed in your Property Handbook</li>
          <li>For life-threatening emergencies (fire, gas leak), contact emergency services (911) first</li>
          <li>Document the issue with photos once it's safe to do so</li>
          <li>Follow up with standard documentation through the platform once the emergency is addressed</li>
        </ol>
      </div>
    </div>
  );
}

interface GuideCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  steps: string[];
  examples: string[];
}

function GuideCard({ icon: Icon, title, description, steps, examples }: GuideCardProps) {
  return (
    <Card className="overflow-hidden border-gray-200 hover:shadow-md transition-all duration-200">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-md shadow-sm">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How to:</h4>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Examples:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          {examples.map((example, index) => (
            <li key={index}>{example}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
