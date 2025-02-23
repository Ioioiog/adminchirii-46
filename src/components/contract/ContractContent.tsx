
import { FormData } from "@/types/contract";
import { Input } from "@/components/ui/input";

interface ContractContentProps {
  formData: FormData;
  isEditing?: boolean;
  onFieldChange?: (field: keyof FormData, value: string) => void;
}

export function ContractContent({ formData, isEditing = false, onFieldChange }: ContractContentProps) {
  const renderField = (label: string, field: keyof FormData) => {
    if (isEditing && onFieldChange) {
      return (
        <Input
          type="text"
          value={formData[field] as string}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="w-full"
        />
      );
    }
    return <span>{formData[field]}</span>;
  };

  return (
    <div className="text-black">
      <h1 className="text-2xl text-center font-bold mb-8">Contract de Închiriere</h1>
      
      <div className="mb-8">
        <p className="mb-2">Contract nr. {renderField("Contract Number", "contractNumber")}</p>
        <p>Data: {renderField("Contract Date", "contractDate")}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">I. Părțile contractante</h2>
        
        <div className="mb-4 space-y-2">
          <p className="mb-2">1.1. Owner Details:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              {renderField("Owner Name", "ownerName")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration:</label>
              {renderField("Owner Registration", "ownerReg")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fiscal Code:</label>
              {renderField("Owner Fiscal Code", "ownerFiscal")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              {renderField("Owner Address", "ownerAddress")}
            </div>
            {/* Add other owner fields similarly */}
          </div>
        </div>

        <div>
          <p>și</p>
        </div>

        <div className="mb-4 space-y-2">
          <p className="mb-2">1.2. Tenant Details:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              {renderField("Tenant Name", "tenantName")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              {renderField("Tenant Email", "tenantEmail")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration:</label>
              {renderField("Tenant Registration", "tenantReg")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              {renderField("Tenant Address", "tenantAddress")}
            </div>
            {/* Add other tenant fields similarly */}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">II. Property Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property Address:</label>
            {renderField("Property Address", "propertyAddress")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room Count:</label>
            {renderField("Room Count", "roomCount")}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">III. Contract Terms</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (months):</label>
            {renderField("Contract Duration", "contractDuration")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date:</label>
            {renderField("Start Date", "startDate")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rent Amount:</label>
            {renderField("Rent Amount", "rentAmount")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">VAT Included:</label>
            {renderField("VAT Included", "vatIncluded")}
          </div>
          {/* Add other contract term fields */}
        </div>
      </div>

      {/* Add remaining sections */}
    </div>
  );
}
