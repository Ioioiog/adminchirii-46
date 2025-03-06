
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Wallet, UserCog, Settings, MapPin, Star, Calendar, ArrowUpRight } from "lucide-react";

export function ServiceProviderGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Provider Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the service provider guide! This guide will help you manage your maintenance services, client relationships, and grow your business on our platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideCard 
          icon={Clipboard}
          title="Job Management"
          description="View, accept, and manage maintenance requests from property owners."
          steps={[
            "Navigate to Job Requests to see new maintenance requests",
            "Review job details and requirements",
            "Accept jobs that match your skills and availability",
            "Update job status as you progress through the work",
            "Upload photos of completed work"
          ]}
        />

        <GuideCard 
          icon={UserCog}
          title="Profile Management"
          description="Manage your professional profile, skills, and experience."
          steps={[
            "Go to your Profile page",
            "Add your professional qualifications and certifications",
            "List your service specialties and expertise",
            "Upload portfolio images of past work",
            "Set your availability calendar"
          ]}
        />

        <GuideCard 
          icon={MapPin}
          title="Service Areas"
          description="Define the geographic areas where you provide your services."
          steps={[
            "Visit the Service Areas page",
            "Add zip codes or regions where you can work",
            "Set travel distance preferences",
            "Define different rates for different areas if applicable",
            "Update your coverage area as your business grows"
          ]}
        />

        <GuideCard 
          icon={Wallet}
          title="Earnings Management"
          description="Track your earnings, invoices, and payments."
          steps={[
            "View your Earnings dashboard for financial overview",
            "Submit invoices for completed jobs",
            "Track payment status and history",
            "Generate earnings reports for accounting",
            "Set up your payment preferences"
          ]}
        />

        <GuideCard 
          icon={Star}
          title="Ratings & Reviews"
          description="Manage your reputation and client feedback."
          steps={[
            "View ratings and reviews from past clients",
            "Respond professionally to client feedback",
            "Request reviews after completing jobs",
            "Use positive reviews to enhance your profile",
            "Address any concerns raised in reviews"
          ]}
        />

        <GuideCard 
          icon={Calendar}
          title="Scheduling"
          description="Manage your work schedule and appointments."
          steps={[
            "View your upcoming job schedule",
            "Set your working hours and availability",
            "Receive notifications about new job requests",
            "Coordinate visit times with property owners",
            "Manage job priorities and deadlines"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <ArrowUpRight className="mr-2 h-5 w-5" />
          Tips for Growing Your Business
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Respond quickly to job requests to increase your acceptance rate</li>
          <li>Complete jobs on time to improve your reliability score</li>
          <li>Take before and after photos of your work</li>
          <li>Maintain clear communication with property owners</li>
          <li>Regularly update your skills and certifications</li>
          <li>Expand your service areas gradually as you build capacity</li>
          <li>Request reviews from satisfied clients</li>
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
