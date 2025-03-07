
import { useState, useEffect } from "react";
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
import { useSidebarNotifications } from "@/hooks/use-sidebar-notifications";
import { NotificationType } from "@/types/notifications";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function FloatingSettingsBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<string>("");
  const { i18n } = useTranslation();
  const { availableCurrencies, currency } = useCurrency();
  const { toast } = useToast();
  const { data: notifications, markAsRead } = useSidebarNotifications();
  const navigate = useNavigate();

  // Initialize current currency from the useCurrency hook
  useEffect(() => {
    if (currency) {
      setCurrentCurrency(currency);
    }
  }, [currency]);

  // Calculate total notifications by summing up all notification counts
  const totalNotifications = notifications?.reduce((total, notification) => {
    return total + (notification.count || 0);
  }, 0) || 0;

  const handleNotificationClick = async (type: NotificationType, messageId?: string) => {
    try {
      console.log('Handling notification click:', { type, messageId });
      await markAsRead(type, messageId);
      
      let targetRoute = '';
      
      switch (type) {
        case 'messages':
          targetRoute = '/chat';
          break;
        case 'maintenance':
          targetRoute = '/maintenance';
          break;
        case 'payments':
          targetRoute = '/payments';
          break;
      }

      console.log('Attempting to navigate to:', targetRoute);
      
      setIsNotificationsOpen(false);
      
      setTimeout(() => {
        console.log('Executing navigation to:', targetRoute);
        navigate(targetRoute);
      }, 100);
      
      toast({
        title: "Notifications Cleared",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications have been marked as read.`,
      });
    } catch (error) {
      console.error('Error in notification click handler:', error);
      toast({
        title: "Error",
        description: "Failed to handle notification",
        variant: "destructive",
      });
    }
  };

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

      // Update local state immediately for better UX
      setCurrentCurrency(value);
      
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

  console.log('Floating notifications total:', totalNotifications);
  console.log('Notifications data:', notifications);

  return (
    <div className="fixed top-8 right-8 z-40 flex items-center gap-2">
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
        <DropdownMenuContent align="end" className="w-64 bg-white p-4">
          <h3 className="font-semibold mb-2">Notifications</h3>
          {notifications?.some(n => n.count > 0) ? (
            notifications.map((notification) => (
              notification.count > 0 && notification.items && notification.items.map((item) => (
                <DropdownMenuItem 
                  key={item.id} 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => handleNotificationClick(notification.type, item.id)}
                >
                  <span>{item.message}</span>
                </DropdownMenuItem>
              ))
            ))
          ) : (
            <p className="text-sm text-gray-500">No new notifications</p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 bg-white">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <div className="p-2 space-y-2">
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

            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <select
                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                value={currentCurrency}
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
