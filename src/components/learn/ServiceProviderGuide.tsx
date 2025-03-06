
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, MapPin, ClipboardCheck, CreditCard, Settings, Users, MessageCircle, Star, Calendar, BarChart, AlertCircle, ShieldCheck } from "lucide-react";

export function ServiceProviderGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Provider Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the service provider guide! This comprehensive guide will help you understand how to use the platform 
          to manage your maintenance services, grow your business, and build strong relationships with property owners. 
          Learn how to receive and complete job requests, manage your schedule, and get paid promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideCard 
          icon={Wrench}
          title="Profile Management"
          description="Set up and manage your service provider profile."
          steps={[
            "Complete your profile with detailed business information",
            "Add your professional certifications and licensing information",
            "Upload a profile photo and business logo for recognition",
            "Specify your areas of expertise and specializations",
            "List the services you offer with descriptions and pricing"
          ]}
          examples={[
            "Create a profile highlighting 10+ years of plumbing experience and master plumber certification",
            "Upload your electrical contractor license and insurance documents",
            "Showcase before/after photos of your previous renovation projects"
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
            "Update your coverage area as your business grows",
            "Specify travel fees for distant locations"
          ]}
          examples={[
            "Set up a 15-mile service radius around your business location",
            "Create custom service zones with different pricing for downtown vs. suburbs",
            "Add a new neighborhood to your service area as you expand your business"
          ]}
        />

        <GuideCard 
          icon={ClipboardCheck}
          title="Job Management"
          description="Manage maintenance requests and ongoing jobs."
          steps={[
            "Review new maintenance requests in your service area",
            "Accept or decline job requests based on your availability",
            "Update job status as work progresses",
            "Upload photos of completed work for documentation",
            "Track time spent on each job for accurate billing",
            "Communicate with property owners and tenants about job details"
          ]}
          examples={[
            "Accept an emergency plumbing request and schedule same-day service",
            "Upload before/after photos of a completed HVAC repair",
            "Document materials used for a kitchen renovation with itemized costs"
          ]}
        />

        <GuideCard 
          icon={CreditCard}
          title="Earnings Management"
          description="Track your earnings and payment history."
          steps={[
            "Go to the Earnings page",
            "View pending and completed payments",
            "Track earnings by time period, service type, or client",
            "Set up direct deposit for faster payments",
            "Download earning statements for tax purposes",
            "Generate invoices for completed jobs"
          ]}
          examples={[
            "Generate a quarterly earnings report for tax planning",
            "Review payment history from a specific property management company",
            "Create a professional invoice with your company branding and logo"
          ]}
        />

        <GuideCard 
          icon={Calendar}
          title="Scheduling"
          description="Manage your availability and job schedule."
          steps={[
            "Set your regular working hours in your profile",
            "Block off time for existing commitments",
            "View upcoming scheduled jobs on your calendar",
            "Receive notifications about new job requests",
            "Use the mobile app for on-the-go schedule management"
          ]}
          examples={[
            "Block off vacation time two months in advance",
            "Schedule recurring maintenance visits for regular clients",
            "Adjust your availability during busy seasons to avoid overbooking"
          ]}
        />

        <GuideCard 
          icon={Users}
          title="Client Management"
          description="Manage your relationships with landlords and property managers."
          steps={[
            "Maintain a list of your regular clients",
            "View property details for jobs to better prepare",
            "Build your reputation through quality service",
            "Receive ratings and reviews from satisfied clients",
            "Create special service packages for repeat customers"
          ]}
          examples={[
            "Offer a maintenance package to a property manager with multiple properties",
            "Follow up with clients after job completion to ensure satisfaction",
            "Request reviews from satisfied customers to build your profile"
          ]}
        />

        <GuideCard 
          icon={Star}
          title="Ratings & Reviews"
          description="Build your reputation with positive client feedback."
          steps={[
            "Provide excellent service to earn high ratings",
            "Ask satisfied clients to leave reviews",
            "Respond professionally to client feedback",
            "Showcase your average rating on your profile",
            "Use feedback to improve your services"
          ]}
          examples={[
            "Send a follow-up message requesting a review after completing a job",
            "Respond thoughtfully to a 4-star review with suggestions for improvement",
            "Highlight your 4.9-star average rating in your profile description"
          ]}
        />

        <GuideCard 
          icon={BarChart}
          title="Business Analytics"
          description="Track your performance and identify growth opportunities."
          steps={[
            "View your job acceptance rate and completion metrics",
            "Analyze revenue by service type to identify profitable services",
            "Track seasonal trends to plan for busy periods",
            "Monitor customer satisfaction metrics",
            "Use data to optimize pricing and service offerings"
          ]}
          examples={[
            "Identify that HVAC services generate 40% of your revenue during summer months",
            "Notice your plumbing jobs have a 98% satisfaction rate compared to 92% for electrical",
            "Discover that weekend jobs generate 25% higher revenue than weekday jobs"
          ]}
        />
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-8">
          <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
            <Settings className="mr-2 h-5 w-5" />
            Tips for Service Providers
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-700">
            <li>Respond to job requests within 1-2 hours to maximize your booking rate</li>
            <li>Keep your availability calendar up-to-date to avoid scheduling conflicts</li>
            <li>Document your work with detailed before and after photos for each job</li>
            <li>Provide clear, detailed estimates and stick to quoted prices whenever possible</li>
            <li>Maintain professional communication with clients through the platform messaging</li>
            <li>Ask satisfied clients to leave reviews immediately after job completion</li>
            <li>Regularly update your skills, certifications, and service offerings</li>
            <li>Offer preventative maintenance packages to create recurring revenue</li>
            <li>Consider offering emergency services at premium rates if your schedule allows</li>
            <li>Use the mobile app for real-time updates when on service calls</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mb-8">
          <h3 className="flex items-center text-lg font-medium text-amber-800 mb-3">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Professional Best Practices
          </h3>
          <p className="text-amber-700 mb-3">Maintain high professional standards with these best practices:</p>
          <ul className="list-disc pl-5 space-y-2 text-amber-700">
            <li>Always confirm appointments 24 hours in advance to reduce no-shows</li>
            <li>Wear professional attire and carry identification on all service calls</li>
            <li>Provide written estimates before beginning work for transparency</li>
            <li>Clean up thoroughly after completing any job</li>
            <li>Follow up after major jobs to ensure ongoing client satisfaction</li>
            <li>Maintain proper licensing, bonding, and insurance at all times</li>
            <li>Keep detailed records of all work performed for warranty purposes</li>
          </ul>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="flex items-center text-lg font-medium text-green-800 mb-3">
            <AlertCircle className="mr-2 h-5 w-5" />
            Handling Emergency Requests
          </h3>
          <p className="text-green-700 mb-3">Guidelines for responding to emergency maintenance requests:</p>
          <ol className="list-decimal pl-5 space-y-2 text-green-700">
            <li>Emergency requests are highlighted in red on your dashboard</li>
            <li>Aim to respond to emergency requests within 15-30 minutes</li>
            <li>If you accept an emergency job, provide an estimated arrival time</li>
            <li>Use the "On My Way" button in the app to notify the client when you're en route</li>
            <li>Document the emergency situation with photos before beginning work</li>
            <li>Communicate any unexpected complications immediately</li>
            <li>After resolving the immediate emergency, schedule follow-up work if needed</li>
          </ol>
        </div>
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
