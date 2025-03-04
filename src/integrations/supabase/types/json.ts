
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
  | { [key: string]: any }; // Added this to handle complex signal data and metadata objects
