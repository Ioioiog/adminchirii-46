
import { useState, useEffect } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InvoiceFormProps } from "@/types/invoice";
import { format } from "date-fns";
import { AlertCircle, Building, User, Calendar, DollarSign } from "lucide-react";
import { InvoiceSummary } from "./components/InvoiceSummary";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { getAdjustedUtilityAmount } from "./utils/invoiceCalculations";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InvoiceForm({ onSuccess, userId, userRole, calculationData }: InvoiceFormProps) {
  const {
    form,
    propertyId,
    selectedProperty,
    setSelectedProperty,
    isLoading,
    properties,
    tenants,
    utilities,
    applyVat,
    vatRate,
    invoiceCurrency,
    rentAlreadyInvoiced,
    invoicedPeriod,
    handleUtilitySelection,
    getAdjustedAmount,
    calculateVatAmount,
    calculateTotal,
    onSubmit
  } = useInvoiceForm(userId, userRole, calculationData, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-slate-500" />
                      Property
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const prop = properties.find((p) => p.id === value);
                        setSelectedProperty(prop || null);
                      }}
                      value={field.value || ""}
                      disabled={isLoading || !!calculationData?.propertyId}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} ({property.monthly_rent} {property.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userRole === "landlord" && (
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-500" />
                        Tenant
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoading || !propertyId}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.first_name} {tenant.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      Due Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""}
                        disabled={isLoading}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        Rent Amount
                      </span>
                      <span className="text-xs text-slate-500">({selectedProperty?.currency || invoiceCurrency})</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading || !!calculationData?.rentAmount || rentAlreadyInvoiced}
                        className="bg-white"
                      />
                    </FormControl>
                    {rentAlreadyInvoiced && (
                      <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> 
                        Rent already invoiced for this period
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {rentAlreadyInvoiced && invoicedPeriod && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Rent already invoiced</AlertTitle>
            <AlertDescription className="text-amber-700">
              Rent has already been invoiced for this property from {format(invoicedPeriod.from, 'MMM d, yyyy')} to {format(invoicedPeriod.to, 'MMM d, yyyy')}.
              {form.getValues("amount") === 0 ? " Only utilities will be included in this invoice." : " Adding rent again may result in double-charging."}
            </AlertDescription>
          </Alert>
        )}

        <InvoiceSummary 
          calculationData={calculationData}
          invoiceCurrency={invoiceCurrency}
          rentAlreadyInvoiced={rentAlreadyInvoiced}
          applyVat={applyVat}
          vatRate={vatRate}
          vatAmount={calculateVatAmount()}
          grandTotal={calculationData?.grandTotal || 0}
          utilities={utilities}
          onUtilitySelection={handleUtilitySelection}
          getAdjustedUtilityAmount={(util) => getAdjustedUtilityAmount(util, calculationData)}
          formAmount={form.getValues("amount") ?? 0}
          calculateTotal={calculateTotal}
          isSubmitting={isLoading}
          hasSelectedProperty={!!selectedProperty}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </form>
    </Form>
  );
}
