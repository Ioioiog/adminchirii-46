
import React from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PgCryptoNote() {
  return (
    <Alert variant="destructive" className="mb-4 border-amber-300 bg-amber-50">
      <Info className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800">Database Extension Required</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mt-1">
          Your database administrator needs to enable the pgcrypto extension in Supabase SQL editor with this command:
        </p>
        <div className="mt-2 relative">
          <pre className="text-xs bg-amber-100 p-3 rounded overflow-x-auto">
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
          </pre>
          <button 
            className="absolute top-2 right-2 text-xs px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded"
            onClick={() => {
              navigator.clipboard.writeText('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
            }}
          >
            Copy
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
