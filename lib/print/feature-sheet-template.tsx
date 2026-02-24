// Two-page Property Feature Sheet PDF template
// Uses @react-pdf/renderer for server-side vector PDF generation
/* eslint-disable jsx-a11y/alt-text */
// @react-pdf/renderer Image components do not support alt props

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { PrintMaterialsInput } from './types';
import { formatPrice, formatPropertyType } from './pdf-utils';

const FALLBACK_PRIMARY = '#D4AF37';
const FALLBACK_SECONDARY = '#1A1A1A';

function createStyles(primaryColor: string, secondaryColor: string) {
  return StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      paddingBottom: 40,
      fontFamily: 'Helvetica',
    },
    // Header bar
    headerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: secondaryColor,
      paddingHorizontal: 36,
      paddingVertical: 12,
    },
    headerLogo: {
      width: 40,
      height: 40,
      objectFit: 'contain',
    },
    headerTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      letterSpacing: 3,
    },
    headerPlaceholder: {
      width: 40,
    },
    // Hero
    heroContainer: {
      width: '100%',
      height: 280,
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    heroPlaceholder: {
      width: '100%',
      height: 280,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroPlaceholderText: {
      fontSize: 14,
      color: '#CCCCCC',
    },
    // Address + Price row
    addressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 36,
      paddingTop: 14,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    addressText: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: secondaryColor,
    },
    cityStateText: {
      fontSize: 11,
      color: '#666666',
      marginTop: 3,
    },
    priceText: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      textAlign: 'right',
    },
    mlsText: {
      fontSize: 9,
      color: '#999999',
      marginTop: 3,
      textAlign: 'right',
    },
    // Stats bar
    statsBar: {
      flexDirection: 'row',
      paddingHorizontal: 36,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#EEEEEE',
    },
    statBoxLast: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: secondaryColor,
    },
    statLabel: {
      fontSize: 8,
      color: '#999999',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Description
    descriptionSection: {
      paddingHorizontal: 36,
      paddingTop: 14,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      letterSpacing: 1,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    descriptionText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#444444',
    },
    // Page footer
    pageFooter: {
      position: 'absolute',
      bottom: 12,
      left: 36,
      right: 36,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerBrand: {
      fontSize: 7,
      color: '#CCCCCC',
    },
    footerPage: {
      fontSize: 7,
      color: '#CCCCCC',
    },
    // Page 2: Photo grid
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 36,
      paddingTop: 14,
      gap: 6,
    },
    gridPhoto: {
      width: '31.5%',
      height: 120,
      borderRadius: 4,
      objectFit: 'cover',
    },
    // Features section
    featuresSection: {
      flexDirection: 'row',
      paddingHorizontal: 36,
      paddingTop: 14,
      gap: 20,
    },
    featuresColumn: {
      flex: 1,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    featureBullet: {
      fontSize: 10,
      color: primaryColor,
      marginRight: 6,
      marginTop: 1,
    },
    featureText: {
      fontSize: 9,
      color: '#444444',
      flex: 1,
    },
    // Property details box
    detailsBox: {
      marginHorizontal: 36,
      marginTop: 14,
      padding: 12,
      backgroundColor: '#FAFAFA',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#EEEEEE',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 9,
      color: '#999999',
    },
    detailValue: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#444444',
    },
    // Agent branding section
    agentSection: {
      flexDirection: 'row',
      paddingHorizontal: 36,
      paddingTop: 16,
      alignItems: 'center',
    },
    agentLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    agentLogo: {
      width: 44,
      height: 44,
      objectFit: 'contain',
    },
    agentInfo: {
      flex: 1,
    },
    agentName: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: secondaryColor,
    },
    agentBrokerage: {
      fontSize: 8,
      color: '#666666',
      marginTop: 2,
    },
    agentLicense: {
      fontSize: 7,
      color: '#999999',
      marginTop: 1,
    },
    qrSection: {
      alignItems: 'center',
      marginHorizontal: 14,
    },
    qrCode: {
      width: 56,
      height: 56,
    },
    qrLabel: {
      fontSize: 6,
      color: '#999999',
      marginTop: 2,
      textAlign: 'center',
    },
    agentRight: {
      alignItems: 'flex-end',
    },
    contactText: {
      fontSize: 8,
      color: '#555555',
      marginBottom: 2,
    },
  });
}

interface StatItem {
  value: string;
  label: string;
}

