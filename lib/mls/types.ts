export interface MLSPropertyData {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  lotSize: string | null;
  propertyType: string | null;
  description: string | null;
  parking: string | null;
  features: string[];
  hoaFees: number | null;
  latitude: number | null;
  longitude: number | null;
  virtualTourUrl: string | null;
  mlsNumber: string;
  photos: MLSPhoto[];
  listingStatus: string | null;
}

export interface MLSPhoto {
  url: string;
  caption: string | null;
  order: number;
}

export interface MLSSearchCriteria {
  /** Search by city */
  city?: string;
  /** Search by state */
  state?: string;
  /** Search by postal code */
  postalCode?: string;
  /** Only listings with status Active/Pending */
  status?: string;
  /** Max results to return */
  limit?: number;
}

export interface MLSProvider {
  name: string;
  fetchListing(mlsNumber: string, credentials?: MLSCredentials): Promise<MLSPropertyData | null>;
  searchListings?(criteria: MLSSearchCriteria, credentials?: MLSCredentials): Promise<MLSPropertyData[]>;
}

export interface MLSCredentials {
  username: string;
  password: string;
  mlsBoard?: string;
}
