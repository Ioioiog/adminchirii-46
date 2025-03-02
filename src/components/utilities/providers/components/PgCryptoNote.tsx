
import React from 'react';

export function PgCryptoNote() {
  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-sm text-amber-700">
        <strong>Note:</strong> If you are encountering errors when adding or updating providers, your database administrator 
        needs to enable the pgcrypto extension in Supabase SQL editor with this command:
      </p>
      <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
      </pre>
    </div>
  );
}
