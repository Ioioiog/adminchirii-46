
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Event {
  date: Date;
  title: string;
  type: 'payment' | 'maintenance' | 'contract';
}

// In a real app, this would come from your backend
const demoEvents: Event[] = [
  {
    date: new Date(2024, 3, 15),
    title: "Rent Payment Due",
    type: "payment"
  },
  {
    date: new Date(2024, 3, 20),
    title: "Maintenance Check",
    type: "maintenance"
  },
  {
    date: new Date(2024, 3, 25),
    title: "Contract Renewal",
    type: "contract"
  }
];

const getBadgeColor = (type: Event['type']) => {
  switch (type) {
    case 'payment':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-blue-100 text-blue-800';
    case 'contract':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function CalendarSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const selectedDateEvents = demoEvents.filter(
    event => date && format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

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
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-500">
              {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
            </h4>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{event.title}</span>
                    <Badge className={getBadgeColor(event.type)}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No events scheduled for this date</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
