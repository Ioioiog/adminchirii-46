
import React from 'react';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useProviderForm, ProviderFormData } from './hooks/useProviderForm';
import { GeneralInfoSection } from './components/GeneralInfoSection';
import { CredentialsSection } from './components/CredentialsSection';
import { AdditionalDetailsSection } from './components/AdditionalDetailsSection';
import { ErrorNotification } from './components/ErrorNotification';
import { PgCryptoNote } from './components/PgCryptoNote';

export interface ProviderFormProps {
  landlordId: string;
  onSubmit: () => void;
  onClose?: () => void;
  onSuccess?: () => void;
  provider?: any;
}

export function ProviderForm({ landlordId, onSubmit, onClose, onSuccess, provider }: ProviderFormProps) {
  const {
    form,
    properties,
    loading,
    errorMessage,
    onSubmitForm
  } = useProviderForm({ landlordId, onSubmit, onClose, onSuccess, provider });

  // Show the PgCryptoNote immediately if there's a pgcrypto-related error
  const showPgCryptoNote = errorMessage?.includes('pgcrypto') || false;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
        <ErrorNotification errorMessage={errorMessage} />
        
        {/* Show PgCryptoNote prominently if we have a pgcrypto error */}
        {showPgCryptoNote && <PgCryptoNote />}
        
        <GeneralInfoSection form={form} properties={properties} />
        <CredentialsSection form={form} isUpdate={!!provider?.id} />
        <AdditionalDetailsSection form={form} />

        <div className="pt-4">
          {/* Always display the note about pgcrypto extension at the bottom */}
          {!showPgCryptoNote && <PgCryptoNote />}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
