
import { Property } from "@/utils/propertyUtils";

export const detectUtilityType = (
  extractedText: string, 
  propertyId: string, 
  properties: Property[]
): string => {
  // Add "internet" to the list of maintenance keywords
  const maintenanceKeywords = ['water', 'cleaning', 'electricity', 'maintenance', 'cleaning', 'internet'];
  const keywordMatches = maintenanceKeywords.filter(keyword => 
    extractedText.toLowerCase().includes(keyword)
  );

  const isMultipleUtilities = keywordMatches.length >= 2;
  const isBelvedere60 = properties.find(p => 
    p.id === propertyId && 
    p.name.toLowerCase().includes('belvedere') && 
    p.name.includes('60')
  );

  if (isMultipleUtilities || isBelvedere60) {
    console.log('Setting as Building Maintenance:', {
      keywordMatches,
      isMultipleUtilities,
      isBelvedere60: !!isBelvedere60
    });
    return "Building Maintenance";
  }

  // If "internet" is detected in the text, return "internet" type
  if (extractedText.toLowerCase().includes('internet')) {
    return "internet";
  }

  return "";
};
