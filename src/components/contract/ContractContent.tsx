
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
        <p className="mb-2">Contract nr. {renderField("contractNumber", formData.contractNumber, "Contract Number")}</p>
        <p>Data: {renderField("contractDate", formData.contractDate, "Contract Date")}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">I. Părțile contractante</h2>
        
        <div className="mb-4 space-y-4">
          <p className="mb-2 font-medium">1.1. Owner Details:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              {renderField("ownerName", formData.ownerName, "Owner Name")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration:</label>
              {renderField("ownerReg", formData.ownerReg, "Owner Registration")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fiscal Code:</label>
              {renderField("ownerFiscal", formData.ownerFiscal, "Owner Fiscal Code")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              {renderField("ownerAddress", formData.ownerAddress, "Owner Address")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account:</label>
              {renderField("ownerBank", formData.ownerBank, "Owner Bank")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name:</label>
              {renderField("ownerBankName", formData.ownerBankName, "Owner Bank Name")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              {renderField("ownerEmail", formData.ownerEmail, "Owner Email")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              {renderField("ownerPhone", formData.ownerPhone, "Owner Phone")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">County:</label>
              {renderField("ownerCounty", formData.ownerCounty, "Owner County")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City:</label>
              {renderField("ownerCity", formData.ownerCity, "Owner City")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Representative:</label>
              {renderField("ownerRepresentative", formData.ownerRepresentative, "Owner Representative")}
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
              {renderField("tenantName", formData.tenantName, "Tenant Name")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration:</label>
              {renderField("tenantReg", formData.tenantReg, "Tenant Registration")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fiscal Code:</label>
              {renderField("tenantFiscal", formData.tenantFiscal, "Tenant Fiscal Code")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              {renderField("tenantAddress", formData.tenantAddress, "Tenant Address")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account:</label>
              {renderField("tenantBank", formData.tenantBank, "Tenant Bank")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name:</label>
              {renderField("tenantBankName", formData.tenantBankName, "Tenant Bank Name")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              {renderField("tenantEmail", formData.tenantEmail, "Tenant Email")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              {renderField("tenantPhone", formData.tenantPhone, "Tenant Phone")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">County:</label>
              {renderField("tenantCounty", formData.tenantCounty, "Tenant County")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City:</label>
              {renderField("tenantCity", formData.tenantCity, "Tenant City")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Representative:</label>
              {renderField("tenantRepresentative", formData.tenantRepresentative, "Tenant Representative")}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">II. Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property Address:</label>
            {renderField("propertyAddress", formData.propertyAddress, "Property Address")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room Count:</label>
            {renderField("roomCount", formData.roomCount, "Room Count")}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">III. Contract Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (months):</label>
            {renderField("contractDuration", formData.contractDuration, "Contract Duration")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date:</label>
            {renderField("startDate", formData.startDate, "Start Date", "date")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Day:</label>
            {renderField("paymentDay", formData.paymentDay, "Payment Day")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rent Amount:</label>
            {renderField("rentAmount", formData.rentAmount, "Rent Amount")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">VAT Included:</label>
            {renderField("vatIncluded", formData.vatIncluded, "VAT Included")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Late Fee (%):</label>
            {renderField("lateFee", formData.lateFee, "Late Fee")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Security Deposit:</label>
            {renderField("securityDeposit", formData.securityDeposit, "Security Deposit")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deposit Return Period:</label>
            {renderField("depositReturnPeriod", formData.depositReturnPeriod, "Deposit Return Period")}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">IV. Utility Meters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cold Water Meter:</label>
            {renderField("waterColdMeter", formData.waterColdMeter, "Water Cold Meter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hot Water Meter:</label>
            {renderField("waterHotMeter", formData.waterHotMeter, "Water Hot Meter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Electricity Meter:</label>
            {renderField("electricityMeter", formData.electricityMeter, "Electricity Meter")}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gas Meter:</label>
            {renderField("gasMeter", formData.gasMeter, "Gas Meter")}
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
