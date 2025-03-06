
import { useState, useEffect } from "react";
import { CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import { MeterReadingDialog } from "@/components/meter-readings/MeterReadingDialog";
import { MeterReadingList } from "@/components/meter-readings/MeterReadingList";
import { useProperties } from "@/hooks/useProperties";
import { UserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";

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

interface MeterReadingsSectionProps {
  userRole: UserRole;
}

export function MeterReadingsSection({ userRole }: MeterReadingsSectionProps) {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ensure userRole is one of the valid types for useProperties
  const role = (userRole === "landlord" || userRole === "tenant") 
    ? userRole 
    : "tenant" as const;

  const { properties } = useProperties({
    userRole: role
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setCurrentUserId(data.session.user.id);
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchReadings = async () => {
      setLoading(true);
      
      try {
        let query = supabase
          .from('meter_readings')
          .select(`
            *,
            property:properties(name, address)
          `);
          
        if (role === 'tenant') {
          query = query.eq('tenant_id', currentUserId);
        } else if (role === 'landlord') {
          query = query.in(
            'property_id', 
            properties.map(p => p.id)
          );
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching meter readings:", error);
          throw error;
        }
        
        setReadings(data || []);
      } catch (error) {
        console.error("Failed to load meter readings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReadings();
  }, [currentUserId, role, properties]);

  const handleReadingCreated = async () => {
    // Refetch readings when a new reading is created
    if (!currentUserId) return;
    
    try {
      let query = supabase
        .from('meter_readings')
        .select(`
          *,
          property:properties(name, address)
        `);
        
      if (role === 'tenant') {
        query = query.eq('tenant_id', currentUserId);
      } else if (role === 'landlord') {
        query = query.in(
          'property_id', 
          properties.map(p => p.id)
        );
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching meter readings:", error);
        throw error;
      }
      
      setReadings(data || []);
    } catch (error) {
      console.error("Failed to reload meter readings:", error);
    }
  };

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
        <MeterReadingDialog 
          properties={properties} 
          onReadingCreated={handleReadingCreated} 
          userRole={role} 
          userId={currentUserId} 
        />
      </div>
      
      {loading ? (
        <div className="text-center py-6">Loading meter readings...</div>
      ) : (
        <MeterReadingList 
          readings={readings} 
          userRole={role} 
          onUpdate={handleReadingCreated} 
        />
      )}
    </div>
  );
}
