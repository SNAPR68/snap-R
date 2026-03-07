import { MLSPropertyData, MLSPhoto, MLSProvider, MLSCredentials } from './types';

import { logger } from '@/lib/logger';
// SimplyRETS demo credentials for development
const DEMO_USERNAME = 'simplyrets';
const DEMO_PASSWORD = 'simplyrets';

interface SimplyRETSAddress {
  full: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface SimplyRETSParking {
  spaces: number;
  description: string;
}

interface SimplyRETSPropertyDetail {
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  type: string;
  parking: SimplyRETSParking;
  lotSize: string;
  subdivision: string;
  style: string;
}

interface SimplyRETSAssociation {
  fee: number;
  frequency: string;
}

interface SimplyRETSGeo {
  lat: number;
  lng: number;
}

interface SimplyRETSMLSInfo {
  status: string;
  area: string;
  daysOnMarket: number;
}

interface SimplyRETSProperty {
  mlsId: string;
  listPrice: number;
  listDate: string;
  address: SimplyRETSAddress;
  property: SimplyRETSPropertyDetail;
  photos: string[];
  remarks: string;
  association: SimplyRETSAssociation | null;
  geo: SimplyRETSGeo;
  virtualTourUrl: string | null;
  mls: SimplyRETSMLSInfo;
}

const PROPERTY_TYPE_MAP: Record<string, string> = {
  'residential': 'single_family',
  'condominium': 'condo',
  'townhouse': 'townhouse',
  'multi family': 'multi_family',
  'land': 'land',
  'commercial': 'commercial',
};

export class SimplyRETSProvider implements MLSProvider {
  name = 'simplyrets';

  async fetchListing(mlsNumber: string, credentials?: MLSCredentials): Promise<MLSPropertyData | null> {
    const username = credentials?.username || DEMO_USERNAME;
    const password = credentials?.password || DEMO_PASSWORD;

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    const response = await fetch(
      `https://api.simplyrets.com/properties?q=${encodeURIComponent(mlsNumber)}&limit=1`,
      {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      logger.error(`[SimplyRETS] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const results: SimplyRETSProperty[] = await response.json();

    if (!results || results.length === 0) {
      return null;
    }

    return this.mapToMLSData(results[0], mlsNumber);
  }

  private mapToMLSData(listing: SimplyRETSProperty, mlsNumber: string): MLSPropertyData {
    const photos: MLSPhoto[] = (listing.photos || []).map((url, index) => ({
      url,
      caption: null,
      order: index,
    }));

    const rawType = (listing.property?.type || '').toLowerCase();
    const propertyType = PROPERTY_TYPE_MAP[rawType] || rawType || null;

    return {
      address: listing.address?.full || '',
      city: listing.address?.city || '',
      state: listing.address?.state || '',
      postalCode: listing.address?.postalCode || '',
      price: listing.listPrice ?? null,
      bedrooms: listing.property?.bedrooms ?? null,
      bathrooms: listing.property?.bathrooms ?? null,
      squareFeet: listing.property?.area ?? null,
      yearBuilt: listing.property?.yearBuilt ?? null,
      lotSize: listing.property?.lotSize || null,
      propertyType,
      description: listing.remarks || null,
      parking: listing.property?.parking?.description ||
        (listing.property?.parking?.spaces ? `${listing.property.parking.spaces} spaces` : null),
      features: [],
      hoaFees: listing.association?.fee ?? null,
      latitude: listing.geo?.lat ?? null,
      longitude: listing.geo?.lng ?? null,
      virtualTourUrl: listing.virtualTourUrl || null,
      mlsNumber: listing.mlsId || mlsNumber,
      photos,
      listingStatus: listing.mls?.status || null,
    };
  }
}
