
import React from "react";
import { Card } from "@/components/ui/card";
import { Building2, Star, Heart, Phone, Mail, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ServiceProviderService {
  name: string;
  base_price?: number;
  price_unit?: string;
  category: string;
}

interface ServiceProvider {
  id: string;
  business_name?: string | null;
  description?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
  service_area?: string[];
  rating?: number;
  review_count?: number;
  profiles: Array<{
    first_name: string | null;
    last_name: string | null;
  }>;
  services?: ServiceProviderService[];
  isPreferred?: boolean;
  isCustomProvider?: boolean;
}

interface ServiceProviderListContentProps {
  providers: ServiceProvider[] | undefined;
  isLoading: boolean;
  onPreferredToggle: (provider: ServiceProvider) => Promise<void>;
  onEdit?: (provider: ServiceProvider) => void;
  userRole?: string;
}

export function ServiceProviderListContent({ 
  providers, 
  isLoading, 
  onPreferredToggle,
  onEdit,
  userRole
}: ServiceProviderListContentProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!providers?.length) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">No Service Providers Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              There are currently no service providers available. Click the button above to add your first service provider.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getProviderName = (provider: ServiceProvider) => {
    return provider.business_name || 
      `${provider.profiles[0]?.first_name || ''} ${provider.profiles[0]?.last_name || ''}`.trim() ||
      'Unknown Provider';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50/50">
            <TableHead className="font-semibold">Provider</TableHead>
            <TableHead className="font-semibold">Services</TableHead>
            <TableHead className="font-semibold">Rating</TableHead>
            <TableHead className="font-semibold">Contact Information</TableHead>
            <TableHead className="font-semibold">Service Areas</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} className="hover:bg-gray-50">
              <TableCell className="min-w-[200px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {provider.isPreferred && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">
                        Preferred
                      </Badge>
                    )}
                    <span className="font-medium">{getProviderName(provider)}</span>
                  </div>
                  {provider.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {provider.description}
                    </p>
                  )}
                  {provider.isCustomProvider ? (
                    <Badge variant="outline" className="border-purple-500 text-purple-700">
                      Custom Provider
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      Registered Provider
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="min-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {provider.services?.map((service, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{provider.rating || 'N/A'}</span>
                  {provider.review_count && provider.review_count > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({provider.review_count})
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="min-w-[200px]">
                <div className="space-y-1.5">
                  {provider.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      <span>{provider.contact_phone}</span>
                    </div>
                  )}
                  {provider.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-gray-500" />
                      <span>{provider.contact_email}</span>
                    </div>
                  )}
                  {provider.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-3.5 w-3.5 text-gray-500" />
                      <a 
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell className="min-w-[150px]">
                <div className="flex flex-wrap gap-1">
                  {provider.service_area?.map((area, index) => (
                    <div key={index} className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-gray-500" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {userRole === "landlord" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 hover:bg-blue-50"
                        onClick={() => onPreferredToggle(provider)}
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4 mr-1",
                            provider.isPreferred && "fill-red-500 text-red-500"
                          )}
                        />
                        {provider.isPreferred ? 'Remove' : 'Preferred'}
                      </Button>
                      {onEdit && provider.isCustomProvider && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(provider)}
                        >
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
