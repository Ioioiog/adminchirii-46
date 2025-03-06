
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Wrench, FileText, CreditCard, Droplets, MessageCircle, Settings, BarChart, Calendar, AlertCircle, ArrowUpDown } from "lucide-react";

export function LandlordGuide() {
  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Landlord Guide</h2>
        <p className="text-gray-600 mb-6">
          Welcome to the landlord guide! This comprehensive guide will help you efficiently manage your properties, 
          tenants, and financial transactions. Learn how to track rent payments, handle maintenance requests, 
          create and manage leases, and optimize your rental business operations.
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
            "See upcoming lease renewals and important dates",
            "Analyze revenue trends over time"
          ]}
          examples={[
            "Quickly identify properties with upcoming vacancies to plan marketing",
            "Monitor month-over-month revenue changes with the revenue chart",
            "View pending maintenance requests requiring your attention"
          ]}
        />

        <GuideCard 
          icon={Home}
          title="Property Management"
          description="Add, edit, and manage your rental properties."
          steps={[
            "Navigate to the Properties page from the sidebar",
            "Click 'Add Property' to list a new rental unit",
            "Upload photos and detailed property information",
            "Manage property settings, amenities, and features",
            "Track property-specific expenses and income"
          ]}
          examples={[
            "Add a new 2-bedroom apartment with detailed amenity listings",
            "Update property photos after renovations to attract new tenants",
            "Track property-specific expenses like mortgage, taxes, and insurance"
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
            "Record tenant observations and history",
            "Manage tenant communications and document requests"
          ]}
          examples={[
            "Invite a new tenant to join the platform after signing a lease",
            "Send lease renewal offers to tenants 60 days before expiration",
            "Document tenant payment history for future reference"
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
            "Document completed maintenance work",
            "Manage maintenance budgets and expenses"
          ]}
          examples={[
            "Assign a plumber to fix a reported leaking faucet within 24 hours",
            "Schedule preventative HVAC maintenance before summer",
            "Track costs for bathroom renovation project with receipts"
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
            "Generate reports for your rental business",
            "Set up document reminders for expirations"
          ]}
          examples={[
            "Create a new lease agreement using the standard residential template",
            "Send a lease renewal document for electronic signature",
            "Store property insurance documents with expiration reminders"
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
            "Set up payment reminders for tenants",
            "Analyze profitability by property",
            "Export data for tax preparation"
          ]}
          examples={[
            "Generate a quarterly profit and loss statement for all properties",
            "Track late payments and automate reminder emails",
            "Create custom financial reports for investor meetings"
          ]}
        />

        <GuideCard 
          icon={Calendar}
          title="Calendar & Scheduling"
          description="Manage important dates and appointments."
          steps={[
            "View upcoming lease expirations and renewals",
            "Schedule property showings for vacant units",
            "Set reminders for important deadlines",
            "Coordinate maintenance visits",
            "Plan property inspections"
          ]}
          examples={[
            "Schedule quarterly property inspections for all units",
            "Set reminders for property tax payment deadlines",
            "Coordinate move-in/move-out dates with tenants and cleaning services"
          ]}
        />

        <GuideCard 
          icon={ArrowUpDown}
          title="Tenant Turnover"
          description="Efficiently manage the tenant turnover process."
          steps={[
            "Create a move-out checklist for departing tenants",
            "Schedule and document final inspections",
            "Process security deposit returns",
            "Prepare units for new tenants",
            "List vacant properties for rent",
            "Screen new tenant applications"
          ]}
          examples={[
            "Conduct a final walkthrough using the digital inspection form",
            "Calculate and document security deposit deductions with photos",
            "Create a cleaning and maintenance schedule between tenants"
          ]}
        />
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <Settings className="mr-2 h-5 w-5" />
          Best Practices for Landlords
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-blue-700">
          <li>Keep property details and photos up-to-date to minimize vacancy periods</li>
          <li>Respond to maintenance requests within 24-48 hours to improve tenant satisfaction</li>
          <li>Document all tenant communications within the platform for legal protection</li>
          <li>Review financial reports monthly to identify trends and opportunities</li>
          <li>Stay informed about local rental regulations and update your policies accordingly</li>
          <li>Set up automatic rent payment reminders to reduce late payments</li>
          <li>Conduct regular property inspections to prevent major maintenance issues</li>
          <li>Build relationships with reliable service providers for faster maintenance resolution</li>
          <li>Use the document templates to ensure legally compliant leases and notices</li>
          <li>Implement consistent screening processes for all tenant applications</li>
        </ul>
      </div>

      <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 mt-4">
        <h3 className="flex items-center text-lg font-medium text-amber-800 mb-3">
          <AlertCircle className="mr-2 h-5 w-5" />
          Legal Compliance Tips
        </h3>
        <p className="text-amber-700 mb-3">Important considerations to maintain legal compliance:</p>
        <ul className="list-disc pl-5 space-y-2 text-amber-700">
          <li>Always use up-to-date, legally reviewed lease templates for your jurisdiction</li>
          <li>Follow local laws regarding security deposit handling and interest payments</li>
          <li>Adhere to fair housing laws in all advertising and tenant selection</li>
          <li>Maintain proper records of all maintenance requests and completions</li>
          <li>Provide required disclosures (lead paint, mold, etc.) before lease signing</li>
          <li>Follow proper notice procedures for inspections and lease terminations</li>
          <li>Consult with a local real estate attorney for specific legal questions</li>
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
