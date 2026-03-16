'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home, Sparkles, Calendar, BarChart3, Clock, Loader2
} from 'lucide-react'
import { ExpandableCard } from './expandable-card'
import { GettingStartedChecklist } from '../getting-started-checklist'
import { UsageWidget } from '../usage-widget'
import { ListingsCollapsed, ListingsExpanded, type ListingItem } from './containers/listings-container'
import { ContentCollapsed, ContentExpanded, type MarketingStatus } from './containers/content-container'
import { CalendarCollapsed, CalendarExpanded, type ScheduledPostItem } from './containers/calendar-container'
import { AnalyticsCollapsed, AnalyticsExpanded, type AnalyticsTotals, type AnalyticsPost } from './containers/analytics-container'
import { ActivityCollapsed, ActivityExpanded, type ActivityItem } from './containers/activity-container'
import { ProcessingCollapsed, ProcessingExpanded, type ProcessingItem } from './containers/processing-container'
import { SampleListingCTA } from './sample-listing-cta'

interface SetupStatus {
  hasListings: boolean
  hasBrand: boolean
  hasSocials: boolean
  hasPrepared: boolean
  hasMarketing: boolean
  tier: string
}

interface UsageData {
  listingsUsed: number
  listingsLimit: number
  tier: string
}

interface CommandCenterProps {
  listings: ListingItem[]
  scheduledPosts: ScheduledPostItem[]
  analytics: {
    totals: AnalyticsTotals
    posts: AnalyticsPost[]
  }
  recentActivity: ActivityItem[]
  processingItems: ProcessingItem[]
  setupStatus: SetupStatus
  marketingStatuses: Record<string, MarketingStatus>
  usage?: UsageData
}

