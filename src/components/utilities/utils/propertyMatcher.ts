
import { Property } from "@/utils/propertyUtils";

export const findMatchingProperty = (extractedAddress: string, properties: Property[]) => {
  if (!extractedAddress) {
    console.log('No address provided');
    return null;
  }

  console.log('Starting property match for address:', extractedAddress);

  const normalize = (addr: string) => {
    return addr
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  };

  const belvedere60Match = properties.find(p => {
    const normalizedName = normalize(p.name);
    return normalizedName.includes('belvedere') && normalizedName.includes('60');
  });

  if (belvedere60Match) {
    console.log('✅ Found Belvedere 60 property:', belvedere60Match);
    return belvedere60Match;
  }

  const extractApartmentInfo = (address: string) => {
    const blocMatch = /bloc:?\s*(\d+)/i.exec(address);
    const scaraMatch = /scara:?\s*([a-z])/i.exec(address);
    const apartamentMatch = /apartament:?\s*(\d+)/i.exec(address);
    
    if (blocMatch && scaraMatch && apartamentMatch) {
      const bloc = blocMatch[1];
      const scara = scaraMatch[1];
      const apt = apartamentMatch[1];
      const combined = `${bloc}${scara}${apt}`;
      console.log('Extracted apartment info:', { bloc, scara, apt, combined });
      return combined;
    }

    const combinedMatch = /(\d+)\s*-\s*(\d+)([a-z])/i.exec(address);
    if (combinedMatch) {
      const [_, apt, bloc, scara] = combinedMatch;
      const combined = `${bloc}${scara}${apt}`;
      console.log('Extracted combined format:', { bloc, scara, apt, combined });
      return combined;
    }

    const holbanPattern = /b1-?10/i;
    if (holbanPattern.test(address.toLowerCase())) {
      console.log('Found Holban specific apartment format B1-10');
      return 'b110';
    }

    const bPattern = /b\.?2\.?7/i;
    if (bPattern.test(address.toLowerCase())) {
      console.log('Found B.2.7 format');
      return 'b.2.7';
    }

    const glucozaPattern = /ap\.?\s*(\d+)/i;
    const glucozaMatch = address.match(glucozaPattern);
    if (glucozaMatch) {
      console.log(`Found Glucoza apartment number: ${glucozaMatch[1]}`);
      return glucozaMatch[1];
    }

    console.log('No apartment info found in address:', address);
    return null;
  };

  const extractedNormalized = normalize(extractedAddress);
  const extractedAptInfo = extractApartmentInfo(extractedAddress);
  
  console.log('Extracted details:', {
    normalizedAddress: extractedNormalized,
    apartmentInfo: extractedAptInfo
  });

  let matchingProperty = properties.find(p => {
    if (!p.address) return false;

    const propertyNormalized = normalize(p.address);
    const propertyName = normalize(p.name);
    const propertyAptInfo = extractApartmentInfo(propertyName) || 
                           extractApartmentInfo(p.address);

    console.log('\nChecking property:', {
      name: p.name,
      normalizedName: propertyName,
      originalAddress: p.address,
      normalizedAddress: propertyNormalized,
      propertyAptInfo
    });

    if (extractedAptInfo && propertyAptInfo) {
      const matches = extractedAptInfo === propertyAptInfo;
      console.log('Apartment info comparison:', {
        extracted: extractedAptInfo,
        property: propertyAptInfo,
        matches
      });
      return matches;
    }

    const isLocationMatch = 
      propertyNormalized.includes('belvedere') ||
      propertyNormalized.includes('holban') ||
      propertyNormalized.includes('yacht') ||
      propertyNormalized.includes('glucoza');

    console.log('Location matching results:', {
      isLocationMatch,
      propertyNormalized
    });

    return isLocationMatch;
  });

  if (!matchingProperty) {
    console.log('❌ No matching property found for:', extractedAddress);
  } else {
    console.log('✅ Found matching property:', {
      name: matchingProperty.name,
      address: matchingProperty.address
    });
  }

  return matchingProperty;
};
