// SnapR Real Estate Marketing Guide — 8-page PDF template
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
    paddingVertical: 12,
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
// DOCUMENT
// ============================================

interface GuideDocumentProps {
  qrCodeDataUri?: string;
}

export function MarketingGuideDocument({ qrCodeDataUri }: GuideDocumentProps = {}) {
  return (
    <Document
      title="The Real Estate Photo Marketing Guide"
      author="SnapR"
      subject="AI-powered strategies to market real estate listings faster"
    >
      {/* ===== PAGE 1: COVER ===== */}
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverGlow} />
        <Text style={styles.coverBrand}>
          Snap<Text style={styles.coverBrandGold}>R</Text>
        </Text>
        <View style={styles.coverRule} />
        <Text style={styles.coverTitle}>
          The Real Estate{'\n'}Photo Marketing Guide
        </Text>
        <Text style={styles.coverSubtitle}>
          AI-Powered Strategies to Market{'\n'}Your Listings Faster
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
            Everything you need to transform your listing marketing with professional photography and AI-powered automation.
          </Text>

          {[
            { num: '01', title: 'Why Professional Photos Matter', desc: 'The data behind visual-first marketing', page: '3' },
            { num: '02', title: 'The 5-Step Listing Workflow', desc: 'From upload to measurable results', page: '4' },
            { num: '03', title: 'AI Photo Enhancement', desc: 'Transform ordinary photos into luxury showcases', page: '5' },
            { num: '04', title: 'Marketing Automation', desc: 'Descriptions, captions, MLS, sites, and posts', page: '6' },
            { num: '05', title: 'Social Media & Analytics', desc: 'Platform strategies and ROI tracking', page: '7' },
            { num: '06', title: 'Getting Started', desc: 'Your first listing in under 5 minutes', page: '8' },
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

      {/* ===== PAGE 4: THE 5-STEP WORKFLOW ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Chapter 2" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 02</Text>
          <Text style={styles.chapterTitle}>The 5-Step Listing Workflow</Text>
          <Text style={styles.chapterIntro}>
            The most successful agents follow a structured workflow from photo capture to measuring results. Here is the complete pipeline that top-performing agents use.
          </Text>

          <View style={styles.workflowRow}>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>1</Text>
              <Text style={styles.workflowName}>Upload</Text>
              <Text style={styles.workflowDesc}>Photos to cloud storage</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>2</Text>
              <Text style={styles.workflowName}>Prepare</Text>
              <Text style={styles.workflowDesc}>AI enhancement pipeline</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>3</Text>
              <Text style={styles.workflowName}>Market</Text>
              <Text style={styles.workflowDesc}>Auto-generate assets</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>4</Text>
              <Text style={styles.workflowName}>Distribute</Text>
              <Text style={styles.workflowDesc}>Publish across platforms</Text>
            </View>
            <View style={styles.workflowStep}>
              <Text style={styles.workflowNumber}>5</Text>
              <Text style={styles.workflowName}>Measure</Text>
              <Text style={styles.workflowDesc}>Track engagement + ROI</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Step 1: Upload</Text>
          <Text style={styles.bodyText}>
            Start by capturing photos of the property. Smartphone cameras are perfectly fine since AI enhancement will handle lighting, color, and composition. Upload directly from your phone or computer.
          </Text>

          <Text style={styles.sectionHeading}>Step 2: Prepare</Text>
          <Text style={styles.bodyText}>
            AI analyzes each photo and applies targeted enhancements. Exteriors get sky replacement and lawn repair. Interiors get decluttering, virtual staging, and HDR. The system intelligently decides which tools to apply based on each photo.
          </Text>

          <Text style={styles.sectionHeading}>Step 3: Market</Text>
          <Text style={styles.bodyText}>
            Once photos are ready, the marketing engine generates: MLS-quality property descriptions, platform-specific social captions with hashtags, a public property website, and scheduled social media posts.
          </Text>

          <Text style={styles.sectionHeading}>Steps 4 & 5: Distribute and Measure</Text>
          <Text style={styles.bodyText}>
            Posts are auto-published to Facebook, Instagram, LinkedIn, and TikTok at optimal times. Engagement metrics (likes, comments, shares, impressions) sync automatically so you can track what is working.
          </Text>

          <Callout label="SnapR Advantage">
            SnapR automates the entire pipeline. Upload your photos and the system handles enhancement, marketing asset generation, social publishing, and analytics sync without any manual steps.
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
            Professional photo editing used to require expensive software and hours of manual work. AI enhancement delivers the same results in seconds, automatically selecting the right tools for each image.
          </Text>

          <View style={styles.toolGrid}>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Exterior</Text>
              <Text style={styles.toolItem}>Sky Replacement</Text>
              <Text style={styles.toolItem}>Virtual Twilight</Text>
              <Text style={styles.toolItem}>Lawn Repair</Text>
              <Text style={styles.toolItem}>Pool Enhancement</Text>
            </View>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Interior</Text>
              <Text style={styles.toolItem}>Declutter Rooms</Text>
              <Text style={styles.toolItem}>Virtual Staging</Text>
              <Text style={styles.toolItem}>Fire in Fireplace</Text>
              <Text style={styles.toolItem}>Lights On</Text>
            </View>
            <View style={styles.toolCategory}>
              <Text style={styles.toolCategoryTitle}>Enhance</Text>
              <Text style={styles.toolItem}>HDR Processing</Text>
              <Text style={styles.toolItem}>Color Balance</Text>
              <Text style={styles.toolItem}>Perspective Fix</Text>
              <Text style={styles.toolItem}>Lens Correction</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>How AI Decides What to Apply</Text>
          <Text style={styles.bodyText}>
            The AI analyzes each photo to determine its type (exterior, interior, bathroom, kitchen, etc.) and condition. Based on this analysis, it selects the optimal combination of enhancement tools. An overcast exterior gets sky replacement. A cluttered living room gets decluttering. A dark interior gets HDR and lights-on treatment.
          </Text>

          <Text style={styles.sectionHeading}>Before and After Impact</Text>
          <Text style={styles.bodyText}>
            Enhanced photos consistently outperform originals. Blue sky replacements increase click-through rates. Virtual twilight shots create emotional appeal. Decluttered rooms help buyers envision themselves in the space. Staged vacant rooms sell 73% faster than empty ones.
          </Text>

          <Callout label="Pro Tip">
            Upload all your photos at once. The AI preparation pipeline processes them in parallel, applying different enhancements to each photo based on its content. The entire batch is typically ready in under 60 seconds.
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
            Creating marketing materials for every listing is time-consuming. Automation handles the repetitive work so you can focus on client relationships and closing deals.
          </Text>

          <Text style={styles.sectionHeading}>The 5-Step Marketing Pipeline</Text>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Bullet>Property Description: AI writes MLS-quality descriptions using property details and enhanced photos. Each description is unique, professional, and highlights key selling points.</Bullet>
              <Bullet>Social Captions: Platform-specific captions with relevant hashtags. Instagram gets visual language, LinkedIn gets professional tone, TikTok gets trending hooks.</Bullet>
              <Bullet>MLS Package: Complete photo manifest with property metadata, ready for MLS upload. All enhanced photos organized with correct categorization.</Bullet>
            </View>
            <View style={styles.col}>
              <Bullet>Property Website: A branded, public-facing property page with photo gallery, description, features, map, and contact form. Shareable link with UTM tracking built in.</Bullet>
              <Bullet>Scheduled Posts: Auto-queued social media posts timed for optimal engagement. Each post includes the property site link with UTM parameters for attribution tracking.</Bullet>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Writing Better Descriptions</Text>
          <Text style={styles.bodyText}>
            The best property descriptions paint a picture. They lead with the most compelling feature, use sensory language, mention the neighborhood, and end with a call to action. AI generates these consistently, eliminating the blank-page problem.
          </Text>

          <Text style={styles.sectionHeading}>Hashtag Strategy</Text>
          <Text style={styles.bodyText}>
            Effective real estate hashtags combine location tags (#AustinRealEstate), property type tags (#LuxuryHome), and trending tags (#DreamHome). Each platform has different optimal counts: Instagram allows 30, LinkedIn prefers 3-5, and TikTok works best with 4-6.
          </Text>

          <Callout label="SnapR Advantage">
            The marketing pipeline runs automatically after photo preparation. All five steps complete without any manual input, and each step is independent so one failure does not block the others.
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
            Publishing is only half the equation. Tracking engagement and understanding what resonates with your audience turns marketing from a guessing game into a data-driven strategy.
          </Text>

          <Text style={styles.sectionHeading}>Platform Playbook</Text>

          <View style={styles.platformRow}>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>Instagram</Text>
              <Text style={styles.platformTip}>
                Lead with stunning visuals. Use carousel posts for room-by-room tours. Reels outperform static posts by 2x. Post between 11am-1pm and 7-9pm.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>Facebook</Text>
              <Text style={styles.platformTip}>
                Post to your business page and local groups. Video tours get 5x more engagement. Best times: Tuesday-Thursday, 1-4pm. Boost top performers.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>LinkedIn</Text>
              <Text style={styles.platformTip}>
                Professional tone with market insights. Share just-listed posts with area stats. Best for luxury and commercial listings. Post Tuesday-Thursday mornings.
              </Text>
            </View>
            <View style={styles.platformCard}>
              <Text style={styles.platformName}>TikTok</Text>
              <Text style={styles.platformTip}>
                Short video tours with trending audio. Property walkthroughs and before/after transformations perform best. Post consistently for algorithm favor.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Key Metrics to Track</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Bullet>Impressions: How many people saw your post</Bullet>
              <Bullet>Engagement Rate: Interactions divided by impressions</Bullet>
              <Bullet>Click-Through Rate: Property site visits from posts</Bullet>
            </View>
            <View style={styles.col}>
              <Bullet>Lead Conversion: Inquiries from social traffic</Bullet>
              <Bullet>Cost Per Lead: Marketing spend vs leads generated</Bullet>
              <Bullet>Days on Market: Correlation with marketing activity</Bullet>
            </View>
          </View>

          <Callout label="SnapR Advantage">
            SnapR syncs engagement metrics from all connected platforms every 6 hours. The analytics dashboard shows per-listing and per-platform performance with engagement rate calculations, so you always know what is working.
          </Callout>
        </View>
        <PageFooter page={7} />
      </Page>

      {/* ===== PAGE 8: GETTING STARTED ===== */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader chapter="Getting Started" />
        <View style={styles.content}>
          <Text style={styles.chapterNumber}>Chapter 06</Text>
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
              <Text style={styles.stepDesc}>Sign up at snap-r.com. No credit card required. You get immediate access to AI photo enhancement tools.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload Your First Listing</Text>
              <Text style={styles.stepDesc}>Add property details and upload your photos. The AI will analyze each photo and apply targeted enhancements automatically.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect Your Social Accounts</Text>
              <Text style={styles.stepDesc}>Link your Facebook, Instagram, LinkedIn, and TikTok accounts for automatic publishing and analytics tracking.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Hit Prepare and Watch the Magic</Text>
              <Text style={styles.stepDesc}>One click triggers the full pipeline: photo enhancement, marketing asset generation, property site creation, and social post scheduling.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track Your Results</Text>
              <Text style={styles.stepDesc}>Monitor engagement, leads, and ROI from your analytics dashboard. See which listings and platforms perform best.</Text>
            </View>
          </View>

          {/* CTA Box */}
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Start Marketing Smarter Today</Text>
            <Text style={styles.ctaText}>
              Join thousands of real estate professionals who use SnapR to market listings faster with AI-powered photo enhancement and marketing automation.
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
        <PageFooter page={8} />
      </Page>
    </Document>
  );
}
