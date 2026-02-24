// Single-page Property Flyer PDF template
// Uses @react-pdf/renderer for server-side vector PDF generation
/* eslint-disable jsx-a11y/alt-text */
// @react-pdf/renderer Image components do not support alt props

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { PrintMaterialsInput } from './types';
import { formatPrice, truncateText } from './pdf-utils';

const FALLBACK_PRIMARY = '#D4AF37';
const FALLBACK_SECONDARY = '#1A1A1A';

function createStyles(primaryColor: string, secondaryColor: string) {
  return StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Helvetica',
    },
    heroContainer: {
      width: '100%',
      height: 380,
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    // Price + address row
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 36,
      paddingTop: 16,
      paddingBottom: 10,
    },
    priceSection: {
      flex: 1,
    },
    price: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
    },
    statText: {
      fontSize: 11,
      color: '#444444',
      fontFamily: 'Helvetica',
    },
    statDivider: {
      fontSize: 11,
      color: '#CCCCCC',
    },
    addressSection: {
      alignItems: 'flex-end',
    },
    addressLine: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: secondaryColor,
      textAlign: 'right',
    },
    cityLine: {
      fontSize: 11,
      color: '#666666',
      marginTop: 2,
      textAlign: 'right',
    },
    // Detail photos row
    photosRow: {
      flexDirection: 'row',
      paddingHorizontal: 36,
      gap: 6,
      height: 100,
    },
    detailPhoto: {
      flex: 1,
      height: 100,
      borderRadius: 4,
      objectFit: 'cover',
    },
    // Description
    descriptionContainer: {
      paddingHorizontal: 36,
      paddingTop: 12,
      paddingBottom: 12,
    },
    description: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#555555',
    },
    // Accent line
    accentLine: {
      height: 2,
      backgroundColor: primaryColor,
      marginHorizontal: 36,
    },
    // Agent footer
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 36,
      paddingTop: 14,
      paddingBottom: 14,
      alignItems: 'center',
    },
    footerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    agentLogo: {
      width: 48,
      height: 48,
      objectFit: 'contain',
    },
    agentInfo: {
      flex: 1,
    },
    agentName: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: secondaryColor,
    },
    agentBrokerage: {
      fontSize: 9,
      color: '#666666',
      marginTop: 2,
    },
    agentLicense: {
      fontSize: 8,
      color: '#999999',
      marginTop: 1,
    },
    footerCenter: {
      alignItems: 'center',
      marginHorizontal: 16,
    },
    qrCode: {
      width: 64,
      height: 64,
    },
    qrLabel: {
      fontSize: 7,
      color: '#999999',
      marginTop: 3,
      textAlign: 'center',
    },
    footerRight: {
      alignItems: 'flex-end',
    },
    contactText: {
      fontSize: 9,
      color: '#555555',
      marginBottom: 2,
    },
    // Placeholder for missing hero
    heroPlaceholder: {
      width: '100%',
      height: 380,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroPlaceholderText: {
      fontSize: 16,
      color: '#CCCCCC',
    },
  });
}

export function FlyerDocument(input: PrintMaterialsInput) {
  const primaryColor = input.brand.primary_color || FALLBACK_PRIMARY;
  const secondaryColor = input.brand.secondary_color || FALLBACK_SECONDARY;
  const styles = createStyles(primaryColor, secondaryColor);

  const heroPhoto = input.photos.find((p) => p.isHero) || input.photos[0];
  const detailPhotos = input.photos
    .filter((p) => p.id !== heroPhoto?.id)
    .slice(0, 4);

  const listing = input.listing;
  const brand = input.brand;

  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');
  const descriptionText = listing.description
    ? truncateText(listing.description, 300)
    : '';

  // Build stats array
  const stats: string[] = [];
  if (listing.bedrooms) stats.push(`${listing.bedrooms} BD`);
  if (listing.bathrooms) stats.push(`${listing.bathrooms} BA`);
  if (listing.square_feet) stats.push(`${listing.square_feet.toLocaleString()} SqFt`);
  if (listing.year_built) stats.push(`Built ${listing.year_built}`);

  return (
    <Document
      title={`Property Flyer - ${listing.address || 'Listing'}`}
      author={brand.business_name || 'SnapR'}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Hero Photo */}
        {heroPhoto ? (
          <View style={styles.heroContainer}>
            <Image src={heroPhoto.base64DataUri} style={styles.heroImage} />
          </View>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>No Photos Available</Text>
          </View>
        )}

        {/* Price + Address Row */}
        <View style={styles.headerRow}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {stats.length > 0 && (
              <View style={styles.statsRow}>
                {stats.map((stat, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={styles.statDivider}> · </Text>}
                    <Text style={styles.statText}>{stat}</Text>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
          <View style={styles.addressSection}>
            <Text style={styles.addressLine}>{listing.address || ''}</Text>
            {cityState && <Text style={styles.cityLine}>{cityState}{listing.postal_code ? ` ${listing.postal_code}` : ''}</Text>}
            {listing.mls_number && <Text style={styles.cityLine}>MLS# {listing.mls_number}</Text>}
          </View>
        </View>

        {/* Detail Photos Row */}
        {detailPhotos.length > 0 && (
          <View style={styles.photosRow}>
            {detailPhotos.map((photo) => (
              <Image key={photo.id} src={photo.base64DataUri} style={styles.detailPhoto} />
            ))}
          </View>
        )}

        {/* Description */}
        {descriptionText && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{descriptionText}</Text>
          </View>
        )}

        {/* Gold Accent Line */}
        <View style={styles.accentLine} />

        {/* Agent Branding Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {brand.logo_base64 && (
              <Image src={brand.logo_base64} style={styles.agentLogo} />
            )}
            <View style={styles.agentInfo}>
              {brand.business_name && (
                <Text style={styles.agentName}>{brand.business_name}</Text>
              )}
              {brand.brokerage_name && (
                <Text style={styles.agentBrokerage}>{brand.brokerage_name}</Text>
              )}
              {brand.license_number && (
                <Text style={styles.agentLicense}>{brand.license_number}</Text>
              )}
              {brand.tagline && (
                <Text style={styles.agentLicense}>{brand.tagline}</Text>
              )}
            </View>
          </View>

          {input.qrCodeDataUri && (
            <View style={styles.footerCenter}>
              <Image src={input.qrCodeDataUri} style={styles.qrCode} />
              <Text style={styles.qrLabel}>Scan for details</Text>
            </View>
          )}

          <View style={styles.footerRight}>
            {brand.phone && <Text style={styles.contactText}>{brand.phone}</Text>}
            {brand.email && <Text style={styles.contactText}>{brand.email}</Text>}
            {brand.website && <Text style={styles.contactText}>{brand.website}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}
