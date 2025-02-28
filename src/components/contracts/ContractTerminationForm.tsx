
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContractTerminationFormProps {
  contract: {
    id: string;
    metadata?: {
      securityDeposit?: string;
    };
  };
  onSuccess: () => void;
}

interface TerminationFormData {
  noticeDate: Date;
  moveOutDate: Date;
  noticePeriod: number;
  outstandingRent: number;
  securityDepositAmount: number;
  depositDeductions: number;
  deductionReasons: string;
  refundAmount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other';
  inspectionDate: Date;
  keyReturnProcess: string;
  cleaningRequirements: string;
}

export function ContractTerminationForm({ contract, onSuccess }: ContractTerminationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TerminationFormData>({
    defaultValues: {
      securityDepositAmount: Number(contract.metadata?.securityDeposit || 0),
      keyReturnProcess: "The tenant must return all keys, access cards, garage openers, and any other entry devices to the landlord. The specific return method (e.g., in person, drop-off location) should be stated.",
      noticeDate: new Date(),
      moveOutDate: new Date(),
      inspectionDate: new Date(),
      noticePeriod: 30, // Default notice period
      outstandingRent: 0,
      depositDeductions: 0,
      refundAmount: Number(contract.metadata?.securityDeposit || 0),
      deductionReasons: "",
      paymentMethod: 'bank_transfer',
      cleaningRequirements: ""
    }
  });

  const calculateRefundAmount = (securityDeposit: number, deductions: number) => {
    return Math.max(0, securityDeposit - deductions);
  };

  const handleDeductionsChange = (value: number) => {
    const securityDeposit = form.getValues('securityDepositAmount');
    const refundAmount = calculateRefundAmount(securityDeposit, value);
    form.setValue('refundAmount', refundAmount);
  };

  const onSubmit = async (data: TerminationFormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('contract_terminations')
        .insert([{
          contract_id: contract.id,
          notice_date: format(data.noticeDate, 'yyyy-MM-dd'),
          move_out_date: format(data.moveOutDate, 'yyyy-MM-dd'),
          notice_period: data.noticePeriod,
          outstanding_rent: data.outstandingRent,
          security_deposit_amount: data.securityDepositAmount,
          deposit_deductions: data.depositDeductions,
          deduction_reasons: data.deductionReasons,
          refund_amount: data.refundAmount,
          payment_method: data.paymentMethod,
          inspection_date: format(data.inspectionDate, 'yyyy-MM-dd'),
          key_return_process: data.keyReturnProcess,
          cleaning_requirements: data.cleaningRequirements
        }]);

      if (error) throw error;

      // Update contract status to cancelled
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ status: 'cancelled' })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      toast({
        title: "Contract cancelled",
        description: "The contract has been cancelled and tenant has been notified.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting termination form:', error);
      toast({
        title: "Error",
        description: "Failed to submit termination form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[65vh] pr-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Termination Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="noticeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notice Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moveOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-out Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noticePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Notice Period (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="outstandingRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Rent Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="securityDepositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depositDeductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions from Deposit</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={e => {
                          const value = Number(e.target.value);
                          field.onChange(value);
                          handleDeductionsChange(value);
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deductionReasons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Deductions</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refundAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Move-Out Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Inspection Date</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyReturnProcess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key & Access Device Return Process</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cleaningRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleaning & Repair Requirements</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="mt-4 mb-6">
            Submit Termination Form
          </Button>
        </form>
      </ScrollArea>
    </Form>
  );
}
