
import React from "react";
import { UserCircle, Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "@/types/contract";

interface LandlordTabProps {
  propertyId: string;
}

export function LandlordTab({ propertyId }: LandlordTabProps) {
  const { data: contract } = useQuery({
    queryKey: ['property-contract', propertyId],
    queryFn: async () => {
      console.log('Fetching contract for property:', propertyId);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'signed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contract:', error);
        throw error;
      }
      
      console.log('Contract details:', data);
      return data;
    }
  });

  const landlordInfo = (contract?.metadata as unknown as FormData) || {} as FormData;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">Landlord Information</h3>
      <div className="grid gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <UserCircle className="h-4 w-4" />
          <span className="font-medium">{landlordInfo.ownerName || 'Not specified'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-4 w-4" />
          <span>{landlordInfo.ownerEmail || 'Email not provided'}</span>
        </div>
        {landlordInfo.ownerPhone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{landlordInfo.ownerPhone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
