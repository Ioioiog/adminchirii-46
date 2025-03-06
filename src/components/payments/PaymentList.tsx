
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Payment } from "@/integrations/supabase/types/payment";
import { FileText } from "lucide-react";

export interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
  userRole: "landlord" | "tenant";
  userId: string;
  propertyFilter: string;
  statusFilter: string;
  searchTerm: string;
}

export function PaymentList({
  payments,
  isLoading,
  userRole,
  userId,
  propertyFilter,
  statusFilter,
  searchTerm
}: PaymentListProps) {
  if (isLoading) {
    return <p>Loading payments...</p>;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <div className="flex flex-col items-center space-y-3">
          <FileText className="h-10 w-10 text-gray-400" />
          <p className="text-gray-500">No payments found.</p>
          {userRole === "landlord" && (
            <p className="text-sm text-gray-400">
              Payments will appear here when you mark invoices as paid.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenancy</TableHead>
            {userRole === "landlord" && <TableHead>Tenant</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{payment.tenancy.property.name}</div>
                  <div className="text-sm text-gray-500">{payment.tenancy.property.address}</div>
                </div>
              </TableCell>
              {userRole === "landlord" && (
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {payment.tenancy.tenant.first_name} {payment.tenancy.tenant.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{payment.tenancy.tenant.email}</div>
                  </div>
                </TableCell>
              )}
              <TableCell className="font-medium text-blue-600">
                {payment.amount}
              </TableCell>
              <TableCell>{format(new Date(payment.due_date), "PPP")}</TableCell>
              <TableCell>
                {payment.paid_date ? format(new Date(payment.paid_date), "PPP") : "N/A"}
              </TableCell>
              <TableCell>
                <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                  {payment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
