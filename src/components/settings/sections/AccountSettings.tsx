
import { useState, useEffect } from "react";
import { PersonalInfoForm } from "../PersonalInfoForm";
import { PasswordForm } from "../PasswordForm";
import { supabase } from "@/integrations/supabase/client";

export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: null,
    last_name: null,
    email: null,
    phone: null
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error("No user found");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, phone")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          return;
        }

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and account security
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update your personal details and contact information
            </p>
            <PersonalInfoForm 
              initialProfile={profile}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-1">Security</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your password and security preferences
            </p>
            <PasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
