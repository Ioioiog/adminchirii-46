
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, MapPin, ClipboardCheck, CreditCard, Settings, Users, MessageCircle } from "lucide-react";

export function ServiceProviderGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Provider Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the service provider guide! This guide will help you understand how to use the platform to manage your maintenance services and grow your business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideCard 
          icon={Wrench}
          title="Profile Management"
          description="Set up and manage your service provider profile."
          steps={[
            "Complete your profile with business details",
            "Add your professional certifications",
            "Upload a profile photo and business logo",
            "Specify your areas of expertise and specializations"
          ]}
        />

        <GuideCard 
          icon={MapPin}
          title="Service Areas"
          description="Define the geographic areas where you provide services."
          steps={[
            "Navigate to the Service Areas page",
            "Select regions or draw custom service boundaries",
            "Set different rates for different service areas if needed",
            "Update your coverage area as your business grows"
          ]}
        />

        <GuideCard 
          icon={ClipboardCheck}
          title="Job Management"
          description="Manage maintenance requests and ongoing jobs."
          steps={[
            "Review new maintenance requests in your service area",
            "Accept or decline job requests",
            "Update job status as work progresses",
            "Upload photos of completed work",
            "Track time spent on each job"
          ]}
        />

        <GuideCard 
          icon={CreditCard}
          title="Earnings Management"
          description="Track your earnings and payment history."
          steps={[
            "Go to the Earnings page",
            "View pending and completed payments",
            "Track earnings by time period or service type",
            "Set up direct deposit for faster payments",
            "Download earning statements for tax purposes"
          ]}
        />

        <GuideCard 
          icon={Users}
          title="Client Management"
          description="Manage your relationships with landlords and property managers."
          steps={[
            "Maintain a list of your regular clients",
            "View property details for jobs",
            "Build your reputation through quality service",
            "Receive ratings and reviews from satisfied clients"
          ]}
        />

        <GuideCard 
          icon={MessageCircle}
          title="Communication"
          description="Stay in touch with landlords and tenants about maintenance jobs."
          steps={[
            "Use the Chat feature to communicate about job details",
            "Send updates on job progress",
            "Ask questions about maintenance issues",
            "Coordinate access to properties"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <Settings className="mr-2 h-5 w-5" />
          Tips for Service Providers
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Respond quickly to job requests to increase your booking rate</li>
          <li>Keep your availability calendar up to date</li>
          <li>Document your work with before and after photos</li>
          <li>Provide clear estimates and stick to quoted prices</li>
          <li>Maintain professional communication with clients</li>
          <li>Ask satisfied clients to leave reviews</li>
          <li>Regularly update your skills and certifications</li>
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
