
import { CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import { MeterReadingDialog } from "@/components/meter-readings/MeterReadingDialog";
import { MeterReadingList } from "@/components/meter-readings/MeterReadingList";
import { useProperties } from "@/hooks/useProperties";
import { UserRole } from "@/hooks/use-user-role";

interface MeterReadingsSectionProps {
  userRole: UserRole;
}

export function MeterReadingsSection({ userRole }: MeterReadingsSectionProps) {
  // Ensure userRole is one of the valid types for useProperties
  const role = (userRole === "landlord" || userRole === "tenant") 
    ? userRole 
    : "tenant" as const;

  const { properties } = useProperties({
    userRole: role
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-xl">
              <Gauge className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Meter Readings</CardTitle>
              <p className="text-gray-500 mt-1">
                Track and manage utility meter readings for your properties.
              </p>
            </div>
          </div>
        </div>
        <MeterReadingDialog properties={properties} onReadingCreated={() => {}} userRole={role} userId={null} />
      </div>
      <MeterReadingList readings={[]} userRole={role} onUpdate={() => {}} />
    </div>
  );
}