export default function CommandCenter({
  listings,
  scheduledPosts,
  analytics,
  recentActivity,
  processingItems,
  setupStatus,
  marketingStatuses,
  usage,
}: CommandCenterProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const handleExpand = (id: string) => setExpandedCard(id)
  const handleCollapse = () => setExpandedCard(null)

  const contentListings = listings.map(l => ({
    id: l.id,
    title: l.title,
    thumbnail: l.thumbnail,
  }))

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        {!expandedCard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold">Command Center</h1>
            <p className="text-white/40 text-sm mt-1">Your property marketing at a glance</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {expandedCard ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {expandedCard === 'listings' && (
                <ExpandableCard
                  id="listings"
                  title="My Listings"
                  icon={Home}
                  color="bg-[#D4A017]"
                  badge={listings.length}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  fullPageHref="/dashboard/listings"
                  collapsedContent={null}
                  expandedContent={<ListingsExpanded listings={listings} />}
                />
              )}
              {expandedCard === 'content' && (
                <ExpandableCard
                  id="content"
                  title="Content Studio"
                  icon={Sparkles}
                  color="bg-pink-500"
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  fullPageHref="/dashboard/content-studio"
                  collapsedContent={null}
                  expandedContent={<ContentExpanded listings={contentListings} marketingStatuses={marketingStatuses} />}
                />
              )}
              {expandedCard === 'calendar' && (
                <ExpandableCard
                  id="calendar"
                  title="Calendar"
                  icon={Calendar}
                  color="bg-blue-500"
                  badge={scheduledPosts.filter(p => p.status === 'pending').length}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  fullPageHref="/dashboard/calendar"
                  collapsedContent={null}
                  expandedContent={<CalendarExpanded scheduledPosts={scheduledPosts} />}
                />
              )}
              {expandedCard === 'analytics' && (
                <ExpandableCard
                  id="analytics"
                  title="Analytics"
                  icon={BarChart3}
                  color="bg-emerald-500"
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  fullPageHref="/dashboard/content-studio/analytics"
                  collapsedContent={null}
                  expandedContent={<AnalyticsExpanded totals={analytics.totals} posts={analytics.posts} />}
                />
              )}
              {expandedCard === 'activity' && (
                <ExpandableCard
                  id="activity"
                  title="Activity"
                  icon={Clock}
                  color="bg-amber-500"
                  badge={recentActivity.length}
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  collapsedContent={null}
                  expandedContent={<ActivityExpanded activities={recentActivity} />}
                />
              )}
              {expandedCard === 'processing' && (
                <ExpandableCard
                  id="processing"
                  title="Processing"
                  icon={Loader2}
                  color="bg-amber-500"
                  isExpanded
                  onExpand={() => {}}
                  onCollapse={handleCollapse}
                  collapsedContent={null}
                  expandedContent={<ProcessingExpanded initialItems={processingItems} />}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Processing banner — full width, auto-hides when empty */}
              {processingItems.length > 0 && (
                <div className="mb-4">
                  <ExpandableCard
                    id="processing"
                    title="Processing"
                    icon={Loader2}
                    color="bg-amber-500"
                    badge={`${processingItems.length} active`}
                    isExpanded={false}
                    onExpand={() => handleExpand('processing')}
                    onCollapse={handleCollapse}
                    collapsedContent={<ProcessingCollapsed initialItems={processingItems} />}
                    expandedContent={null}
                    className="border-amber-500/20 bg-amber-500/[0.03]"
                  />
                </div>
              )}

              {/* Sample listing CTA — only when user has zero listings */}
              {!setupStatus.hasListings && <SampleListingCTA />}

              {/* Getting Started Checklist */}
              <GettingStartedChecklist
                hasListings={setupStatus.hasListings}
                hasBrand={setupStatus.hasBrand}
                hasSocials={setupStatus.hasSocials}
                hasPrepared={setupStatus.hasPrepared}
                hasMarketing={setupStatus.hasMarketing}
                tier={setupStatus.tier}
              />

              {/* Usage widget — shows plan usage + upgrade nudge */}
              {usage && (
                <div className="mb-5">
                  <UsageWidget
                    listingsUsed={usage.listingsUsed}
                    listingsLimit={usage.listingsLimit}
                    tier={usage.tier}
                  />
                </div>
              )}

              {/* Main grid — 2-column magazine layout with hero card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ExpandableCard
                  id="listings"
                  title="My Listings"
                  icon={Home}
                  color="bg-[#D4A017]"
                  badge={listings.length}
                  isExpanded={false}
                  onExpand={() => handleExpand('listings')}
                  onCollapse={handleCollapse}
                  collapsedContent={<ListingsCollapsed listings={listings} />}
                  expandedContent={null}
                  className="md:col-span-2"
                />

                <ExpandableCard
                  id="content"
                  title="Content Studio"
                  icon={Sparkles}
                  color="bg-pink-500"
                  badge={Object.values(marketingStatuses).filter(m => m.status === 'completed').length || undefined}
                  isExpanded={false}
                  onExpand={() => handleExpand('content')}
                  onCollapse={handleCollapse}
                  collapsedContent={<ContentCollapsed listings={contentListings} marketingStatuses={marketingStatuses} />}
                  expandedContent={null}
                />

                <ExpandableCard
                  id="calendar"
                  title="Calendar"
                  icon={Calendar}
                  color="bg-blue-500"
                  badge={scheduledPosts.filter(p => p.status === 'pending').length || undefined}
                  isExpanded={false}
                  onExpand={() => handleExpand('calendar')}
                  onCollapse={handleCollapse}
                  collapsedContent={<CalendarCollapsed scheduledPosts={scheduledPosts} />}
                  expandedContent={null}
                />

                <ExpandableCard
                  id="analytics"
                  title="Analytics"
                  icon={BarChart3}
                  color="bg-emerald-500"
                  badge={analytics.totals.posts || undefined}
                  isExpanded={false}
                  onExpand={() => handleExpand('analytics')}
                  onCollapse={handleCollapse}
                  collapsedContent={<AnalyticsCollapsed totals={analytics.totals} posts={analytics.posts} />}
                  expandedContent={null}
                />

                <ExpandableCard
                  id="activity"
                  title="Activity"
                  icon={Clock}
                  color="bg-amber-500"
                  badge={recentActivity.length || undefined}
                  isExpanded={false}
                  onExpand={() => handleExpand('activity')}
                  onCollapse={handleCollapse}
                  collapsedContent={<ActivityCollapsed activities={recentActivity} />}
                  expandedContent={null}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
