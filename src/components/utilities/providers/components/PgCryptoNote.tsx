
import React from 'react';
import { Info } from 'lucide-react';

export function PgCryptoNote() {
  return (
    <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md shadow-sm">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Important: Database Extension Required</h3>
          <p className="text-sm text-yellow-700 mt-1">
            If you are encountering errors when adding or updating providers, your database administrator 
            needs to enable the pgcrypto extension in Supabase SQL editor with this command:
          </p>
          <div className="mt-2 relative">
            <pre className="text-xs bg-yellow-100 p-3 rounded overflow-x-auto">
              CREATE EXTENSION IF NOT EXISTS pgcrypto;
            </pre>
            <button 
              className="absolute top-2 right-2 text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded"
              onClick={() => {
                navigator.clipboard.writeText('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
