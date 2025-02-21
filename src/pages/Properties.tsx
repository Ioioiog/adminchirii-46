import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const Properties = () => {
  const [properties, setProperties] = useState([]);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <ScrollArea className="flex-1">
        <div className="p-8 bg-zinc-100">
          {/* Content inside the padding div */}
          {properties.map((property) => (
            <div key={property.id} className="mb-4">
              <h2 className="text-lg font-semibold">{property.name}</h2>
              <p>{property.description}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Properties;
