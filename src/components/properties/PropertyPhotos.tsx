
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Image, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PropertyPhotosProps {
  photos: string[];
  propertyId: string;
  isEditing: boolean;
  onPhotosChange: (newPhotos: string[]) => void;
}

export function PropertyPhotos({ photos = [], propertyId, isEditing, onPhotosChange }: PropertyPhotosProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos = [...photos];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('property-photos')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      onPhotosChange(newPhotos);
      toast({
        title: "Success",
        description: "Photos uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      const fileName = photoUrl.split('/').pop();
      if (!fileName) return;

      const filePath = `${propertyId}/${fileName}`;
      const { error } = await supabase.storage
        .from('property-photos')
        .remove([filePath]);

      if (error) throw error;

      const updatedPhotos = photos.filter(photo => photo !== photoUrl);
      onPhotosChange(updatedPhotos);

      toast({
        title: "Success",
        description: "Photo removed successfully",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error",
        description: "Failed to remove photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Property Photos</h2>
        {isEditing && (
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="photo-upload"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Photos"}
              </Button>
            </label>
          </div>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Property photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              {isEditing && (
                <button
                  onClick={() => handleRemovePhoto(photo)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Image className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No photos available</p>
          {isEditing && (
            <p className="text-sm text-gray-500">
              Click "Upload Photos" to add property images
            </p>
          )}
        </div>
      )}
    </div>
  );
}
