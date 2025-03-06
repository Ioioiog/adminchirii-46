
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/hooks/useCurrency";

interface RevenueDetail {
  property_name: string;
  amount: number;
  due_date: string;
  status: string;
}

interface RevenueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenueDetails?: RevenueDetail[];
}

export function RevenueDetailsModal({ open, onOpenChange, revenueDetails }: RevenueDetailsModalProps) {
  const { formatAmount } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Monthly Revenue Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {revenueDetails && revenueDetails.length > 0 ? (
            revenueDetails.map((detail, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{detail.property_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(detail.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatAmount(detail.amount, 'EUR')}</p>
                    <span className={`text-sm ${
                      detail.status === 'paid' 
                        ? 'text-green-600' 
                        : detail.status === 'pending' 
                          ? 'text-orange-600' 
                          : 'text-red-600'
                    }`}>
                      {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No revenue details available for this month
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
