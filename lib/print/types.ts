// Shared data interfaces for print material PDF generation

export interface PrintListingData {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type: string | null;
  year_built: number | null;
  lot_size: string | null;
  parking: string | null;
  features: string[];
  mls_number: string | null;
  hoa_fees: number | null;
  description: string | null;
}

export interface PrintBrandData {
  business_name: string | null;
  logo_base64: string | null;
  brokerage_logo_base64: string | null;
  primary_color: string;
  secondary_color: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  brokerage_name: string | null;
  license_number: string | null;
  tagline: string | null;
}

export interface PrintPhotoData {
  id: string;
  base64DataUri: string;
  isHero: boolean;
}

export interface PrintMaterialsInput {
  listing: PrintListingData;
  brand: PrintBrandData;
  photos: PrintPhotoData[];
  qrCodeDataUri: string | null;
  propertySiteUrl: string | null;
  generatedDate: string;
}
