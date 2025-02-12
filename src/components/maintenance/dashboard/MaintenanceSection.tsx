
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
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">🔴 High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">🟡 Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🟢 Low</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">🔧 In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Waiting Review</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
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

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      
      {requests.length > 0 ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRequestClick(request.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏡</span>
                    <span className="font-medium">{request.property.name}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <span>{getIssueEmoji(request.title)}</span>
                  <span>{request.title}</span>
                </div>

                <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600">
                  <div>{getPriorityBadge(request.priority)}</div>
                  
                  <div className="flex items-center gap-1">
                    <span>👤</span>
                    <span>{request.assigned_to || '-'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>
                      {request.scheduled_date 
                        ? format(new Date(request.scheduled_date), 'MMM d')
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span>👤</span>
                  <span>{request.tenant.first_name} {request.tenant.last_name}</span>
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
