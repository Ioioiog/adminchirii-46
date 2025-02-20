import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { useProperties } from "@/hooks/useProperties";
import { Property } from "@/utils/propertyUtils";

export function DashboardProperties() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { properties, isLoading } = useProperties({ userRole: "landlord" });

  const filteredProperties = properties?.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PropertyFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <div>
        {filteredProperties?.map((property) => (
          <div key={property.id}>
            <h3>{property.name}</h3>
            <p>{property.address}</p>
            <p>Status: {property.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
