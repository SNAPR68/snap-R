/**
 * SnapR → RESO Data Dictionary 2.0 field mapping
 * Maps internal listing fields to RESO Property resource fields
 */

export interface ResoProperty {
  ListingKey: string;
  ListingId: string;
  ListingStatus: string;
  PropertyType: string;
  PropertySubType?: string;
  StandardStatus: string;

  // Address
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  Country?: string;
  UnparsedAddress?: string;

  // Price
  ListPrice?: number;
  OriginalListPrice?: number;
  ClosePrice?: number;
  PriceChangeTimestamp?: string;

  // Details
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  LotSizeArea?: number;
  LotSizeUnits?: string;
  YearBuilt?: number;
  Stories?: number;
  GarageSpaces?: number;
  ParkingTotal?: number;

  // Description
  PublicRemarks?: string;
  SyndicationRemarks?: string;
  PrivateRemarks?: string;

  // Dates
  ListingContractDate?: string;
  OnMarketDate?: string;
  ModificationTimestamp?: string;
  PhotosChangeTimestamp?: string;

  // Media
  Media?: ResoMedia[];

  // Agent
  ListAgentFullName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListOfficeName?: string;
}

export interface ResoMedia {
  MediaURL: string;
  MediaCategory: 'Photo' | 'Video' | 'VirtualTour';
  Order: number;
  ShortDescription?: string;
  MediaModificationTimestamp?: string;
}

// Map SnapR listing status → RESO StandardStatus
const STATUS_MAP: Record<string, string> = {
  draft: 'Coming Soon',
  preparing: 'Coming Soon',
  prepared: 'Active',
  active: 'Active',
  pending: 'Pending',
  sold: 'Closed',
  archived: 'Withdrawn',
  expired: 'Expired',
};

export function mapListingStatus(snaprStatus: string): string {
  return STATUS_MAP[snaprStatus] || 'Active';
}

interface SnapRListing {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  original_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  bathrooms_full?: number;
  bathrooms_half?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  stories?: number;
  garage_spaces?: number;
  parking_total?: number;
  description?: string;
  property_type?: string;
  property_subtype?: string;
  status?: string;
  mls_number?: string;
  listed_date?: string;
  updated_at?: string;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  office_name?: string;
}

interface SnapRPhoto {
  id: string;
  processed_url?: string;
  raw_url?: string;
  order?: number;
  caption?: string;
  updated_at?: string;
}

export function mapToReso(
  listing: SnapRListing,
  photos: SnapRPhoto[] = []
): ResoProperty {
  const media: ResoMedia[] = photos
    .filter((p) => p.processed_url || p.raw_url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((photo, index) => ({
      MediaURL: photo.processed_url || photo.raw_url || '',
      MediaCategory: 'Photo' as const,
      Order: index + 1,
      ShortDescription: photo.caption,
      MediaModificationTimestamp: photo.updated_at,
    }));

  return {
    ListingKey: listing.id,
    ListingId: listing.mls_number || listing.id,
    ListingStatus: listing.status || 'Active',
    PropertyType: listing.property_type || 'Residential',
    PropertySubType: listing.property_subtype,
    StandardStatus: mapListingStatus(listing.status || 'active'),

    UnparsedAddress: listing.address,
    City: listing.city,
    StateOrProvince: listing.state,
    PostalCode: listing.zip,
    Country: 'US',

    ListPrice: listing.price,
    OriginalListPrice: listing.original_price,

    BedroomsTotal: listing.bedrooms,
    BathroomsTotalInteger: listing.bathrooms,
    BathroomsFull: listing.bathrooms_full,
    BathroomsHalf: listing.bathrooms_half,
    LivingArea: listing.sqft,
    LivingAreaUnits: 'sqft',
    LotSizeArea: listing.lot_size,
    LotSizeUnits: 'sqft',
    YearBuilt: listing.year_built,
    Stories: listing.stories,
    GarageSpaces: listing.garage_spaces,
    ParkingTotal: listing.parking_total,

    PublicRemarks: listing.description,
    SyndicationRemarks: listing.description,

    ListingContractDate: listing.listed_date,
    ModificationTimestamp: listing.updated_at,

    Media: media.length > 0 ? media : undefined,

    ListAgentFullName: listing.agent_name,
    ListAgentEmail: listing.agent_email,
    ListAgentDirectPhone: listing.agent_phone,
    ListOfficeName: listing.office_name,
  };
}
