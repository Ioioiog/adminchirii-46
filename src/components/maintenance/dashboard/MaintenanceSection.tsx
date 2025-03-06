
import React from "react";
import { Card } from "@/components/ui/card";
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
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      default:
        return null;
    }
  };

  const getIssueEmoji = (title: string) => {
    if (title.toLowerCase().includes('leak')) return '🚰';
    if (title.toLowerCase().includes('ac')) return '❄️';
    if (title.toLowerCase().includes('window')) return '🪟';
    return '🔧';
  };

  if (!Array.isArray(requests) || requests.length === 0) {
    return (
      <NoDataCard 
        title={title}
        message="No maintenance requests found"
      />
    );
  }

  return (
    <div className="rounded-lg border bg-white/50 backdrop-blur-sm shadow-sm">
      <div className="space-y-4">
        <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-muted font-medium text-sm rounded-t-lg">
          <div>Status</div>
          <div>Property</div>
          <div>Issue</div>
          <div>Priority</div>
          <div>Assigned To</div>
          <div>Due Date</div>
        </div>
        
        <div className="p-4 space-y-2">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-0 shadow-none hover:shadow-sm"
              onClick={() => onRequestClick(request.id)}
            >
              <div className="grid grid-cols-6 gap-4 items-center text-sm">
                <div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="font-medium">
                  {request.property.name}
                </div>

                <div className="flex items-center gap-2">
                  <span>{getIssueEmoji(request.title)}</span>
                  <span>{request.title}</span>
                </div>

                <div>
                  {getPriorityBadge(request.priority)}
                </div>

                <div className="text-blue-600 font-medium">
                  {request.assigned_to || 'Not assigned'}
                </div>

                <div>
                  {request.scheduled_date 
                    ? format(new Date(request.scheduled_date), 'MMM d')
                    : '-'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
