// SnapR Real Estate Marketing Guide — Complete Platform Guide PDF
// Uses @react-pdf/renderer for server-side vector PDF generation
/* eslint-disable jsx-a11y/alt-text */
// @react-pdf/renderer Image components do not support alt props

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Link } from '@react-pdf/renderer';

const GOLD = '#D4AF37';
const DARK = '#1A1A1A';
const MEDIUM = '#2A2A2A';
const LIGHT_TEXT = '#E0E0E0';
const MUTED_TEXT = '#999999';
const BODY_TEXT = '#CCCCCC';

const styles = StyleSheet.create({
  // Pages
  page: {
    backgroundColor: DARK,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  coverPage: {
    backgroundColor: DARK,
    fontFamily: 'Helvetica',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // Cover
  coverGlow: {
    position: 'absolute',
    top: 150,
    left: 100,
    width: 400,
    height: 400,
    backgroundColor: GOLD,
    opacity: 0.06,
    borderRadius: 200,
  },
  coverBrand: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  coverBrandGold: {
    color: GOLD,
  },
  coverRule: {
    width: 80,
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 20,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 1.3,
    maxWidth: 400,
  },
  coverSubtitle: {
    fontSize: 14,
    color: BODY_TEXT,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 360,
    lineHeight: 1.5,
  },
  coverBadge: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
  },
  coverBadgeText: {
    fontSize: 10,
    color: GOLD,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 9,
    color: MUTED_TEXT,
  },

  // Page header
  pageHeader: {
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  pageHeaderBrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageHeaderLogo: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  pageHeaderLogoGold: {
    color: GOLD,
  },
  pageHeaderChapter: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Page footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#555555',
  },
  footerPage: {
    fontSize: 7,
    color: '#555555',
  },

  // Content area
  content: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 50,
  },

  // Chapter title
  chapterNumber: {
    fontSize: 10,
    color: GOLD,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chapterTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 1.2,
  },
  chapterIntro: {
    fontSize: 11,
    color: BODY_TEXT,
    lineHeight: 1.7,
    marginBottom: 20,
  },

  // Section heading
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginTop: 18,
    marginBottom: 10,
  },

  // Body text
  bodyText: {
    fontSize: 10,
    color: BODY_TEXT,
    lineHeight: 1.7,
    marginBottom: 10,
  },

  // Stat highlight box
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: MEDIUM,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: MUTED_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Bullet list
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 20,
  },
  bulletDot: {
    fontSize: 10,
    color: GOLD,
    marginRight: 10,
    marginTop: 1,
    width: 10,
  },
  bulletText: {
    fontSize: 10,
    color: BODY_TEXT,
    lineHeight: 1.6,
    flex: 1,
  },

  // Callout box
  callout: {
    backgroundColor: MEDIUM,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderRadius: 6,
    padding: 16,
    marginVertical: 14,
  },
  calloutLabel: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  calloutText: {
    fontSize: 10,
    color: LIGHT_TEXT,
    lineHeight: 1.6,
  },

  // Workflow step boxes
  workflowRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  workflowStep: {
    flex: 1,
    backgroundColor: MEDIUM,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  workflowNumber: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 4,
  },
  workflowName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 3,
  },
  workflowDesc: {
    fontSize: 7,
    color: MUTED_TEXT,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  // Tool category grid
  toolGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  toolCategory: {
    flex: 1,
    backgroundColor: MEDIUM,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  toolCategoryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 8,
  },
  toolItem: {
    fontSize: 9,
    color: BODY_TEXT,
    marginBottom: 4,
    lineHeight: 1.4,
  },

  // Platform cards
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  platformCard: {
    width: '48%',
    backgroundColor: MEDIUM,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  platformName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  platformTip: {
    fontSize: 9,
    color: BODY_TEXT,
    lineHeight: 1.5,
  },

  // TOC styles
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tocNumber: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    width: 30,
  },
  tocTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tocDesc: {
    fontSize: 9,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  tocPage: {
    fontSize: 12,
    color: MUTED_TEXT,
  },

  // CTA page
  ctaBox: {
    backgroundColor: MEDIUM,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: GOLD,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 11,
    color: BODY_TEXT,
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 16,
    maxWidth: 380,
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  ctaButtonText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    letterSpacing: 1,
  },
  ctaUrl: {
    fontSize: 10,
    color: GOLD,
    marginTop: 12,
  },

  // Step list for getting started
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 9,
    color: BODY_TEXT,
    lineHeight: 1.5,
  },

  // Two-column layout
  twoCol: {
    flexDirection: 'row',
    gap: 16,
  },
  col: {
    flex: 1,
  },

  // Feature grid (for new pages)
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: MEDIUM,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  featureTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 9,
    color: BODY_TEXT,
    lineHeight: 1.5,
  },
});

