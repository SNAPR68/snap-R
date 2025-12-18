# SnapR Comprehensive Audit & Feature Documentation
**Generated:** December 14, 2025  
**Version:** 1.0  
**Status:** Complete Feature Inventory

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Application Architecture](#application-architecture)
3. [Complete Feature Inventory](#complete-feature-inventory)
4. [User Journeys & Flows](#user-journeys--flows)
5. [User Experience & Interface](#user-experience--interface)
6. [Technical Stack & Infrastructure](#technical-stack--infrastructure)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Integrations & Third-Party Services](#integrations--third-party-services)
10. [Pricing & Monetization](#pricing--monetization)
11. [Content & Marketing Features](#content--marketing-features)
12. [Compliance & MLS Features](#compliance--mls-features)
13. [Admin & Management](#admin--management)

---

## Executive Summary

**SnapR** is a comprehensive AI-powered real estate photo enhancement and marketing platform designed for photographers, real estate agents, brokers, and property owners. The platform combines advanced AI image processing with social media management, content creation, listing intelligence, and MLS compliance tools.

### Core Value Proposition
- **AI-Powered Photo Enhancement**: 15 specialized tools for transforming real estate photos
- **Content Studio**: Social media post creation, scheduling, and publishing
- **Listing Intelligence**: AI-driven analysis and recommendations
- **MLS Compliance**: Automated watermarking, metadata embedding, and export packages
- **Marketing Automation**: Campaign management, email templates, and social scheduling
- **Client Collaboration**: Share galleries, approval workflows, and client portals

### Target Users
1. **Real Estate Photographers** - Professional photo enhancement workflow
2. **Real Estate Agents** - Listing presentation and marketing tools
3. **Brokers** - Team management and brand consistency
4. **Property Owners** - DIY property marketing

---

## Application Architecture

### Technology Stack
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (R2-compatible)
- **Authentication**: Supabase Auth
- **AI Providers**: 
  - Replicate (Flux Kontext - Primary)
  - OpenAI (Vision API for quality scoring)
  - AutoEnhance.ai (Alternative provider)
- **Payment Processing**: Stripe
- **Email**: Resend
- **Deployment**: Vercel / Cloudflare Pages
- **Queue System**: Cloudflare Queues (for async processing)

### Architecture Patterns
- **Server-Side Rendering (SSR)**: Next.js App Router with server components
- **Client-Side Interactivity**: React hooks and client components
- **API Routes**: RESTful endpoints in `/app/api`
- **Real-time Updates**: Supabase real-time subscriptions
- **File Processing**: Dual-path (synchronous Studio + async queue-based)

---

## Complete Feature Inventory

### 1. AI Photo Enhancement Tools (15 Tools)

#### EXTERIOR Tools (4)
1. **Sky Replacement**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Clear Blue, Sunset, Dramatic Clouds, Twilight Sky
   - Credits: 1 per enhancement
   - Use Case: Replace overcast or plain skies with dramatic alternatives

2. **Virtual Twilight**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Dusk, Blue Hour, Golden Hour, Deep Night
   - Credits: 2 per enhancement
   - Use Case: Transform daytime exteriors into twilight/night scenes with lit windows

3. **Lawn Repair**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Lush Green, Natural Green
   - Credits: 1 per enhancement
   - Use Case: Enhance brown or patchy lawns to vibrant green

4. **Pool Enhancement**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Credits: 1 per enhancement
   - Use Case: Make pool water crystal clear and inviting

#### INTERIOR Tools (6)
5. **Declutter**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Light Clean, Moderate, Full Clear, Staging Ready
   - Credits: 2 per enhancement
   - Use Case: Remove personal items and clutter from interior photos

6. **Virtual Staging**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Modern, Traditional, Scandinavian, Luxury
   - Credits: 3 per enhancement
   - Use Case: Add furniture and decor to empty rooms
   - **MLS Compliance**: Auto-watermarking for US agents/brokers

7. **Fire in Fireplace**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Cozy Embers, Warm Fire, Roaring Fire, Romantic
   - Credits: 1 per enhancement
   - Use Case: Add realistic fire to fireplace

8. **TV Screen Replace**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Nature, Abstract Art, Ocean View, Black/Off
   - Credits: 1 per enhancement
   - Use Case: Replace TV screens with appealing content or turn off

9. **Lights On**
   - Model: `black-forest-labs/flux-kontext-dev`
   - Presets: Warm Glow, Bright White, Ambient, All Lights Max
   - Credits: 1 per enhancement
   - Use Case: Turn on all lights for better interior illumination

10. **Window Masking**
    - Model: `black-forest-labs/flux-kontext-dev`
    - Presets: Balanced, Sunny Day, Garden View, Soft Light
    - Credits: 2 per enhancement
    - Use Case: Balance window exposure and show outdoor views

#### ENHANCE Tools (5)
11. **HDR Enhancement**
    - Model: `black-forest-labs/flux-kontext-dev`
    - Credits: 1 per enhancement
    - Use Case: Improve exposure balance and color vibrancy

12. **Auto Enhance**
    - Model: `black-forest-labs/flux-kontext-dev` (calls HDR)
    - Credits: 1 per enhancement
    - Use Case: One-click automatic photo improvement

13. **Perspective Correction**
    - Model: `black-forest-labs/flux-kontext-dev`
    - Credits: 1 per enhancement
    - Use Case: Fix architectural distortion and straighten lines

14. **Lens Correction**
    - Model: `black-forest-labs/flux-kontext-dev`
    - Credits: 1 per enhancement
    - Use Case: Remove barrel/pincushion distortion and vignetting

15. **Color Balance**
    - Model: `black-forest-labs/flux-kontext-dev`
    - Presets: Warm Tones, Cool Tones
    - Credits: 1 per enhancement
    - Use Case: Adjust color temperature and tone

### 2. Studio & Enhancement Workflow

#### Studio Interface (`/dashboard/studio`)
- **Interactive Photo Selection**: Grid view of all listing photos
- **Before/After Slider**: Real-time comparison tool
- **Tool Selection Sidebar**: Categorized AI tools with presets
- **Preset Gallery**: Visual thumbnails for each tool preset
- **Real-time Processing**: Live status updates during enhancement
- **Adjustment Panel**: Post-enhancement fine-tuning
  - Brightness, Contrast, Saturation, Warmth controls
  - Intensity slider
- **Style Application**: Apply enhancements to single photo or entire listing
- **Batch Enhancement**: Process multiple photos with same preset
- **Keyboard Shortcuts**: Power user navigation
- **Download Ready Panel**: Enhanced photos ready for download

#### Enhancement Features
- **Credit System**: Per-tool credit costs
- **Quality Scoring**: OpenAI Vision API for enhancement validation
- **Retry Mechanism**: Failed enhancements can be retried
- **Storage Management**: Automatic Supabase storage organization
- **Processing Queue**: Background job system for bulk operations

### 3. Content Studio

#### Social Media Post Creation (`/dashboard/content-studio`)
- **Multi-Platform Support**:
  - Instagram (Feed, Stories, Reels)
  - Facebook (Posts, Stories)
  - LinkedIn (Posts)
  - TikTok (Videos)
- **Template Library**: 150+ pre-designed templates
- **AI Caption Generation**: Context-aware captions with hashtags
- **Smart Hashtag Generator**: Platform-optimized hashtag suggestions
- **Brand Kit Integration**: Custom logos, colors, fonts
- **Photo Selection**: Choose from enhanced listing photos
- **Customization Tools**:
  - Text overlays
  - Filters and effects
  - Layout options
  - Aspect ratio presets

#### Video Creation (`/dashboard/content-studio/video`)
- **Slideshow Videos**: Create Reels/TikTok from photo sequences
- **Music Integration**: Background music selection
- **Transitions**: Smooth photo transitions
- **Text Animations**: Animated captions and overlays
- **Export Formats**: Optimized for each platform

#### Bulk Creator (`/dashboard/content-studio/bulk`)
- **Multi-Listing Processing**: Generate content for multiple listings
- **Template Application**: Apply same template across listings
- **Batch Scheduling**: Schedule all posts at once
- **Variation Generation**: Create unique variations per listing

#### Email Marketing (`/dashboard/content-studio/email`)
- **Campaign Templates**: Pre-designed email templates
- **Listing Showcase**: Feature multiple photos per email
- **Personalization**: Dynamic content insertion
- **Send Scheduling**: Schedule email campaigns
- **Analytics**: Open rates and engagement tracking

### 4. Campaign Management (`/dashboard/campaigns`)

#### Campaign Types
- **Status-Based Triggers**: Auto-publish when listing status changes
- **Scheduled Campaigns**: Time-based content publishing
- **Multi-Platform Campaigns**: Coordinate across all social platforms
- **Email Campaigns**: Automated email sequences

#### Campaign Features
- **Queue Management**: View and manage pending posts
- **Approval Workflow**: Review before publishing
- **Status Tracking**: Real-time campaign status
- **Analytics Dashboard**: Performance metrics
- **History**: Complete campaign archive

### 5. Listing Intelligence (`/dashboard/listing-intelligence`)

#### AI Analysis Features
- **Photo Quality Analysis**: Automatic quality scoring
- **Enhancement Recommendations**: AI suggests which tools to use
- **Room Type Detection**: Automatic room classification
- **Composition Analysis**: Professional photography feedback
- **Batch Recommendations**: Apply suggestions to multiple photos
- **Before/After Comparison**: Visual improvement tracking

### 6. Client Collaboration & Sharing

#### Share Galleries (`/share/[token]`)
- **Secure Sharing**: Token-based access control
- **Client Approval**: Approve/reject workflow
- **Download Permissions**: Control client download access
- **Before/After View**: Comparison slider for clients
- **Mobile Optimized**: Responsive design for all devices
- **Email Notifications**: Automatic share link emails

#### Approval Dashboard (`/dashboard/approvals`)
- **Pending Approvals**: View all awaiting client approval
- **Approval Status**: Track approval/rejection status
- **Client Comments**: Feedback collection
- **Bulk Actions**: Approve/reject multiple items

### 7. MLS Compliance & Export

#### MLS Export (`/dashboard/compliance`)
- **MLS Pack Generation**: ZIP file with multiple resolutions
  - MLS Resolution (2048px max width, 70% quality)
  - Email Resolution (1200px, 55% quality)
  - Full Resolution (original)
- **Manifest File**: JSON metadata with export details
- **Disclosure Documents**: Automatic disclosure generation
- **Watermarking**: "Virtually Staged" watermark for staging images
- **Metadata Embedding**: RESO-compliant metadata
- **MLS-Specific Settings**: Support for multiple MLS organizations

#### Compliance Features
- **US Market Mode**: Region-specific compliance rules
- **Role-Based Policies**: Different rules for photographers vs agents
- **Tone Adjustments**: MLS-safe color corrections
- **Watermark Enforcement**: Automatic watermarking based on role/region

### 8. Portfolio & Property Sites

#### Portfolio (`/dashboard/portfolio`)
- **Public Portfolio Pages**: Shareable portfolio URLs
- **Custom Branding**: Logo and color customization
- **Photo Galleries**: Curated photo collections
- **Listing Showcases**: Feature specific properties

#### Property Sites (`/dashboard/content-studio/sites`)
- **Auto-Generated Sites**: One-click property websites
- **Custom Domains**: Use your own domain
- **QR Code Generation**: Print-ready QR codes
- **Mobile Responsive**: Optimized for all devices

### 9. Virtual Tours (`/dashboard/virtual-tours`)

- **Scene Management**: Create multi-scene tours
- **Photo Integration**: Use enhanced listing photos
- **Navigation Points**: Hotspot connections between scenes
- **Embedding**: Embed tours in websites
- **Analytics**: View tracking and engagement

### 10. Floor Plans (`/dashboard/floor-plans`)

- **Upload & Process**: Upload floor plan images
- **AI Enhancement**: Improve clarity and readability
- **Annotation Tools**: Add room labels and dimensions
- **Export Options**: Multiple format exports

### 11. Renovation Visualization (`/dashboard/renovation`)

- **Before/After Scenarios**: Show renovation possibilities
- **Style Application**: Apply different design styles
- **Cost Estimation**: Integration with renovation cost data
- **Client Presentation**: Share renovation concepts

### 12. Photo Culling (`/dashboard/photo-culling`)

- **AI-Powered Culling**: Automatic photo selection
- **Quality Filtering**: Remove blurry/duplicate photos
- **Batch Selection**: Select/deselect multiple photos
- **Export Selected**: Download only chosen photos

### 13. AI Descriptions (`/dashboard/ai-descriptions`)

- **Property Descriptions**: Generate listing descriptions
- **Multiple Styles**: Professional, casual, luxury tones
- **SEO Optimization**: Search-optimized content
- **Multi-Language**: Translation support

### 14. Voiceover (`/dashboard/voiceover`)

- **Text-to-Speech**: Generate voiceovers for videos
- **Multiple Voices**: Choose voice style and accent
- **Export Audio**: Download audio files
- **Video Integration**: Combine with video content

### 15. Team Management (`/dashboard/team`)

- **Team Creation**: Create and manage teams
- **Member Invitations**: Invite team members
- **Role Management**: Assign roles and permissions
- **Shared Projects**: Collaborate on listings
- **Usage Analytics**: Track team credit usage

### 16. Brand Kit (`/dashboard/brand`)

- **Logo Upload**: Upload company logo
- **Color Palette**: Define brand colors
- **Font Selection**: Choose brand fonts
- **Template Customization**: Apply brand to templates
- **Watermark Settings**: Custom watermark configuration

### 17. Analytics & Reporting

#### Dashboard Analytics (`/dashboard`)
- **Credit Usage**: Track credit consumption
- **Enhancement Stats**: Most used tools
- **Listing Performance**: Photo counts per listing
- **Time-Based Reports**: Usage over time

#### Content Analytics (`/dashboard/content-studio/analytics`)
- **Post Performance**: Engagement metrics
- **Platform Breakdown**: Performance by platform
- **Best Performing Content**: Top posts analysis
- **Scheduling Insights**: Optimal posting times

### 18. Billing & Credits (`/dashboard/billing`)

#### Subscription Plans
- **Free**: 10 credits, 7-day trial, watermarked exports
- **Starter**: $29/mo, 50 credits, instant delivery
- **Pro**: $79/mo, 200 credits, priority support, team sharing
- **Enterprise**: $199/mo, 500 credits, dedicated support, API access

#### Credit Management
- **Pay-as-You-Go**: $1.50 per image (no subscription)
- **Credit Purchase**: Buy additional credits
- **Usage Tracking**: Real-time credit balance
- **Auto-Renewal**: Monthly subscription management
- **Stripe Integration**: Secure payment processing

### 19. Settings & Preferences (`/dashboard/settings`)

- **Profile Management**: Update name, email, avatar
- **Password Change**: Secure password updates
- **Social Connections**: Link social media accounts
- **Notification Preferences**: Email and in-app notifications
- **Data Export**: Download user data (GDPR compliance)
- **Account Deletion**: Permanent account removal

### 20. Academy & Learning (`/academy`)

#### Getting Started
- **First Listing Guide**: Step-by-step tutorial
- **First Enhancement**: How to enhance photos
- **Studio Guide**: Studio interface walkthrough

#### Enhancing Photos
- **Tool-Specific Guides**: Detailed guides for each AI tool
- **Best Practices**: Professional tips
- **Before/After Examples**: Visual learning

#### Photography Tips
- **Composition Rules**: Professional composition
- **Lighting Basics**: Lighting techniques
- **Equipment Guide**: Camera and gear recommendations
- **Shooting Exteriors**: Exterior photography tips
- **Shooting Interiors**: Interior photography tips

#### Delivering to Clients
- **Sharing Galleries**: Client sharing workflow
- **Client Approvals**: Approval process guide

#### Plans & Credits
- **Understanding Credits**: Credit system explanation
- **Choosing Plan**: Plan selection guide
- **Billing FAQ**: Common billing questions

#### Troubleshooting
- **Upload Issues**: Fix upload problems
- **Processing Errors**: Handle enhancement failures
- **Quality Issues**: Improve enhancement quality
- **Account Issues**: Account-related help

### 21. Admin Panel (`/admin`)

#### Admin Features
- **User Management**: View and manage all users
- **Analytics Dashboard**: Platform-wide metrics
- **Revenue Tracking**: Payment and subscription analytics
- **Human Edit Requests**: Manage manual edit requests
- **Error Logs**: System error monitoring
- **Contact Submissions**: View contact form submissions
- **System Status**: Platform health monitoring

---

## User Journeys & Flows

### Journey 1: New Photographer - First Enhancement

1. **Landing Page** (`/`)
   - View features and pricing
   - Sign up for free account

2. **Onboarding** (`/onboarding`)
   - Step 1: Role selection (Photographer/Agent/Broker)
   - Step 2: Region selection (US/IN/UAE)
   - Step 3: Profile completion

3. **Dashboard** (`/dashboard`)
   - View empty state
   - Create first project/listing

4. **Create Listing** (`/listings/new`)
   - Enter property details
   - Upload photos

5. **Studio** (`/dashboard/studio?id=[listingId]`)
   - Select photo
   - Choose AI tool (e.g., Sky Replacement)
   - Select preset (e.g., Clear Blue)
   - Click "Enhance Now"
   - View before/after slider
   - Accept or adjust enhancement
   - Download enhanced photo

### Journey 2: Real Estate Agent - Complete Workflow

1. **Sign Up** → Select "Real Estate Agent" role
2. **Create Listing** → Add property with photos
3. **Studio Enhancement**:
   - Declutter interior photos
   - Virtual staging for empty rooms
   - Sky replacement for exteriors
   - HDR enhancement for all photos
4. **MLS Export**:
   - Generate MLS pack
   - Download ZIP with all resolutions
   - Upload to MLS system
5. **Content Creation**:
   - Create Instagram post
   - Generate caption with hashtags
   - Schedule post
6. **Client Sharing**:
   - Generate share link
   - Send to client
   - Receive approval
   - Download approved photos

### Journey 3: Broker - Team Workflow

1. **Team Setup**:
   - Create team
   - Invite agents
   - Set up brand kit
2. **Campaign Creation**:
   - Create status-based campaign
   - Set trigger (e.g., "When listing goes live")
   - Configure multi-platform posts
3. **Automation**:
   - Listing goes live → Auto-publish posts
   - Client approval → Auto-send to MLS
   - Status change → Auto-email campaign

### Journey 4: Content Creator - Social Media Workflow

1. **Content Studio** (`/dashboard/content-studio`)
2. **Select Listing** → Choose property
3. **Create Post**:
   - Choose platform (Instagram)
   - Select template
   - Add photos
   - Generate AI caption
   - Customize design
4. **Schedule** → Set publish date/time
5. **Campaign Management**:
   - View scheduled posts
   - Approve/reject
   - Monitor performance

---

## User Experience & Interface

### Design System
- **Color Palette**:
  - Primary: Gold (#D4A017, #B8860B)
  - Background: Dark (#0F0F0F, #1A1A1A)
  - Text: White with opacity variations
- **Typography**: Outfit font family
- **Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Key UI Patterns
- **Dark Theme**: Consistent dark interface
- **Gold Accents**: Premium feel with gold highlights
- **Card-Based Layout**: Modular content cards
- **Sidebar Navigation**: Persistent navigation
- **Modal Overlays**: Contextual actions
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: Toast notifications
- **Responsive Design**: Mobile-first approach

### User Experience Highlights
- **Intuitive Workflow**: Clear step-by-step processes
- **Real-time Feedback**: Live status updates
- **Before/After Comparison**: Visual enhancement proof
- **Keyboard Shortcuts**: Power user efficiency
- **Help System**: Contextual help and academy
- **Mobile Support**: Full mobile functionality

---

## Technical Stack & Infrastructure

### Frontend
- **Next.js 14.2**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library
- **React Hooks**: State management

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Supabase**: 
  - PostgreSQL database
  - Authentication
  - Storage (R2-compatible)
  - Real-time subscriptions
- **Cloudflare**:
  - Workers for async processing
  - Queues for job management
  - R2 for file storage (alternative path)

### AI & Processing
- **Replicate**: Primary AI provider (Flux Kontext)
- **OpenAI**: Vision API for quality scoring
- **Sharp**: Image processing (resize, watermark)
- **Archiver**: ZIP file creation

### Third-Party Services
- **Stripe**: Payment processing
- **Resend**: Email delivery
- **Crisp**: Live chat support

### Deployment
- **Vercel**: Primary hosting (Next.js optimized)
- **Cloudflare Pages**: Alternative deployment
- **Environment Variables**: Secure configuration

---

## Database Schema

### Core Tables

#### `users` / `profiles`
- User authentication and profile data
- Credits balance
- Role (photographer/agent/broker)
- Onboarding status

#### `listings`
- Property information
- Address, city, state, postal code
- Description
- User association

#### `photos`
- Raw and processed image URLs
- Status (pending/completed/failed)
- Variant (tool used)
- Quality score
- Room type
- Listing association

#### `jobs`
- Background processing jobs
- Status tracking
- Error logging
- Metadata storage

#### `projects`
- Project organization
- User association
- Listing grouping

#### `campaigns`
- Marketing campaigns
- Trigger conditions
- Status tracking
- Template associations

#### `content_queue`
- Scheduled posts
- Platform assignments
- Approval status
- Publish dates

#### `social_connections`
- OAuth connections
- Platform tokens
- User associations

#### `payments`
- Stripe transactions
- Credit purchases
- Subscription records

#### `floorplans`
- Floor plan images
- Listing associations
- Processed versions

---

## API Endpoints

### Authentication
- `POST /api/auth/callback` - OAuth callback
- `POST /api/auth/signout` - Sign out

### Listings
- `GET /api/listings` - List user listings
- `POST /api/listings` - Create listing
- `PUT /api/listings/status` - Update listing status

### Enhancement
- `POST /api/enhance` - Enhance single photo
- `POST /api/batch-enhance` - Batch enhancement
- `GET /api/jobs/[id]` - Job status

### Upload
- `POST /api/upload` - Upload photos (async queue)

### Sharing
- `POST /api/share` - Create share link
- `GET /api/approve-photo` - Approve/reject photo
- `GET /api/approval-summary` - Get approval stats

### Content Studio
- `POST /api/content-library` - Save content
- `GET /api/copy/caption` - Generate caption
- `GET /api/copy/hashtags` - Generate hashtags
- `POST /api/schedule` - Schedule post
- `GET /api/drafts` - Get drafts

### Social Media
- `POST /api/social/connect/[platform]` - Connect account
- `POST /api/social/disconnect/[platform]` - Disconnect
- `POST /api/social/publish` - Publish post
- `GET /api/social/connections` - List connections
- `GET /api/social/scheduled` - Get scheduled posts

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create/update campaign
- `GET /api/auto-post` - Auto-post trigger

### Compliance
- `POST /api/compliance/export` - Generate MLS pack
- `POST /api/compliance/apply` - Apply compliance settings

### Listing Intelligence
- `POST /api/listing-intelligence/analyze` - Analyze listing
- `GET /api/listing-intelligence/[id]` - Get analysis

### Other Features
- `POST /api/floor-plans` - Process floor plan
- `POST /api/virtual-tours` - Create tour
- `POST /api/voiceover` - Generate voiceover
- `POST /api/renovation` - Renovation visualization
- `POST /api/ai/generate-description` - Property description
- `POST /api/ai/photo-cull` - AI photo culling

### Admin
- `GET /api/admin/*` - Admin endpoints
- `POST /api/admin/complete-human-edit` - Complete manual edit

### Stripe
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle webhooks
- `GET /api/stripe/portal` - Customer portal

---

## Integrations & Third-Party Services

### Social Media Platforms
- **Instagram**: OAuth, post publishing, Stories, Reels
- **Facebook**: OAuth, post publishing, Stories
- **LinkedIn**: OAuth, post publishing
- **TikTok**: OAuth, video publishing

### Payment & Billing
- **Stripe**: 
  - Subscription management
  - One-time payments
  - Customer portal
  - Webhook handling

### Email
- **Resend**: 
  - Transactional emails
  - Processing notifications
  - Share link emails

### Storage
- **Supabase Storage**: Primary image storage
- **Cloudflare R2**: Alternative storage path
- **Cloudinary**: Legacy upload path

### AI Services
- **Replicate**: Image enhancement (Flux Kontext)
- **OpenAI**: Vision API for quality scoring
- **AutoEnhance.ai**: Alternative enhancement provider

### Support
- **Crisp**: Live chat widget

---

## Pricing & Monetization

### Subscription Tiers

#### Free Plan
- **Price**: $0
- **Credits**: 10 (one-time)
- **Features**:
  - All AI tools
  - 7-day trial
  - Watermarked exports
  - Basic support

#### Starter Plan
- **Price**: $29/month
- **Credits**: 50/month
- **Features**:
  - All AI tools
  - Instant delivery
  - Email support
  - No watermarks

#### Pro Plan (Most Popular)
- **Price**: $79/month
- **Credits**: 200/month
- **Features**:
  - All AI tools
  - Instant delivery
  - Priority support
  - Team sharing
  - Advanced analytics

#### Enterprise Plan
- **Price**: $199/month
- **Credits**: 500/month
- **Features**:
  - All AI tools
  - Instant delivery
  - Dedicated support
  - API access
  - Custom integrations

### Pay-as-You-Go
- **Price**: $1.50 per image
- **No subscription required**
- **Same quality as subscriptions**

### Credit Costs by Tool
- **1 Credit**: Sky Replacement, Lawn Repair, Pool Enhance, Fire Fireplace, TV Screen, Lights On, HDR, Auto Enhance, Perspective Correction, Lens Correction, Color Balance
- **2 Credits**: Virtual Twilight, Declutter, Window Masking
- **3 Credits**: Virtual Staging

---

## Content & Marketing Features

### Social Media Management
- **Multi-Platform Publishing**: Instagram, Facebook, LinkedIn, TikTok
- **Content Templates**: 150+ pre-designed templates
- **AI Caption Generation**: Context-aware captions
- **Hashtag Optimization**: Platform-specific hashtags
- **Scheduling**: Schedule posts in advance
- **Analytics**: Track post performance
- **Bulk Creation**: Generate content for multiple listings

### Email Marketing
- **Campaign Templates**: Pre-designed email templates
- **Listing Showcases**: Feature properties in emails
- **Scheduling**: Schedule email sends
- **Analytics**: Open rates and engagement

### Property Websites
- **Auto-Generation**: One-click property sites
- **Custom Branding**: Logo and color customization
- **QR Codes**: Print-ready QR codes
- **Mobile Responsive**: Optimized for all devices

### Video Content
- **Slideshow Videos**: Create Reels/TikTok from photos
- **Music Integration**: Background music
- **Transitions**: Smooth photo transitions
- **Text Animations**: Animated captions

---

## Compliance & MLS Features

### MLS Export Package
- **Multiple Resolutions**: MLS, Email, FullRes
- **Manifest File**: JSON metadata
- **Disclosure Documents**: Automatic generation
- **Watermarking**: "Virtually Staged" for staging images
- **Metadata Embedding**: RESO-compliant metadata

### US Market Mode
- **Region Detection**: Automatic US region detection
- **Role-Based Policies**: Different rules for photographers vs agents
- **Tone Adjustments**: MLS-safe color corrections
  - Saturation: -0.08
  - Contrast: +0.05
  - Shadow Lift: +0.04
  - White Balance: Cool-neutral
- **Watermark Enforcement**: Automatic for agents/brokers on virtual staging

### MLS Specifications
- **Multiple MLS Support**: Configurable for different MLS organizations
- **Validation**: Pre-export validation
- **Compliance Settings**: Per-user compliance preferences

---

## Admin & Management

### Admin Dashboard (`/admin`)
- **User Management**: View and manage all users
- **Analytics**: Platform-wide metrics
- **Revenue Tracking**: Payment analytics
- **Human Edit Requests**: Manage manual edits
- **Error Logs**: System monitoring
- **Contact Submissions**: View contact forms
- **System Status**: Health monitoring

### Monitoring & Logging
- **Error Logging**: Centralized error tracking
- **API Cost Logging**: Track AI provider costs
- **Performance Monitoring**: Response time tracking
- **Usage Analytics**: Feature usage statistics

---

## Additional Features & Utilities

### Photo Management
- **Drag & Drop Reordering**: Reorder photos in listings
- **Batch Operations**: Select multiple photos
- **Delete Protection**: Confirmation dialogs
- **Storage Optimization**: Automatic cleanup

### Client Features
- **Share Links**: Secure token-based sharing
- **Approval Workflow**: Approve/reject system
- **Download Control**: Permission-based downloads
- **Mobile View**: Optimized mobile experience

### Developer Features
- **API Access**: Enterprise API (planned)
- **Webhooks**: Event notifications (planned)
- **SDK**: JavaScript SDK (planned)

---

## Security & Privacy

### Authentication
- **Supabase Auth**: Secure authentication
- **OAuth Providers**: Google, Apple (configurable)
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt hashing

### Data Protection
- **GDPR Compliance**: Data export and deletion
- **Secure Storage**: Encrypted file storage
- **Token-Based Sharing**: Secure share links
- **Role-Based Access**: Permission system

### Payment Security
- **Stripe PCI Compliance**: Secure payment processing
- **Webhook Verification**: Secure webhook handling
- **Subscription Management**: Secure billing

---

## Performance & Scalability

### Optimization
- **Image Compression**: Automatic optimization
- **Lazy Loading**: On-demand image loading
- **Caching**: Strategic caching strategies
- **CDN**: Global content delivery

### Scalability
- **Serverless Architecture**: Auto-scaling
- **Queue System**: Async processing
- **Database Indexing**: Optimized queries
- **Storage Distribution**: Multi-region support

---

## Future Roadmap (Inferred from Codebase)

### Planned Features
- **API Access**: Public API for integrations
- **Mobile Apps**: Native iOS/Android apps
- **Advanced Analytics**: Deeper insights
- **More AI Tools**: Additional enhancement options
- **Collaboration Tools**: Enhanced team features
- **Marketplace**: Template marketplace

---

## Conclusion

SnapR is a comprehensive, feature-rich platform that combines AI-powered photo enhancement with complete marketing and collaboration tools. The platform serves photographers, agents, brokers, and property owners with a unified workflow from photo enhancement to client delivery and social media marketing.

The architecture is modern, scalable, and built on industry-standard technologies. The user experience is intuitive with powerful features accessible to both beginners and professionals.

**Key Strengths**:
- Comprehensive feature set
- Modern tech stack
- Intuitive user interface
- Strong AI integration
- Complete marketing tools
- MLS compliance built-in

**Areas for Enhancement**:
- API documentation
- Mobile app development
- Advanced analytics
- More AI tool options
- Template marketplace

---

**Document Version**: 1.0  
**Last Updated**: December 14, 2025  
**Maintained By**: SnapR Development Team

