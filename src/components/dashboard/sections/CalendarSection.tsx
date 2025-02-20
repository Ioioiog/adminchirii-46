import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, setDate, isSameMonth, isSameDay, parseISO, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Event {
  date: Date;
  title: string;
  type: 'payment' | 'maintenance' | 'contract' | 'tenancy' | 'invoice';
  property?: { name: string };
  amount?: number;
  status?: string;
  description?: string;
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

const getEventIcon = (type: Event['type']) => {
  switch (type) {
    case 'payment':
      return '💰';
    case 'maintenance':
      return '🔧';
    case 'contract':
      return '📄';
    case 'tenancy':
      return '🏠';
    case 'invoice':
      return '📃';
    default:
      return '📅';
  }
};

const getEventUrgency = (event: Event): { color: string; text: string } => {
  if (isToday(event.date)) {
    return { color: 'text-yellow-600', text: 'Today' };
  }
  if (event.date < new Date()) {
    return { color: 'text-red-600', text: 'Overdue' };
  }
  return { color: 'text-green-600', text: 'Upcoming' };
};

export function CalendarSection() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

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
    if (!events.length) return [];
    return events.filter(event => 
      selectedDate 
        ? isSameDay(event.date, selectedDate)
        : isSameMonth(event.date, currentMonth)
    );
  }, [events, currentMonth, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || null);
  };

  const clearSelection = () => {
    setSelectedDate(null);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  return (
    <Card className="col-span-full lg:col-span-4 bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 backdrop-blur-sm border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Calendar</h3>
          </div>
          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="hover:bg-primary/5 transition-colors"
            >
              Back to Month View
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative p-6 rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 rounded-xl" />
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              className="relative z-10 mx-auto bg-transparent"
              onMonthChange={setCurrentMonth}
            />
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-600">
                {selectedDate 
                  ? `Events for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : `Events for ${format(currentMonth, 'MMMM yyyy')}`
                }
              </h4>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {filteredEvents.length} Events
              </Badge>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-sm text-gray-500">Loading events...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <ScrollArea className="h-[420px] rounded-xl border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="space-y-3 p-4">
                  {filteredEvents.map((event, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50/80 transition-all duration-200 border border-gray-100/80 shadow-sm hover:shadow-md"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-50/80 backdrop-blur-sm">
                          <span className="text-xl" role="img" aria-label={event.type}>
                            {getEventIcon(event.type)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          <span className="text-xs text-gray-500">
                            {format(event.date, 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${getBadgeColor(event.type)} shadow-sm`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[420px] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-sm text-gray-500">
                  No events {selectedDate ? 'on this day' : 'this month'}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-none shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                {selectedEvent && (
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-2xl" role="img" aria-label={selectedEvent.type}>
                      {getEventIcon(selectedEvent.type)}
                    </span>
                  </div>
                )}
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Event Details
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              <div className="space-y-2 bg-white/50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500">Title</h4>
                <p className="text-base text-gray-900">{selectedEvent.title}</p>
              </div>

              <Separator className="bg-gray-100" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 bg-white/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-sm text-gray-500">Date</h4>
                  </div>
                  <p className="text-base text-gray-900">{format(selectedEvent.date, 'MMMM d, yyyy')}</p>
                  <span className={`text-sm font-medium ${getEventUrgency(selectedEvent).color}`}>
                    {getEventUrgency(selectedEvent).text}
                  </span>
                </div>

                <div className="space-y-2 bg-white/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-sm text-gray-500">Type</h4>
                  </div>
                  <Badge className={`${getBadgeColor(selectedEvent.type)} shadow-sm`}>
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedEvent.property && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-sm text-gray-500">Property</h4>
                    </div>
                    <p className="text-base">{selectedEvent.property.name}</p>
                  </div>
                </>
              )}

              {selectedEvent.amount && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Amount</h4>
                    <p className="text-base font-semibold">
                      ${selectedEvent.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              )}

              {selectedEvent.status && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Status</h4>
                    <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </Badge>
                  </div>
                </>
              )}

              {selectedEvent.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-500">Description</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