// ============================================
// HELPER COMPONENTS
// ============================================

function PageHeader({ chapter }: { chapter: string }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderBrand}>
        <Text style={styles.pageHeaderLogo}>
          Snap<Text style={styles.pageHeaderLogoGold}>R</Text>
        </Text>
        <Text style={styles.pageHeaderChapter}>{chapter}</Text>
      </View>
    </View>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <View style={styles.pageFooter}>
      <Text style={styles.footerText}>Powered by SnapR | snap-r.com</Text>
      <Text style={styles.footerPage}>{page}</Text>
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>&#x2022;</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Callout({ label, children }: { label: string; children: string }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutLabel}>{label}</Text>
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

// ============================================
// DOCUMENT — 12-page complete platform guide
// ============================================

interface GuideDocumentProps {
  qrCodeDataUri?: string;
}

export function MarketingGuideDocument({ qrCodeDataUri }: GuideDocumentProps = {}) {
  return (
    <Document
      title="The Complete SnapR Platform Guide"
      author="SnapR"
      subject="AI-powered real estate photo marketing — the complete platform guide"
    >
      {/* ===== PAGE 1: COVER ===== */}
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverGlow} />
        <Text style={styles.coverBrand}>
          Snap<Text style={styles.coverBrandGold}>R</Text>
        </Text>
        <View style={styles.coverRule} />
        <Text style={styles.coverTitle}>
          The Complete Platform{'\n'}Guide
        </Text>
        <Text style={styles.coverSubtitle}>
          Photos to Published Listing{'\n'}in Under Ten Minutes
        </Text>
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>2026 Edition</Text>
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>snap-r.com</Text>
        </View>
      </Page>

      {/* ===== PAGE 2: TABLE OF CONTENTS ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Table of Contents" />
        <View style={styles.content}>
          <Text style={styles.chapterTitle}>Inside This Guide</Text>
          <Text style={styles.bodyText}>
            Everything you need to master the complete SnapR platform — from AI photo enhancement to lead conversion.
          </Text>

          {[
            { num: '01', title: 'Why Professional Photos Matter', desc: 'The data behind visual-first marketing', page: '3' },
            { num: '02', title: 'The Automation OS', desc: 'Upload → Prepare → Market → Distribute → Measure', page: '4' },
            { num: '03', title: 'AI Photo Enhancement', desc: '15 tools to transform any photo into luxury', page: '5' },
            { num: '04', title: 'Marketing Automation', desc: 'Descriptions, captions, MLS, sites, video & posts', page: '6' },
            { num: '05', title: 'Social Media & Analytics', desc: '5-platform publishing with engagement tracking', page: '7' },
            { num: '06', title: 'Lead CRM & Nurturing', desc: 'Kanban pipeline, auto-scoring, and drip sequences', page: '8' },
            { num: '07', title: 'Open Houses & Events', desc: 'Digital check-in, attendee tracking, lead capture', page: '9' },
            { num: '08', title: 'Team & Broker Tools', desc: 'Multi-agent dashboard with role-based access', page: '10' },
            { num: '09', title: 'Photographer Marketplace', desc: 'Packages, bookings, availability, and revenue', page: '11' },
            { num: '10', title: 'Getting Started', desc: 'Your first listing in under 5 minutes', page: '12' },
          ].map((item) => (
            <View key={item.num} style={styles.tocItem}>
              <View style={styles.tocLeft}>
                <Text style={styles.tocNumber}>{item.num}</Text>
                <View>
                  <Text style={styles.tocTitle}>{item.title}</Text>
                  <Text style={styles.tocDesc}>{item.desc}</Text>
                </View>
              </View>
              <Text style={styles.tocPage}>{item.page}</Text>
            </View>
          ))}
        </View>
        <PageFooter page={2} />
      </Page>

      {/* ===== PAGE 3: WHY PROFESSIONAL PHOTOS MATTER ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 1" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 01</Text>
          <Text style={styles.chapterTitle}>Why Professional Photos Matter</Text>
          <Text style={styles.chapterIntro}>
            In real estate, the first showing happens online. Buyers scroll through dozens of listings in seconds, and photography quality is the single biggest factor in whether they stop or keep scrolling.
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>32%</Text>
              <Text style={styles.statLabel}>Faster Sales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3x</Text>
              <Text style={styles.statLabel}>More Online Views</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>47%</Text>
              <Text style={styles.statLabel}>Higher Asking Price</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>What Buyers See First</Text>
          <Text style={styles.bodyText}>
            Studies show that 97% of homebuyers start their search online, and 87% found photos to be among the most useful features of listing websites. The quality of your listing photos directly impacts:
          </Text>
          <Bullet>Time on listing page and engagement rate</Bullet>
          <Bullet>Number of showing requests and inquiries</Bullet>
          <Bullet>Perceived property value and willingness to pay</Bullet>
          <Bullet>Agent credibility and repeat business</Bullet>

          <Text style={styles.sectionHeading}>The Cost of Bad Photos</Text>
          <Text style={styles.bodyText}>
            Listings with amateur photos sit on market 2-3x longer. Poor lighting, cluttered rooms, and unedited exteriors signal neglect to buyers. Even a well-priced property underperforms when the photos do not match the experience of visiting in person.
          </Text>

          <Callout label="SnapR Advantage">
            SnapR uses AI to transform ordinary smartphone photos into professional-quality images in seconds. Sky replacement, virtual staging, HDR enhancement, and decluttering give every listing the visual quality of a luxury showcase.
          </Callout>
        </View>
        <PageFooter page={3} />
      </Page>

      {/* ===== PAGE 4: THE AUTOMATION OS ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 2" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 02</Text>
          <Text style={styles.chapterTitle}>The Automation OS</Text>
          <Text style={styles.chapterIntro}>
            SnapR is not just a photo editor. It is a complete automation operating system for real estate marketing. One upload triggers an end-to-end pipeline that handles everything from enhancement to measuring results.
          </Text>

          <View style={styles.workflowRow}>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>1</Text>
              <Text style={styles.workflowName}>Upload</Text>
              <Text style={styles.workflowDesc}>Photos to cloud</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>2</Text>
              <Text style={styles.workflowName}>Prepare</Text>
              <Text style={styles.workflowDesc}>AI enhancement</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>3</Text>
              <Text style={styles.workflowName}>Market</Text>
              <Text style={styles.workflowDesc}>Auto-generate</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>4</Text>
              <Text style={styles.workflowName}>Distribute</Text>
              <Text style={styles.workflowDesc}>5-platform publish</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>5</Text>
              <Text style={styles.workflowName}>Measure</Text>
              <Text style={styles.workflowDesc}>Track ROI</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>The Loop: Status-Driven Re-Marketing</Text>
          <Text style={styles.bodyText}>
            The automation does not stop after the first publish. When a listing status changes — price drop, open house announced, under contract, or sold — SnapR can automatically re-trigger the marketing pipeline with fresh content tailored to the new status.
          </Text>

          <Text style={styles.sectionHeading}>The 6-Step Marketing Pipeline</Text>
          <Bullet>Property Description: AI writes MLS-quality descriptions from property details and enhanced photos</Bullet>
          <Bullet>Social Captions: Platform-specific captions with trending hashtags for each network</Bullet>
          <Bullet>MLS Package: Complete photo manifest with property metadata, ready for upload</Bullet>
          <Bullet>Property Website: Branded, shareable property page with gallery, map, and contact form</Bullet>
          <Bullet>Cinematic Video: AI-scripted property showcase video with professional voiceover</Bullet>
          <Bullet>Scheduled Posts: Auto-queued across 5 platforms with UTM tracking for attribution</Bullet>

          <Callout label="Always-Complete Semantics">
            Each pipeline step runs independently. If one step fails, the others still complete. You never lose work because of a single API hiccup.
          </Callout>
        </View>
        <PageFooter page={4} />
      </Page>

      {/* ===== PAGE 5: AI PHOTO ENHANCEMENT ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 3" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 03</Text>
          <Text style={styles.chapterTitle}>AI Photo Enhancement</Text>
          <Text style={styles.chapterIntro}>
            The AI Studio gives you 15 professional enhancement tools with instant before-and-after previews. Each tool is designed for a specific real estate photography challenge.
          </Text>

          <View style={styles.toolGrid}>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Exterior (4)</Text>
              <Text style={styles.toolItem}>Sky Replacement</Text>
              <Text style={styles.toolItem}>Virtual Twilight</Text>
              <Text style={styles.toolItem}>Lawn Repair</Text>
              <Text style={styles.toolItem}>Pool Enhancement</Text>
            </View>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Interior (6)</Text>
              <Text style={styles.toolItem}>Declutter Rooms</Text>
              <Text style={styles.toolItem}>Virtual Staging</Text>
              <Text style={styles.toolItem}>Fire in Fireplace</Text>
              <Text style={styles.toolItem}>TV Screen Art</Text>
              <Text style={styles.toolItem}>Lights On</Text>
              <Text style={styles.toolItem}>Window Masking</Text>
            </View>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Enhance (5)</Text>
              <Text style={styles.toolItem}>HDR Processing</Text>
              <Text style={styles.toolItem}>Auto Enhance</Text>
              <Text style={styles.toolItem}>Color Balance</Text>
              <Text style={styles.toolItem}>Perspective Fix</Text>
              <Text style={styles.toolItem}>Lens Correction</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Automatic AI Preparation</Text>
          <Text style={styles.bodyText}>
            Upload all your photos at once and hit Prepare. The AI classifies each photo by type (exterior, kitchen, bathroom, living room, etc.) and applies the optimal combination of tools automatically. An overcast exterior gets sky replacement. A dark interior gets HDR and lights-on. A vacant room gets virtual staging.
          </Text>

          <Text style={styles.sectionHeading}>Manual Studio Mode</Text>
          <Text style={styles.bodyText}>
            Prefer hands-on control? Open any photo in the AI Studio for manual editing. Pick a tool, choose a preset (e.g., Clear Blue Sky, Dramatic Clouds, Sunset), and preview the result in real-time with an interactive before/after slider.
          </Text>

          <Callout label="Pro Tip">
            Smartphone photos work great. The AI handles lighting, color, and composition. Shoot wide, capture all rooms, and let SnapR do the post-production. A complete listing batch is typically ready in under 60 seconds.
          </Callout>
        </View>
        <PageFooter page={5} />
      </Page>

      {/* ===== PAGE 6: MARKETING AUTOMATION ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 4" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 04</Text>
          <Text style={styles.chapterTitle}>Marketing Automation</Text>
          <Text style={styles.chapterIntro}>
            Once photos are enhanced, marketing happens automatically. SnapR generates a complete marketing package in seconds — no manual copywriting, scheduling, or site building required.
          </Text>

          <Text style={styles.sectionHeading}>Content Studio</Text>
          <Text style={styles.bodyText}>
            The Content Studio is your command center for all generated marketing assets. View and edit property descriptions, copy platform-specific captions, download MLS packages, preview property websites, and manage scheduled posts — all from one panel.
          </Text>

          <Text style={styles.sectionHeading}>Cinematic Property Videos</Text>
          <Text style={styles.bodyText}>
            Create professional property showcase videos with AI voiceover. Choose from 5 templates (PropertyShowcase, JustListed, OpenHouse, PriceDrop, Sold) in 3 aspect ratios (vertical 9:16, landscape 16:9, square 1:1). Pick a script style (Professional, Luxury, Friendly, First-Time Buyer), select from 6 voices, and render in minutes.
          </Text>

          <Text style={styles.sectionHeading}>Campaign Engine</Text>
          <Text style={styles.bodyText}>
            Create marketing campaigns triggered by listing status changes. When a price drops, an open house is announced, or a property goes under contract, the campaign engine automatically generates fresh content and queues new posts. View everything on the content calendar — drag and drop to reschedule.
          </Text>

          <Text style={styles.sectionHeading}>Email Marketing</Text>
          <Text style={styles.bodyText}>
            Send bulk emails to your lead lists directly from SnapR. Compose messages with template variables (name, first name), select recipients, and track delivery. Every send is logged as a lead activity for CRM visibility.
          </Text>

          <Callout label="SnapR Advantage">
            The marketing pipeline runs automatically after preparation. Each step is independent — descriptions, captions, MLS, video, property site, and scheduled posts all generate in parallel.
          </Callout>
        </View>
        <PageFooter page={6} />
      </Page>

      {/* ===== PAGE 7: SOCIAL MEDIA & ANALYTICS ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 5" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 05</Text>
          <Text style={styles.chapterTitle}>Social Media & Analytics</Text>
          <Text style={styles.chapterIntro}>
            Publish to five platforms simultaneously and track every metric. SnapR handles token management, optimal timing, and UTM attribution so you know exactly which posts drive leads.
          </Text>

          <Text style={styles.sectionHeading}>5-Platform Publishing</Text>

          <View style={styles.platformRow}>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>Instagram</Text>
              <Text style={styles.platformTip}>
                Photo carousels and Reels. Business account required. Supports image posts and video publishing. Reels outperform static posts 2x.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>Facebook</Text>
              <Text style={styles.platformTip}>
                Page posts with photos and video. Auto-refreshes long-lived tokens. Best for community engagement and local groups.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>LinkedIn</Text>
              <Text style={styles.platformTip}>
                Professional posts with images and video. Community Management API v2. Ideal for luxury and commercial listings.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>TikTok</Text>
              <Text style={styles.platformTip}>
                Video and photo carousels. PULL_FROM_URL method for videos. Growing audience for property walkthroughs.
              </Text>
            </View>
          </View>

          <Text style={styles.platformName}>Twitter / X</Text>
          <Text style={styles.bodyText}>
            Text posts with image and video attachments. Great for quick just-listed announcements and market updates.
          </Text>

          <Text style={styles.sectionHeading}>Analytics Dashboard</Text>
          <Text style={styles.bodyText}>
            Engagement metrics sync automatically every 6 hours. Track impressions, likes, comments, shares, reach, engagement rate, and click-throughs — broken down by platform, by listing, and by content type. UTM parameters on every property site link give you end-to-end attribution from social post to lead.
          </Text>

          <Callout label="Token Management">
            SnapR automatically refreshes expiring access tokens. Facebook tokens are exchanged for long-lived versions. TikTok tokens refresh every 24 hours. You never need to reconnect unless you revoke access.
          </Callout>
        </View>
        <PageFooter page={7} />
      </Page>

      {/* ===== PAGE 8: LEAD CRM & NURTURING ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 6" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 06</Text>
          <Text style={styles.chapterTitle}>Lead CRM & Nurturing</Text>
          <Text style={styles.chapterIntro}>
            Every inquiry, showing request, and site visitor flows into a built-in CRM. No external tools needed. Track, score, and nurture leads from first contact to close.
          </Text>

          <Text style={styles.sectionHeading}>Kanban Pipeline</Text>
          <Text style={styles.bodyText}>
            View your leads as a list or switch to the visual pipeline. Drag leads through stages: New, Contacted, Qualified, Touring, Offer, Closed, or Lost. Every stage change is tracked in the activity timeline.
          </Text>

          <Text style={styles.sectionHeading}>Auto-Scoring</Text>
          <Text style={styles.bodyText}>
            Every lead action automatically updates their score (capped at 100). A property site view adds 8 points. An email or text adds 5. A phone call adds 10. A showing adds 20. High-score leads are prioritized in your pipeline.
          </Text>

          <Text style={styles.sectionHeading}>Activity Timeline</Text>
          <Text style={styles.bodyText}>
            Every interaction is logged: calls, emails, texts, showings, notes, form submissions, site views, and drip email sends. The timeline gives you complete context before every client touchpoint.
          </Text>

          <Text style={styles.sectionHeading}>Drip Sequences</Text>
          <Text style={styles.bodyText}>
            Create multi-step email sequences that run on autopilot. Set delays between steps (1 day, 3 days, 1 week). Enroll leads manually or automatically. Each drip email send adds 2 points to the lead score and logs an activity. Enable, pause, or delete sequences anytime.
          </Text>

          <Text style={styles.sectionHeading}>Bulk Email</Text>
          <Text style={styles.bodyText}>
            Select multiple leads and send personalized emails with template variables. Every send is tracked in the activity timeline with metadata flagging it as a bulk send.
          </Text>

          <Callout label="SnapR Advantage">
            Leads from property sites, open house check-ins, photographer bookings, and social traffic all converge into one CRM. No manual data entry. No lost leads.
          </Callout>
        </View>
        <PageFooter page={8} />
      </Page>

      {/* ===== PAGE 9: OPEN HOUSES & EVENTS ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 7" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 07</Text>
          <Text style={styles.chapterTitle}>Open Houses & Events</Text>
          <Text style={styles.chapterIntro}>
            Manage open house events from creation to follow-up. Digital check-in replaces paper sign-in sheets and automatically captures attendee data into your lead pipeline.
          </Text>

          <Text style={styles.sectionHeading}>Event Management</Text>
          <Text style={styles.bodyText}>
            Create open house events with date, time, capacity, and description. Each event gets a unique public check-in URL that you can share or display as a QR code at the door. Events flow through statuses: Upcoming, Active, Completed, or Cancelled.
          </Text>

          <Text style={styles.sectionHeading}>Digital Guest Check-In</Text>
          <Text style={styles.bodyText}>
            Attendees scan the QR code or visit the check-in URL on their phone. They enter their name, email, phone, and how they heard about the property. No app download required — it is a responsive web form in your branded styling.
          </Text>

          <Text style={styles.sectionHeading}>Attendee Tracking</Text>
          <Text style={styles.bodyText}>
            View all attendees in real-time. Rate interest levels, add private notes, and see exactly who visited. After the event, all attendees flow into your lead CRM with their check-in data pre-populated.
          </Text>

          <Text style={styles.sectionHeading}>Showing Feedback</Text>
          <Text style={styles.bodyText}>
            After showings and open houses, collect structured feedback from attendees. Rating scales, interest levels, and open-ended comments give you actionable insights about buyer reactions.
          </Text>

          <Callout label="Pro Tip">
            Print the check-in QR code and display it at the front door. It captures 3-5x more attendee data than paper sign-in sheets, and every check-in becomes a scored lead in your CRM.
          </Callout>
        </View>
        <PageFooter page={9} />
      </Page>

      {/* ===== PAGE 10: TEAM & BROKER TOOLS ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 8" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 08</Text>
          <Text style={styles.chapterTitle}>Team & Broker Tools</Text>
          <Text style={styles.chapterIntro}>
            Built for brokerages of any size. The broker dashboard gives team leaders visibility into every agent, listing, and lead across the entire organization.
          </Text>

          <Text style={styles.sectionHeading}>Broker Command Center</Text>
          <Text style={styles.bodyText}>
            See every agent on your team with their listing counts, lead counts, and performance metrics. Charts visualize team activity over time. The agent roster shows who is active, their role, and their recent activity.
          </Text>

          <Text style={styles.sectionHeading}>Role-Based Access</Text>
          <Text style={styles.bodyText}>
            Invite team members with granular roles. Admins manage the entire team and billing. Editors create and edit listings and content. Viewers can observe dashboards and analytics but cannot modify data. Each role maps to specific permissions across the platform.
          </Text>

          <Text style={styles.sectionHeading}>Organization Settings</Text>
          <Text style={styles.bodyText}>
            Configure organization-wide branding, default social accounts, and team notification preferences. Brand kits ensure every piece of generated content carries consistent branding — logos, colors, fonts, and contact info.
          </Text>

          <Text style={styles.sectionHeading}>White-Label & Embed</Text>
          <Text style={styles.bodyText}>
            Agency and Enterprise tiers unlock embeddable widgets — before/after sliders, photo galleries, and property cards that you can embed on your own website. Enterprise users can also map custom domains to their property sites and portfolios.
          </Text>

          <Callout label="Enterprise Features">
            Enterprise tier unlocks the REST API (API key auth), custom domains, embeddable widgets, and OpenAPI documentation. Build integrations with your existing CRM, MLS, or website.
          </Callout>
        </View>
        <PageFooter page={10} />
      </Page>

      {/* ===== PAGE 11: PHOTOGRAPHER MARKETPLACE ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 9" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 09</Text>
          <Text style={styles.chapterTitle}>Photographer Marketplace</Text>
          <Text style={styles.chapterIntro}>
            Whether you are a photographer managing bookings or an agent hiring one, SnapR streamlines the entire workflow from package selection to photo delivery.
          </Text>

          <Text style={styles.sectionHeading}>For Photographers</Text>

          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Packages</Text>
              <Text style={styles.featureDesc}>Create service packages with pricing, descriptions, and deliverable counts. Basic, Premium, Luxury — set your own tiers.</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Booking Pipeline</Text>
              <Text style={styles.featureDesc}>Track every booking: Pending, Confirmed, Shot, Editing, Delivered. Pipeline view shows your entire workflow at a glance.</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Availability</Text>
              <Text style={styles.featureDesc}>Set your available days and times. Agents only see open slots when booking. Block out vacations or busy periods.</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>Portfolio</Text>
              <Text style={styles.featureDesc}>Build a public portfolio showcasing your best work. Shareable link for marketing. Potential clients see your style before booking.</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>For Agents</Text>
          <Text style={styles.bodyText}>
            Book photographers through a branded public page. Pick a package, enter property details (address, size, special requirements), select a date from available slots, and submit. The photographer gets notified instantly, and the booking enters their pipeline.
          </Text>

          <Text style={styles.sectionHeading}>Client Approval Workflow</Text>
          <Text style={styles.bodyText}>
            After photos are enhanced, share a gallery link with your client. They can view, approve, reject, download, and comment on individual photos. All client interactions trigger notifications and are tracked in the activity timeline.
          </Text>

          <Callout label="SnapR Advantage">
            The booking form, photo delivery, AI enhancement, and marketing pipeline are all connected. A photographer delivers photos, the agent approves them, and SnapR auto-generates marketing — one seamless workflow.
          </Callout>
        </View>
        <PageFooter page={11} />
      </Page>

      {/* ===== PAGE 12: GETTING STARTED ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Getting Started" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 10</Text>
          <Text style={styles.chapterTitle}>Getting Started</Text>
          <Text style={styles.chapterIntro}>
            Ready to transform your listing marketing? Here is how to get your first listing live in under 5 minutes.
          </Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Your Free Account</Text>
              <Text style={styles.stepDesc}>Sign up at snap-r.com. No credit card required. Choose your role (Photographer, Agent, Broker) to get a personalized setup experience.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload Your First Listing</Text>
              <Text style={styles.stepDesc}>Add property details and upload photos. Or try the sample listing to see the platform in action before committing your own content.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Hit Prepare</Text>
              <Text style={styles.stepDesc}>One click triggers AI enhancement for all photos, followed by automatic marketing generation — descriptions, captions, video, property site, and scheduled posts.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect Social Accounts</Text>
              <Text style={styles.stepDesc}>Link Facebook, Instagram, LinkedIn, TikTok, and Twitter for automatic publishing. Posts go out every 15 minutes at optimal times.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track, Nurture, Close</Text>
              <Text style={styles.stepDesc}>Monitor analytics. Manage leads in the CRM. Set up drip sequences. Run open houses with digital check-in. Let the automation loop handle the rest.</Text>
            </View>
          </View>

          {/* CTA Box */}
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Start Marketing Smarter Today</Text>
            <Text style={styles.ctaText}>
              Join real estate professionals who use SnapR to market listings faster with AI-powered photo enhancement, automated marketing, lead nurturing, and team management.
            </Text>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>GET STARTED FREE</Text>
            </View>
            <Link src="https://snap-r.com/auth/signup">
              <Text style={styles.ctaUrl}>snap-r.com/auth/signup</Text>
            </Link>
            {qrCodeDataUri && (
              <Image src={qrCodeDataUri} style={{ width: 60, height: 60, marginTop: 12 }} />
            )}
          </View>
        </View>
        <PageFooter page={12} />
      </Page>
    </Document>
  );
}
