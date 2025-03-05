
import { formatDistanceToNow } from "date-fns";
import { Invoice } from "@/types/invoice";
import { useCurrency } from "@/hooks/useCurrency";
import { CheckCircle2, Clock, Calendar, Building, User, FileText, AlertTriangle, PercentIcon, ArrowLeftRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InvoiceActions } from "./InvoiceActions";

interface InvoiceDetailsProps {
  invoice: Invoice;
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => Promise<void>;
}

export function InvoiceDetails({ invoice, userRole, onStatusUpdate }: InvoiceDetailsProps) {
  const { formatAmount } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isPartial = invoice.metadata?.is_partial;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">Invoice for {invoice.property.name}</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 px-3 py-1`}>
            {getStatusIcon(invoice.status)}
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </span>
            <span className="font-medium">{formatDate(invoice.due_date)}</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Property
            </span>
            <span className="font-medium">{invoice.property.address}</span>
          </div>
          
          {invoice.tenant && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant
              </span>
              <span className="font-medium">
                {invoice.tenant.first_name} {invoice.tenant.last_name}
              </span>
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoice ID
            </span>
            <span className="font-medium text-sm">{invoice.id}</span>
          </div>
        </div>
        
        <Separator />
        
        {isPartial && (
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-3">
              <PercentIcon className="h-4 w-4" />
              Partial Invoice Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {invoice.metadata?.calculation_method === 'percentage' && (
                <>
                  <div>
                    <span className="text-gray-500">Calculation Method:</span>
                    <span className="font-medium ml-2">By Percentage</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Percentage Applied:</span>
                    <span className="font-medium ml-2">{invoice.metadata.partial_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Full Amount:</span>
                    <span className="font-medium ml-2">{formatAmount(invoice.metadata.full_amount || 0)}</span>
                  </div>
                </>
              )}
              
              {invoice.metadata?.calculation_method === 'days' && (
                <>
                  <div>
                    <span className="text-gray-500">Calculation Method:</span>
                    <span className="font-medium ml-2">By Days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Days Calculated:</span>
                    <span className="font-medium ml-2">{invoice.metadata.days_calculated} days</span>
                  </div>
                  {invoice.metadata.date_range && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Period:</span>
                      <span className="font-medium ml-2">
                        {formatDate(invoice.metadata.date_range.from)} - {formatDate(invoice.metadata.date_range.to)}
                      </span>
                    </div>
                  )}
                  {invoice.metadata.daily_rate && (
                    <div>
                      <span className="text-gray-500">Daily Rate:</span>
                      <span className="font-medium ml-2">{formatAmount(invoice.metadata.daily_rate)}</span>
                    </div>
                  )}
                  {invoice.metadata.full_amount && (
                    <div>
                      <span className="text-gray-500">Full Monthly Amount:</span>
                      <span className="font-medium ml-2">{formatAmount(invoice.metadata.full_amount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {invoice.metadata?.utilities_included && invoice.metadata.utilities_included.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Included Utilities</h3>
            <div className="space-y-2">
              {invoice.metadata.utilities_included.map((utility) => (
                <div key={utility.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{utility.type}</span>
                    {utility.percentage !== undefined && utility.original_amount && (
                      <span className="text-xs text-gray-500">
                        ({utility.percentage}% of {formatAmount(utility.original_amount)})
                      </span>
                    )}
                  </div>
                  <span>{formatAmount(utility.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {invoice.vat_rate > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700">VAT Information</h3>
            <div className="mt-2">
              <span className="text-sm text-gray-500">VAT Rate: {invoice.vat_rate}%</span>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md flex justify-between items-center">
          <span className="font-medium">Total Amount</span>
          <span className="text-xl font-bold">{formatAmount(invoice.amount)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 justify-end">
        {onStatusUpdate && (
          <InvoiceActions 
            invoiceId={invoice.id} 
            status={invoice.status} 
            userRole={userRole} 
            onStatusUpdate={onStatusUpdate} 
          />
        )}
      </CardFooter>
    </Card>
  );
}
