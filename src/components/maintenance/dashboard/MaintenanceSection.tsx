
import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoDataCard } from "@/components/dashboard/charts/NoDataCard";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  tenant: {
    first_name: string;
    last_name: string;
  };
  property: {
    name: string;
  };
}

interface MaintenanceSectionProps {
  title: string;
  description: string;
  requests: MaintenanceRequest[];
  onRequestClick: (id: string) => void;
}

export function MaintenanceSection({
  title,
  description,
  requests,
  onRequestClick,
}: MaintenanceSectionProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      
      {requests.length > 0 ? (
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRequestClick(request.id)}
                >
                  <TableCell className="font-medium">
                    {request.title}
                  </TableCell>
                  <TableCell>{request.property.name}</TableCell>
                  <TableCell>
                    {request.tenant.first_name} {request.tenant.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <NoDataCard 
          title={title}
          message="No maintenance requests found"
        />
      )}
    </Card>
  );
}
