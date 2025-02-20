import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, setDate, isSameMonth, isSameDay, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  date: Date;
  title: string;
  type: 'payment' | 'maintenance' | 'contract' | 'tenancy' | 'invoice';
}

const getBadgeColor = (type: Event['type']) => {
  switch (type) {
    case 'payment':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-blue-100 text-blue-800';
    case 'contract':
      return 'bg-purple-100 text-purple-800';
    case 'tenancy':
      return 'bg-orange-100 text-orange-800';
    case 'invoice':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function CalendarSection() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = React.useState<'month' | 'day'>('month');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            amount,
            due_date,
            tenancy:tenancies (
              property:properties (name)
            )
          `)
          .eq('status', 'pending');

        if (paymentsError) throw paymentsError;

        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select(`
            title,
            scheduled_date,
            property:properties (name)
          `)
          .in('status', ['pending', 'in_progress']);

        if (maintenanceError) throw maintenanceError;

        const { data: contracts, error: contractsError } = await supabase
          .from('contracts')
          .select(`
            valid_until,
            property:properties (name)
          `)
          .eq('status', 'signed');

        if (contractsError) throw contractsError;

        const { data: tenancies, error: tenanciesError } = await supabase
          .from('tenancies')
          .select(`
            start_date,
            end_date,
            monthly_pay_day,
            property:properties (name)
          `)
          .eq('status', 'active');

        if (tenanciesError) throw tenanciesError;

        const events: Event[] = [
          ...payments.map(payment => ({
            date: parseISO(payment.due_date),
            title: `Rent Payment Due - ${payment.tenancy.property.name}`,
            type: 'payment' as const
          })),

          ...maintenance
            .filter(m => m.scheduled_date)
            .map(m => ({
              date: parseISO(m.scheduled_date!),
              title: `${m.title} - ${m.property.name}`,
              type: 'maintenance' as const
            })),

          ...contracts
            .filter(c => c.valid_until)
            .map(c => ({
              date: parseISO(c.valid_until!),
              title: `Contract Renewal - ${c.property.name}`,
              type: 'contract' as const
            })),

          ...tenancies.map(tenancy => ({
            date: parseISO(tenancy.start_date),
            title: `Tenancy Starts - ${tenancy.property.name}`,
            type: 'tenancy' as const
          })),

          ...tenancies
            .filter(t => t.end_date)
            .map(tenancy => ({
              date: parseISO(tenancy.end_date!),
              title: `Tenancy Ends - ${tenancy.property.name}`,
              type: 'tenancy' as const
            })),

          ...tenancies.map(tenancy => {
            const currentDate = new Date();
            const invoiceDate = setDate(currentDate, tenancy.monthly_pay_day || 1);
            return {
              date: invoiceDate,
              title: `Invoice Generation - ${tenancy.property.name}`,
              type: 'invoice' as const
            };
          })
        ];

        return events;
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch calendar events"
        });
        return [];
      }
    }
  });

  const filteredEvents = React.useMemo(() => {
    if (!selectedDate || !events.length) return [];

    return viewMode === 'day'
      ? events.filter(event => isSameDay(event.date, selectedDate))
      : events.filter(event => isSameMonth(event.date, selectedDate));
  }, [selectedDate, events, viewMode]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (isSameDay(date, selectedDate)) {
      setViewMode('day');
    } else {
      setViewMode('month');
    }
    
    setSelectedDate(date);
  };

  console.log('Selected Date:', selectedDate);
  console.log('View Mode:', viewMode);
  console.log('Filtered Events:', filteredEvents);

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Calendar</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-500">
              {selectedDate 
                ? viewMode === 'month'
                  ? `Events for ${format(selectedDate, 'MMMM yyyy')}`
                  : `Events for ${format(selectedDate, 'MMMM d, yyyy')}`
                : 'Select a date'
              }
            </h4>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading events...</p>
            ) : filteredEvents.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="space-y-3 p-4">
                  {filteredEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{event.title}</span>
                        <span className="text-xs text-gray-500">
                          {format(event.date, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <Badge className={getBadgeColor(event.type)}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-gray-500">
                No events {viewMode === 'month' ? 'this month' : 'on this day'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
