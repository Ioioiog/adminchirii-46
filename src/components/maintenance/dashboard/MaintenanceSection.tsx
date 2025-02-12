
import React from "react";
import { Card } from "@/components/ui/card";
import { NoDataCard } from "@/components/dashboard/charts/NoDataCard";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home, Wrench, AlertCircle, AlertOctagon, CheckCircle, Loader2, Clock, CheckSquare, User, Calendar } from "lucide-react";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  scheduled_date?: string | null;
  assigned_to?: string | null;
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
  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertOctagon className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckSquare className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      
      {requests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRequestClick(request.id)}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Home className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{request.property.name}</h3>
                      <p className="text-sm text-gray-500">
                        {request.tenant.first_name} {request.tenant.last_name}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(request.status)}
                    {request.status}
                  </Badge>
                </div>

                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-gray-500" />
                  <p className="text-sm">{request.title}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(request.priority)}
                    <span className="text-sm">{request.priority}</span>
                  </div>

                  {request.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{request.assigned_to}</span>
                    </div>
                  )}

                  {request.scheduled_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{format(new Date(request.scheduled_date), 'MMM d')}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