export function FeatureSheetDocument(input: PrintMaterialsInput) {
  const primaryColor = input.brand.primary_color || FALLBACK_PRIMARY;
  const secondaryColor = input.brand.secondary_color || FALLBACK_SECONDARY;
  const styles = createStyles(primaryColor, secondaryColor);

  const heroPhoto = input.photos.find((p) => p.isHero) || input.photos[0];
  const gridPhotos = input.photos.slice(0, 9);

  const listing = input.listing;
  const brand = input.brand;
  const features = listing.features || [];

  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');
  const fullCityLine = [cityState, listing.postal_code].filter(Boolean).join(' ');

  // Build stats
  const stats: StatItem[] = [];
  if (listing.bedrooms) stats.push({ value: String(listing.bedrooms), label: 'Bedrooms' });
  if (listing.bathrooms) stats.push({ value: String(listing.bathrooms), label: 'Bathrooms' });
  if (listing.square_feet) stats.push({ value: listing.square_feet.toLocaleString(), label: 'Sq Ft' });
  if (listing.year_built) stats.push({ value: String(listing.year_built), label: 'Year Built' });
  if (listing.lot_size) stats.push({ value: listing.lot_size, label: 'Lot Size' });

  // Split features into two columns
  const midpoint = Math.ceil(features.length / 2);
  const featuresCol1 = features.slice(0, midpoint);
  const featuresCol2 = features.slice(midpoint);

  // Build property details for the details box
  const details: { label: string; value: string }[] = [];
  if (listing.property_type) details.push({ label: 'Property Type', value: formatPropertyType(listing.property_type) });
  if (listing.parking) details.push({ label: 'Parking', value: listing.parking });
  if (listing.hoa_fees) details.push({ label: 'HOA Fees', value: `$${listing.hoa_fees.toLocaleString()}/mo` });
  if (listing.mls_number) details.push({ label: 'MLS Number', value: listing.mls_number });
  if (listing.lot_size) details.push({ label: 'Lot Size', value: listing.lot_size });

  const renderHeader = (title: string) => (
    <View style={styles.headerBar}>
      {brand.logo_base64 ? (
        <Image src={brand.logo_base64} style={styles.headerLogo} />
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {brand.brokerage_logo_base64 ? (
        <Image src={brand.brokerage_logo_base64} style={styles.headerLogo} />
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
    </View>
  );

  const renderAgentFooter = () => (
    <View style={styles.agentSection}>
      <View style={styles.agentLeft}>
        {brand.logo_base64 && (
          <Image src={brand.logo_base64} style={styles.agentLogo} />
        )}
        <View style={styles.agentInfo}>
          {brand.business_name && <Text style={styles.agentName}>{brand.business_name}</Text>}
          {brand.brokerage_name && <Text style={styles.agentBrokerage}>{brand.brokerage_name}</Text>}
          {brand.license_number && <Text style={styles.agentLicense}>{brand.license_number}</Text>}
        </View>
      </View>
      {input.qrCodeDataUri && (
        <View style={styles.qrSection}>
          <Image src={input.qrCodeDataUri} style={styles.qrCode} />
          <Text style={styles.qrLabel}>Scan for details</Text>
        </View>
      )}
      <View style={styles.agentRight}>
        {brand.phone && <Text style={styles.contactText}>{brand.phone}</Text>}
        {brand.email && <Text style={styles.contactText}>{brand.email}</Text>}
        {brand.website && <Text style={styles.contactText}>{brand.website}</Text>}
      </View>
    </View>
  );

  return (
    <Document
      title={`Feature Sheet - ${listing.address || 'Listing'}`}
      author={brand.business_name || 'SnapR'}
    >
      {/* PAGE 1: Property Overview */}
      <Page size="LETTER" style={styles.page}>
        {renderHeader('FEATURE SHEET')}

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

        {/* Address + Price */}
        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressText}>{listing.address || 'Address Not Available'}</Text>
            {fullCityLine && <Text style={styles.cityStateText}>{fullCityLine}</Text>}
          </View>
          <View>
            <Text style={styles.priceText}>{formatPrice(listing.price)}</Text>
            {listing.mls_number && <Text style={styles.mlsText}>MLS# {listing.mls_number}</Text>}
          </View>
        </View>

        {/* Stats Bar */}
        {stats.length > 0 && (
          <View style={styles.statsBar}>
            {stats.map((stat, i) => (
              <View key={i} style={i === stats.length - 1 ? styles.statBoxLast : styles.statBox}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {listing.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Property</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>
        )}

        {/* Page Footer */}
        <View style={styles.pageFooter}>
          <Text style={styles.footerBrand}>Powered by SnapR</Text>
          <Text style={styles.footerPage}>Page 1 of 2</Text>
        </View>
      </Page>

      {/* PAGE 2: Photos & Features */}
      <Page size="LETTER" style={styles.page}>
        {renderHeader('PHOTOS & FEATURES')}

        {/* Photo Grid */}
        {gridPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {gridPhotos.map((photo) => (
              <Image key={photo.id} src={photo.base64DataUri} style={styles.gridPhoto} />
            ))}
          </View>
        )}

        {/* Features */}
        {features.length > 0 && (
          <View style={styles.featuresSection}>
            <View style={styles.featuresColumn}>
              <Text style={styles.sectionTitle}>Features</Text>
              {featuresCol1.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>&#x2022;</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <View style={styles.featuresColumn}>
              <Text style={{ ...styles.sectionTitle, color: 'transparent' }}>.</Text>
              {featuresCol2.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>&#x2022;</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Property Details Box */}
        {details.length > 0 && (
          <View style={styles.detailsBox}>
            <Text style={{ ...styles.sectionTitle, marginBottom: 6 }}>Property Details</Text>
            {details.map((detail, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{detail.label}</Text>
                <Text style={styles.detailValue}>{detail.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Agent Branding */}
        {renderAgentFooter()}

        {/* Page Footer */}
        <View style={styles.pageFooter}>
          <Text style={styles.footerBrand}>Powered by SnapR</Text>
          <Text style={styles.footerPage}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
}
