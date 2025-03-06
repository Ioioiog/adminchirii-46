
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StripeAccountForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLandlord, setIsLandlord] = useState(false);
  const { toast } = useToast();
  const [stripeConnected, setStripeConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        setIsLandlord(profile?.role === 'landlord');
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  const checkStripeConnection = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setStripeConnected(!!profile?.stripe_account_id);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
    }
  };

  // Check connection status on mount
  useEffect(() => {
    checkStripeConnection();
  }, []);

  const handleConnectStripe = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        method: 'POST',
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get Stripe connect URL');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      setError("There was an error connecting to Stripe. You may need to set up a Stripe Connect account first.");
      toast({
        title: "Error",
        description: "Failed to connect Stripe account. Please make sure your Stripe Connect is properly configured.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ stripe_account_id: null })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setStripeConnected(false);
      toast({
        title: "Success",
        description: "Stripe account disconnected successfully",
      });
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Stripe account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLandlord) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Stripe Dashboard</CardTitle>
          <CardDescription>
            Access your Stripe dashboard to manage payments and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stripe provides payment processing for your properties. Sign in to your Stripe account to view payments, manage settings and more.
          </p>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                window.open('https://dashboard.stripe.com/dashboard', '_blank');
              }}
              className="bg-blue-500 hover:bg-blue-400 text-white w-full"
            >
              Access Stripe Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe API Keys</CardTitle>
          <CardDescription>
            Configure your Stripe API keys to enable payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure your Stripe API keys to enable payment processing.
          </p>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                window.open('https://dashboard.stripe.com/apikeys', '_blank');
              }}
              className="bg-blue-500 hover:bg-blue-400 text-white"
            >
              Get Stripe API Keys
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments from tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Stripe account to receive payments from tenants.
          </p>
          {stripeConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600">
                ✓ Your Stripe account is connected
              </p>
              <Button
                variant="destructive"
                onClick={handleDisconnectStripe}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-400"
              >
                {isLoading ? "Disconnecting..." : "Disconnect Stripe"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleConnectStripe}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-400 text-white w-full"
              >
                {isLoading ? "Connecting..." : "Connect Stripe Account"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: You need to have a Stripe account already. This will direct you to Stripe's dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
