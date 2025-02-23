import { FormData, Asset } from "@/types/contract";
import { Input } from "@/components/ui/input";

interface ContractContentProps {
  formData: FormData;
  isEditing: boolean;
  onFieldChange: (field: keyof FormData, value: string) => void;
}

export function ContractContent({ formData, isEditing, onFieldChange }: ContractContentProps) {
  const isOwnerSigned = formData.ownerSignatureImage && formData.ownerSignatureName && formData.ownerSignatureDate;

  const renderField = (fieldName: keyof FormData, value: string, label: string, type: string = 'text') => {
    if (isEditing && !isOwnerSigned) {
      return (
        <Input
          type={type}
          value={value || ''}
          onChange={(e) => onFieldChange(fieldName, e.target.value)}
          className="w-full"
        />
      );
    }
    return <span>{value || '_____'}</span>;
  };

  return (
    <div className="text-black bg-white p-8 rounded-lg shadow-sm">
      <h1 className="text-2xl text-center font-bold mb-8">Contract de Închiriere</h1>
      
      <div className="mb-8">
        <p className="mb-2">Contract nr. {renderField("Contract Number", "contractNumber")}</p>
        <p>Data: {renderField("Contract Date", "contractDate")}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">I. Părțile contractante</h2>
        
        <div className="mb-4 space-y-4">
          <p className="mb-2 font-medium">1.1. Owner Details:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account:</label>
              {renderField("Owner Bank", "ownerBank")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name:</label>
              {renderField("Owner Bank Name", "ownerBankName")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              {renderField("Owner Email", "ownerEmail")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              {renderField("Owner Phone", "ownerPhone")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">County:</label>
              {renderField("Owner County", "ownerCounty")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City:</label>
              {renderField("Owner City", "ownerCity")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Representative:</label>
              {renderField("Owner Representative", "ownerRepresentative")}
            </div>
          </div>
        </div>

        <div>
          <p>și</p>
        </div>

        <div className="mb-4 space-y-4">
          <p className="mb-2 font-medium">1.2. Tenant Details:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              {renderField("Tenant Name", "tenantName")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration:</label>
              {renderField("Tenant Registration", "tenantReg")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fiscal Code:</label>
              {renderField("Tenant Fiscal Code", "tenantFiscal")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              {renderField("Tenant Address", "tenantAddress")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account:</label>
              {renderField("Tenant Bank", "tenantBank")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name:</label>
              {renderField("Tenant Bank Name", "tenantBankName")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              {renderField("Tenant Email", "tenantEmail")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              {renderField("Tenant Phone", "tenantPhone")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">County:</label>
              {renderField("Tenant County", "tenantCounty")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City:</label>
              {renderField("Tenant City", "tenantCity")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Representative:</label>
              {renderField("Tenant Representative", "tenantRepresentative")}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">II. Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (months):</label>
            {renderField("Contract Duration", "contractDuration")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date:</label>
            {renderField("Start Date", "startDate")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Day:</label>
            {renderField("Payment Day", "paymentDay")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rent Amount:</label>
            {renderField("Rent Amount", "rentAmount")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">VAT Included:</label>
            {renderField("VAT Included", "vatIncluded")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Late Fee (%):</label>
            {renderField("Late Fee", "lateFee")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Security Deposit:</label>
            {renderField("Security Deposit", "securityDeposit")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deposit Return Period:</label>
            {renderField("Deposit Return Period", "depositReturnPeriod")}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">IV. Utility Meters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cold Water Meter:</label>
            {renderField("Water Cold Meter", "waterColdMeter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hot Water Meter:</label>
            {renderField("Water Hot Meter", "waterHotMeter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Electricity Meter:</label>
            {renderField("Electricity Meter", "electricityMeter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gas Meter:</label>
            {renderField("Gas Meter", "gasMeter")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-16">
        <div>
          <p className="font-bold mb-2">PROPRIETAR,</p>
          <div className="mb-2">
            <p>Data:</p>
            {renderField('ownerSignatureDate', formData.ownerSignatureDate, 'Data semnării', 'date')}
          </div>
          <div className="mb-2">
            <p>Nume în clar și semnătura:</p>
            {renderField('ownerSignatureName', formData.ownerSignatureName, 'Nume și prenume')}
          </div>
          {formData.ownerSignatureImage && (
            <img 
              src={formData.ownerSignatureImage} 
              alt="Owner Signature" 
              className="mt-2 max-w-[200px]"
            />
          )}
        </div>
        <div>
          <p className="font-bold mb-2">CHIRIAȘ,</p>
          <p>Data: {formData.tenantSignatureDate || '_____'}</p>
          <p>Nume și semnătură:</p>
          <p>{formData.tenantSignatureName || '___________________________'}</p>
          {formData.tenantSignatureImage && (
            <img 
              src={formData.tenantSignatureImage} 
              alt="Tenant Signature" 
              className="mt-2 max-w-[200px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
