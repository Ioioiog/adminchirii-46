import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceAreaSectionProps {
  serviceAreas: string[] | null;
  onAreasUpdate: (areas: string[]) => void;
}

export function ServiceAreaSection({ serviceAreas, onAreasUpdate }: ServiceAreaSectionProps) {
  const [newArea, setNewArea] = useState("");
  const { toast } = useToast();

  const handleAddArea = async () => {
    if (!newArea.trim()) return;

    try {
      const updatedAreas = [...(serviceAreas || []), newArea.trim()];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("service_provider_profiles")
        .update({ service_area: updatedAreas })
        .eq("id", user.id);

      if (error) throw error;

      onAreasUpdate(updatedAreas);
      setNewArea("");
      toast({
        title: "Success",
        description: "Service area added successfully",
      });
    } catch (error) {
      console.error("Error adding service area:", error);
      toast({
        title: "Error",
        description: "Failed to add service area",
        variant: "destructive",
      });
    }
  };

  const handleRemoveArea = async (areaToRemove: string) => {
    try {
      const updatedAreas = serviceAreas?.filter(area => area !== areaToRemove) || [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("service_provider_profiles")
        .update({ service_area: updatedAreas })
        .eq("id", user.id);

      if (error) throw error;

      onAreasUpdate(updatedAreas);
      toast({
        title: "Success",
        description: "Service area removed successfully",
      });
    } catch (error) {
      console.error("Error removing service area:", error);
      toast({
        title: "Error",
        description: "Failed to remove service area",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Areas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Add new service area (e.g., New York City)"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddArea();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddArea}>Add Area</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {serviceAreas?.map((area, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{area}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArea(area)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}