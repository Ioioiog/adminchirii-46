
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MeterReading {
  id: string;
  property_id: string;
  reading_type: string;
  reading_date: string;
  reading_value: number;
  tenant_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  property?: {
    name: string;
    address: string;
  } | null;
}

interface MeterReadingDetailsProps {
  reading: MeterReading;
}

export function MeterReadingDetails({ reading }: MeterReadingDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Property</p>
            <p className="text-lg font-semibold">{reading.property?.name || 'N/A'}</p>
            <p className="text-sm text-gray-600">{reading.property?.address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Reading Type</p>
            <p className="text-lg font-semibold capitalize">{reading.reading_type}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Date</p>
            <p className="text-lg font-semibold">{formatDate(reading.reading_date)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Value</p>
            <p className="text-lg font-semibold text-blue-600">{reading.reading_value}</p>
          </div>
        </div>

        {reading.notes && (
          <div>
            <p className="text-sm font-medium text-gray-500">Notes</p>
            <p className="text-md">{reading.notes}</p>
          </div>
        )}

        {reading.created_at && (
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-gray-500">
              Created: {formatDate(reading.created_at)}
              {reading.updated_at && reading.updated_at !== reading.created_at && 
                ` • Updated: ${formatDate(reading.updated_at)}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
