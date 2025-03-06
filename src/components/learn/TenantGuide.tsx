
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Wrench, FileText, CreditCard, Droplets, MessageCircle, Settings } from "lucide-react";

export function TenantGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tenant Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the tenant guide! This guide will help you navigate through the platform and make the most out of your rental experience.
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
            "Access your rental agreement and property photos"
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
            "Track the status of your requests in the maintenance dashboard"
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
            "Upload required documents when requested by your landlord"
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
            "Set up automatic payments for your recurring rent"
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
            "Report meter readings when required"
          ]}
        />

        <GuideCard 
          icon={MessageCircle}
          title="Communication"
          description="Communicate with your landlord or property manager."
          steps={[
            "Use the Chat feature to message your landlord",
            "Receive notifications about important updates",
            "Schedule video calls for remote discussions"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <Settings className="mr-2 h-5 w-5" />
          Tips for Getting Started
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Complete your profile in the Settings page</li>
          <li>Set up your preferred payment methods</li>
          <li>Enable notifications to stay updated on important events</li>
          <li>Familiarize yourself with your lease terms and property rules</li>
          <li>Save your landlord's contact information for emergencies</li>
        </ul>
      </div>
    </div>
  );
}

interface GuideCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  steps: string[];
}

function GuideCard({ icon: Icon, title, description, steps }: GuideCardProps) {
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
      </CardContent>
    </Card>
  );
}
