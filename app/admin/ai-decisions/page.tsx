import { adminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type SearchParams = {
  listingId?: string;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default async function AdminAiDecisions({ searchParams }: { searchParams?: SearchParams }) {
  const listingId = searchParams?.listingId?.trim() || '';
  const supabase = adminSupabase();

  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, title, address, preparation_status, prepared_at, created_at, preparation_metadata')
    .order('prepared_at', { ascending: false })
    .limit(50);

  const selectedListing =
    listingId && recentListings?.find((listing) => listing.id === listingId)
      ? recentListings?.find((listing) => listing.id === listingId)
      : listingId
        ? (await supabase
            .from('listings')
            .select('id, title, address, preparation_status, prepared_at, created_at, preparation_metadata')
            .eq('id', listingId)
            .single()).data
        : null;

  const decisionAudit = (selectedListing?.preparation_metadata as any)?.decisionAudit as
    | Record<string, any>
    | undefined;

  const decisionEntries = decisionAudit ? Object.entries(decisionAudit) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Decision Audit</h1>
        <p className="text-white/50">
          Internal per-photo decisions and reasons. Not visible to end users.
        </p>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-8">
        <form className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-white/70 mb-2">Listing ID</label>
            <input
              name="listingId"
              defaultValue={listingId}
              placeholder="Paste listing UUID"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#D4A017] text-black font-semibold rounded-lg hover:bg-[#E0B52C]"
          >
            View Decisions
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Recent Listings</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentListings?.length ? (
              recentListings.map((listing) => (
                <a
                  key={listing.id}
                  href={`/admin/ai-decisions?listingId=${listing.id}`}
                  className={`block px-5 py-4 hover:bg-white/5 transition ${
                    listing.id === listingId ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{listing.title || listing.address || 'Untitled listing'}</p>
                      <p className="text-xs text-white/40">{listing.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">{listing.preparation_status}</p>
                      <p className="text-xs text-white/30">{formatDate(listing.prepared_at || listing.created_at)}</p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="px-5 py-6 text-white/50">No listings found.</div>
            )}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Decision Details</h2>
          {selectedListing ? (
            <>
              <div className="mb-4 text-sm text-white/60">
                <p className="text-white font-medium">
                  {selectedListing.title || selectedListing.address || 'Untitled listing'}
                </p>
                <p>{selectedListing.id}</p>
                <p>Status: {selectedListing.status}</p>
                <p>Prepared: {formatDate(selectedListing.prepared_at)}</p>
              </div>

              {decisionEntries.length ? (
                <div className="space-y-4 max-h-[640px] overflow-auto pr-2">
                  {decisionEntries.map(([photoId, decision]) => (
                    <div key={photoId} className="border border-white/10 rounded-lg p-4 bg-black/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">Photo {photoId}</p>
                        <span className="text-xs text-white/40">{decision.photoType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                        <span>Hero score: {decision.heroScore}</span>
                        <span>Lighting: {decision.lighting}</span>
                        <span>Sky: {decision.skyQuality}</span>
                        <span>Sky needs fix: {String(decision.skyNeedsReplacement)}</span>
                        <span>Lawn: {decision.lawnQuality}</span>
                        <span>Lawn needs fix: {String(decision.lawnNeedsRepair)}</span>
                        <span>Window issue: {String(decision.windowExposureIssue)}</span>
                        <span>HDR: {String(decision.needsHDR)}</span>
                        <span>Verticals: {String(decision.verticalAlignment)}</span>
                        <span>Clutter: {decision.clutterLevel}</span>
                        <span>Room empty: {String(decision.roomEmpty)}</span>
                      </div>
                      <div className="mt-3 text-xs text-white/70">
                        <div className="mb-1 text-white/50">Tools selected</div>
                        <div className="flex flex-wrap gap-2">
                          {(decision.toolsSelected || []).map((tool: string) => (
                            <span key={tool} className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      {decision.toolReasons && Object.keys(decision.toolReasons).length > 0 && (
                        <div className="mt-3 text-xs text-white/60">
                          <div className="mb-1 text-white/50">Tool reasons</div>
                          <pre className="bg-black/60 rounded-lg p-3 whitespace-pre-wrap text-xs text-white/60">
                            {JSON.stringify(decision.toolReasons, null, 2)}
                          </pre>
                        </div>
                      )}
                      {decision.notSuggested && Object.keys(decision.notSuggested).length > 0 && (
                        <div className="mt-3 text-xs text-white/60">
                          <div className="mb-1 text-white/50">Not suggested</div>
                          <pre className="bg-black/60 rounded-lg p-3 whitespace-pre-wrap text-xs text-white/60">
                            {JSON.stringify(decision.notSuggested, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/50 text-sm">
                  No decision audit found for this listing. Prepare the listing to generate it.
                </div>
              )}
            </>
          ) : (
            <div className="text-white/50 text-sm">Select a listing to view decisions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
