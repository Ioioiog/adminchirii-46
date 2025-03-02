
import { Property } from "@/utils/propertyUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UtilityFormProps {
  properties: Property[];
  propertyId: string;
  setPropertyId: (value: string) => void;
  utilityType: string;
  setUtilityType: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  issuedDate: string;
  setIssuedDate: (value: string) => void;
  invoiceNumber: string;
  setInvoiceNumber: (value: string) => void;
  availableCurrencies: { code: string; name: string; }[];
}

export function UtilityForm({
  properties,
  propertyId,
  setPropertyId,
  utilityType,
  setUtilityType,
  amount,
  setAmount,
  currency,
  setCurrency,
  dueDate,
  setDueDate,
  issuedDate,
  setIssuedDate,
  invoiceNumber,
  setInvoiceNumber,
  availableCurrencies,
}: UtilityFormProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="property">Property *</Label>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger>
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Utility Type *</Label>
        <Select value={utilityType} onValueChange={setUtilityType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Building Maintenance">Building Maintenance</SelectItem>
            <SelectItem value="Electricity">Electricity</SelectItem>
            <SelectItem value="Water">Water</SelectItem>
            <SelectItem value="Gas">Gas</SelectItem>
            <SelectItem value="Internet">Internet</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select value={currency} onValueChange={setCurrency} defaultValue="RON">
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dueDate">Due Date *</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="issuedDate">Issued Date *</Label>
        <Input
          id="issuedDate"
          type="date"
          value={issuedDate}
          onChange={(e) => setIssuedDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="invoiceNumber">Invoice Number</Label>
        <Input
          id="invoiceNumber"
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />
      </div>
    </>
  );
}
