
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ServiceCategory = Database["public"]["Enums"]["service_category"];

interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  base_price: number | null;
  price_unit: string | null;
  currency: string;
}

interface ServiceListProps {
  onEdit: (service: Service) => void;
}

export function ServiceList({ onEdit }: ServiceListProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('service-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_provider_services'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchServices(); // Refresh the list when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      console.log("Fetching services for provider:", user.id);

      const { data, error } = await supabase
        .from("service_provider_services")
        .select("*")
        .eq("provider_id", user.id);

      if (error) throw error;
      console.log("Fetched services:", data);
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("service_provider_services")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setServices(services.filter(service => service.id !== id));
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div>
            <h3 className="font-medium">{service.name}</h3>
            <p className="text-sm text-muted-foreground">{service.category}</p>
            {service.description && (
              <p className="text-sm mt-1">{service.description}</p>
            )}
            {service.base_price && (
              <p className="text-sm">
                Price: {service.base_price} {service.currency} {service.price_unit}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(service)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(service.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {services.length === 0 && (
        <p className="text-center text-muted-foreground">
          No services added yet.
        </p>
      )}
    </div>
  );
}
