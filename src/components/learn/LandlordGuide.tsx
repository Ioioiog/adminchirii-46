
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Wrench, FileText, CreditCard, Droplets, MessageCircle, Settings, BarChart } from "lucide-react";

export function LandlordGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Landlord Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the landlord guide! This guide will help you manage your properties, tenants, and financial transactions efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuideCard 
          icon={BarChart}
          title="Dashboard"
          description="Get an overview of your rental business with key metrics and insights."
          steps={[
            "View property occupancy rates and vacancy status",
            "Track rental income and expenses",
            "Monitor maintenance requests and tenant communications",
            "See upcoming lease renewals and important dates"
          ]}
        />

        <GuideCard 
          icon={Home}
          title="Property Management"
          description="Add, edit, and manage your rental properties."
          steps={[
            "Navigate to the Properties page from the sidebar",
            "Click 'Add Property' to list a new rental unit",
            "Upload photos and property details",
            "Manage property settings, amenities, and features"
          ]}
        />

        <GuideCard 
          icon={Users}
          title="Tenant Management"
          description="Manage current tenants and process new tenant applications."
          steps={[
            "Go to the Tenants page",
            "View tenant profiles and contact information",
            "Send invitations to new tenants",
            "Track lease terms and renewal dates",
            "Record tenant observations and history"
          ]}
        />

        <GuideCard 
          icon={Wrench}
          title="Maintenance Management"
          description="Handle maintenance requests and schedule repairs."
          steps={[
            "Review maintenance requests from tenants",
            "Assign service providers to handle issues",
            "Track the status of maintenance tasks",
            "Communicate with tenants about repair progress",
            "Document completed maintenance work"
          ]}
        />

        <GuideCard 
          icon={FileText}
          title="Document Management"
          description="Create and manage leases, contracts, and other documents."
          steps={[
            "Go to the Documents page",
            "Create lease agreements and contracts from templates",
            "Send documents to tenants for digital signing",
            "Store and organize property-related documents",
            "Generate reports for your rental business"
          ]}
        />

        <GuideCard 
          icon={CreditCard}
          title="Financial Management"
          description="Track rent payments, expenses, and generate financial reports."
          steps={[
            "Navigate to the Financial section",
            "Record rent payments and other income",
            "Track property expenses and maintenance costs",
            "Generate financial reports for accounting",
            "Set up payment reminders for tenants"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <Settings className="mr-2 h-5 w-5" />
          Best Practices for Landlords
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Keep property details and photos up-to-date</li>
          <li>Respond promptly to maintenance requests</li>
          <li>Document all tenant communications</li>
          <li>Regularly review your financial reports</li>
          <li>Stay informed about local rental regulations</li>
          <li>Set up automatic rent payment reminders</li>
          <li>Conduct regular property inspections</li>
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
