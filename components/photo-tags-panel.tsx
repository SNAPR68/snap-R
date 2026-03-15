'use client';

import { useState } from 'react';

interface PhotoTag {
  id: string;
  photo_id: string;
  room_type: string;
  features: string[];
  condition: string;
  style: string;
  atmosphere: string;
  confidence: number;
  is_user_edited?: boolean;
}

interface PhotoTagsPanelProps {
  listingId: string;
  tags: PhotoTag[];
  onRefresh: () => void;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  living_room: 'Living Room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  dining_room: 'Dining Room',
  home_office: 'Home Office',
  basement: 'Basement',
  garage: 'Garage',
  front_exterior: 'Front Exterior',
  rear_exterior: 'Rear Exterior',
  pool: 'Pool',
  patio: 'Patio',
  deck: 'Deck',
  garden: 'Garden',
  laundry_room: 'Laundry Room',
  entryway: 'Entryway',
  aerial: 'Aerial',
  drone: 'Drone',
  theater: 'Theater',
  game_room: 'Game Room',
  other: 'Other',
};

const DRONE_ROOM_TYPES = new Set(['aerial', 'drone']);

/** Enhancement suggestions based on room type */
const ENHANCEMENT_SUGGESTIONS: Record<string, string[]> = {
  aerial: ['sky-replacement', 'perspective-correction', 'hdr'],
  drone: ['sky-replacement', 'perspective-correction', 'hdr'],
  front_exterior: ['sky-replacement', 'virtual-twilight', 'lawn-repair'],
  rear_exterior: ['sky-replacement', 'lawn-repair', 'pool-enhance'],
  pool: ['pool-enhance', 'sky-replacement'],
  kitchen: ['hdr', 'declutter', 'lights-on'],
  living_room: ['hdr', 'virtual-staging', 'lights-on'],
  bedroom: ['virtual-staging', 'declutter', 'lights-on'],
  bathroom: ['hdr', 'declutter'],
};

const TOOL_LABELS: Record<string, string> = {
  'sky-replacement': 'Sky Replace',
  'perspective-correction': 'Perspective',
  'hdr': 'HDR',
  'virtual-twilight': 'Twilight',
  'lawn-repair': 'Lawn Repair',
  'pool-enhance': 'Pool Enhance',
  'declutter': 'Declutter',
  'lights-on': 'Lights On',
  'virtual-staging': 'V. Staging',
};

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor'] as const;

export function PhotoTagsPanel({ listingId, tags, onRefresh }: PhotoTagsPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const droneCount = tags.filter((t) => DRONE_ROOM_TYPES.has(t.room_type)).length;

  const analyzePhotos = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/photos/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Analysis failed');
      }

      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateTag = async (photoId: string, field: string, value: unknown) => {
    try {
      const res = await fetch('/api/photos/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, [field]: value }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Update failed');
        return;
      }
      onRefresh();
    } catch {
      setError('Failed to update tag');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">AI Photo Tags</h3>
        <button
          onClick={analyzePhotos}
          disabled={analyzing}
          className="px-3 py-1.5 bg-[#D4A017]/20 border border-[#D4A017]/30 rounded-lg text-[#D4A017] text-xs font-medium hover:bg-[#D4A017]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? 'Analyzing...' : tags.length > 0 ? 'Re-analyze' : 'Analyze Photos with AI'}
        </button>
      </div>

      {/* Drone photo summary */}
      {droneCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <span className="text-blue-400 text-xs font-bold">AERIAL</span>
          <span className="text-xs text-white/60">
            {droneCount} drone {droneCount === 1 ? 'photo' : 'photos'} detected — video will use cinematic zoom-out effect
          </span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
          {error}
        </div>
      )}

      {tags.length === 0 && !analyzing && (
        <p className="text-xs text-white/40">
          Click &quot;Analyze Photos with AI&quot; to detect room types, features, and property condition.
        </p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tags.map((tag) => {
          const isDrone = DRONE_ROOM_TYPES.has(tag.room_type);
          const suggestions = ENHANCEMENT_SUGGESTIONS[tag.room_type];

          return (
            <div
              key={tag.id}
              className={`p-3 border rounded-lg space-y-2 ${
                isDrone
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Room type + drone badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={tag.room_type}
                    onChange={(e) => updateTag(tag.photo_id, 'roomType', e.target.value)}
                    aria-label="Room type"
                    className="bg-transparent text-white text-sm font-medium border-none focus:outline-none cursor-pointer"
                  >
                    {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-[#111]">
                        {label}
                      </option>
                    ))}
                  </select>
                  {isDrone && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Drone
                    </span>
                  )}
                </div>
                {/* Confidence */}
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4A017] rounded-full"
                      style={{ width: `${tag.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40">{Math.round(tag.confidence * 100)}%</span>
                </div>
              </div>

              {/* Features as chips */}
              <div className="flex flex-wrap gap-1">
                {tag.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-2 py-0.5 bg-[#D4A017]/10 border border-[#D4A017]/20 rounded text-xs text-[#D4A017]"
                  >
                    {feature.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              {/* Enhancement suggestions */}
              {suggestions && suggestions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30 uppercase tracking-wide">Suggested:</span>
                  {suggestions.map((tool) => (
                    <span
                      key={tool}
                      className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/50"
                    >
                      {TOOL_LABELS[tool] ?? tool}
                    </span>
                  ))}
                </div>
              )}

              {/* Condition */}
              <div className="flex gap-1">
                {CONDITION_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateTag(tag.photo_id, 'condition', c)}
                    className={`px-2 py-0.5 rounded text-xs capitalize transition ${
                      tag.condition === c
                        ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Style + Atmosphere */}
              <div className="flex gap-2 text-xs text-white/40">
                <span>Style: {tag.style}</span>
                <span>|</span>
                <span>Mood: {tag.atmosphere}</span>
                {tag.is_user_edited && (
                  <>
                    <span>|</span>
                    <span className="text-[#D4A017]">Edited</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
