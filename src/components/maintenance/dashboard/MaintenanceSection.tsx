
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
      case 'pending':
        return <Badge className="bg-violet-100 text-violet-800">🆕 New</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">⚡ Active</Badge>;
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
    <div className="rounded-lg border bg-white/50 backdrop-blur-sm shadow-sm">
      {requests.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-muted font-medium text-sm rounded-t-lg">
            <div>🔄 Status</div>
            <div>🏡 Property</div>
            <div>🔧 Issue</div>
            <div>⚠️ Priority</div>
            <div>👤 Assigned To</div>
            <div>📅 Due Date</div>
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

                  <div>
                    {request.assigned_to || '-'}
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
      ) : (
        <NoDataCard 
          title={title}
          message="No maintenance requests found"
        />
      )}
    </div>
  );
}
