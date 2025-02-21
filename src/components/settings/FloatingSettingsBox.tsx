
import { useState } from "react";
import { Settings, Globe, DollarSign, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSidebarNotifications } from "@/hooks/use-sidebar-notifications";
import { format } from "date-fns";

export function FloatingSettingsBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { i18n } = useTranslation();
  const { availableCurrencies } = useCurrency();
  const { toast } = useToast();
  const { data: notifications, markAsRead } = useSidebarNotifications();

  const totalNotifications = notifications?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  const handleLanguageChange = (value: string) => {
    localStorage.setItem('language', value);
    i18n.changeLanguage(value);
    toast({
      title: "Language Updated",
      description: "Your language preference has been saved.",
    });
  };

  const handleCurrencyChange = async (value: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('profiles')
        .update({ currency_preference: value })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Currency Updated",
        description: "Your currency preference has been saved.",
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency preference",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = async (type: string) => {
    try {
      await markAsRead(type);
      toast({
        title: "Notifications Cleared",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications have been marked as read.`,
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-8 right-8 z-40 flex items-center gap-2">
      {/* Notifications Button */}
      <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 bg-white relative"
            aria-label={`Notifications ${totalNotifications > 0 ? `(${totalNotifications} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                {totalNotifications}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-white p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Notifications</h3>
            <span className="text-sm text-gray-500">Last 5 notifications per type</span>
          </div>
          
          {notifications?.map((notification) => (
            notification.count > 0 && (
              <div key={notification.type} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="capitalize font-medium">{notification.type}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleNotificationClick(notification.type)}
                    className="text-xs hover:text-blue-600"
                  >
                    Mark all as read
                  </Button>
                </div>
                {notification.items?.map((item) => (
                  <DropdownMenuItem 
                    key={item.id}
                    className="flex flex-col items-start gap-1 cursor-pointer py-2"
                  >
                    <span className="text-sm">{item.message}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )
          ))}
          
          {(!notifications || notifications.every(n => n.count === 0)) && (
            <p className="text-sm text-gray-500">No new notifications</p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Button */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 bg-white">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <div className="p-2 space-y-2">
            {/* Language Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </label>
              <select
                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                value={localStorage.getItem('language') || 'en'}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="en">English</option>
                <option value="ro">Română</option>
              </select>
            </div>

            {/* Currency Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <select
                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
