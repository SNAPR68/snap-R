/**
 * RESO Data Dictionary 2.0 XML Feed Generator
 * Generates Zillow ZDF and Realtor.com compatible feeds
 */

import { type ResoProperty, type ResoMedia } from './field-mapping';

function escapeXml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlTag(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `    <${name}>${escapeXml(String(value))}</${name}>\n`;
}

function mediaToXml(media: ResoMedia): string {
  return `    <Media>
      <MediaURL>${escapeXml(media.MediaURL)}</MediaURL>
      <MediaCategory>${media.MediaCategory}</MediaCategory>
      <Order>${media.Order}</Order>${media.ShortDescription ? `\n      <ShortDescription>${escapeXml(media.ShortDescription)}</ShortDescription>` : ''}${media.MediaModificationTimestamp ? `\n      <MediaModificationTimestamp>${escapeXml(media.MediaModificationTimestamp)}</MediaModificationTimestamp>` : ''}
    </Media>\n`;
}

function propertyToXml(property: ResoProperty): string {
  let xml = '  <Property>\n';

  // Required fields
  xml += xmlTag('ListingKey', property.ListingKey);
  xml += xmlTag('ListingId', property.ListingId);
  xml += xmlTag('ListingStatus', property.ListingStatus);
  xml += xmlTag('PropertyType', property.PropertyType);
  xml += xmlTag('StandardStatus', property.StandardStatus);

  // Optional type
  xml += xmlTag('PropertySubType', property.PropertySubType);

  // Address
  xml += xmlTag('StreetNumber', property.StreetNumber);
  xml += xmlTag('StreetName', property.StreetName);
  xml += xmlTag('StreetSuffix', property.StreetSuffix);
  xml += xmlTag('UnitNumber', property.UnitNumber);
  xml += xmlTag('City', property.City);
  xml += xmlTag('StateOrProvince', property.StateOrProvince);
  xml += xmlTag('PostalCode', property.PostalCode);
  xml += xmlTag('Country', property.Country);
  xml += xmlTag('UnparsedAddress', property.UnparsedAddress);

  // Price
  xml += xmlTag('ListPrice', property.ListPrice);
  xml += xmlTag('OriginalListPrice', property.OriginalListPrice);
  xml += xmlTag('ClosePrice', property.ClosePrice);
  xml += xmlTag('PriceChangeTimestamp', property.PriceChangeTimestamp);

  // Details
  xml += xmlTag('BedroomsTotal', property.BedroomsTotal);
  xml += xmlTag('BathroomsTotalInteger', property.BathroomsTotalInteger);
  xml += xmlTag('BathroomsFull', property.BathroomsFull);
  xml += xmlTag('BathroomsHalf', property.BathroomsHalf);
  xml += xmlTag('LivingArea', property.LivingArea);
  xml += xmlTag('LivingAreaUnits', property.LivingAreaUnits);
  xml += xmlTag('LotSizeArea', property.LotSizeArea);
  xml += xmlTag('LotSizeUnits', property.LotSizeUnits);
  xml += xmlTag('YearBuilt', property.YearBuilt);
  xml += xmlTag('Stories', property.Stories);
  xml += xmlTag('GarageSpaces', property.GarageSpaces);
  xml += xmlTag('ParkingTotal', property.ParkingTotal);

  // Description
  xml += xmlTag('PublicRemarks', property.PublicRemarks);
  xml += xmlTag('SyndicationRemarks', property.SyndicationRemarks);

  // Dates
  xml += xmlTag('ListingContractDate', property.ListingContractDate);
  xml += xmlTag('OnMarketDate', property.OnMarketDate);
  xml += xmlTag('ModificationTimestamp', property.ModificationTimestamp);

  // Agent
  xml += xmlTag('ListAgentFullName', property.ListAgentFullName);
  xml += xmlTag('ListAgentEmail', property.ListAgentEmail);
  xml += xmlTag('ListAgentDirectPhone', property.ListAgentDirectPhone);
  xml += xmlTag('ListOfficeName', property.ListOfficeName);

  // Media
  if (property.Media && property.Media.length > 0) {
    for (const media of property.Media) {
      xml += mediaToXml(media);
    }
  }

  xml += '  </Property>\n';
  return xml;
}

/**
 * Generate a RESO Data Dictionary 2.0 XML feed
 */
export function generateResoFeed(
  properties: ResoProperty[],
  options: {
    feedName?: string;
    providerName?: string;
    providerUrl?: string;
  } = {}
): string {
  const {
    feedName = 'SnapR Property Feed',
    providerName = 'SnapR',
    providerUrl = 'https://snap-r.com',
  } = options;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Listings xmlns="http://rets.org/xsd/Syndication/2012-03" ';
  xml += 'xmlns:commons="http://rets.org/xsd/RETSCommons" ';
  xml += 'version="2.0">\n';

  // Feed metadata
  xml += '  <FeedInfo>\n';
  xml += `    <FeedName>${escapeXml(feedName)}</FeedName>\n`;
  xml += `    <ProviderName>${escapeXml(providerName)}</ProviderName>\n`;
  xml += `    <ProviderURL>${escapeXml(providerUrl)}</ProviderURL>\n`;
  xml += `    <FeedDate>${new Date().toISOString()}</FeedDate>\n`;
  xml += `    <TotalListings>${properties.length}</TotalListings>\n`;
  xml += '  </FeedInfo>\n';

  // Properties
  for (const property of properties) {
    xml += propertyToXml(property);
  }

  xml += '</Listings>\n';
  return xml;
}

/**
 * Generate a Zillow ZDF (Zillow Data Feed) XML
 * ZDF is a subset of RESO with Zillow-specific extensions
 */
export function generateZillowFeed(properties: ResoProperty[]): string {
  return generateResoFeed(properties, {
    feedName: 'SnapR Zillow Feed',
    providerName: 'SnapR',
    providerUrl: 'https://snap-r.com',
  });
}

/**
 * Generate a Realtor.com compatible RETS feed
 */
export function generateRealtorFeed(properties: ResoProperty[]): string {
  return generateResoFeed(properties, {
    feedName: 'SnapR Realtor.com Feed',
    providerName: 'SnapR',
    providerUrl: 'https://snap-r.com',
  });
}
