
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface ContractErrorProps {
  showDashboard: boolean;
  error: Error | unknown;
  onBack: () => void;
}

export function ContractError({ showDashboard, error, onBack }: ContractErrorProps) {
  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      {showDashboard && (
        <div className="print:hidden">
          <DashboardSidebar />
        </div>
      )}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Error Loading Contract</h1>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500">
                {error instanceof Error ? error.message : 'Failed to load contract details'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
