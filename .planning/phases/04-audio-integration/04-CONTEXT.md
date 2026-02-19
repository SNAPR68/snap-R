# Phase 4: Audio Integration — Context

## Phase Goal
Add background music library and voiceover integration with proper volume ducking, so videos sound professional.

## What Exists
- **Voiceover service**: `lib/video/voiceover-service.ts` — GPT-4o script generation + ElevenLabs/OpenAI TTS, returns base64 MP3 data URLs
- **Voiceover API**: `app/api/video/voiceover/route.ts` — POST with `generate-script` and `generate-audio` actions, returns base64 audio
- **VideoCreator audio UI**: Full audio tab with voiceover toggle, voice selection (6 voices), script style (4 styles), script editor, generate buttons, music toggle, track selection (5 placeholder tracks), volume sliders for both
- **`@remotion/media@4.0.424`**: Installed — provides `<Audio>` component with volume callbacks, loop, trim
- **"Coming soon" banner**: Line 898-903 in VideoCreator.tsx warns audio features are not yet wired to render
- **MUSIC_TRACKS constant**: 5 tracks defined (upbeat, elegant, cinematic, ambient, corporate) with paths like `/music/upbeat.mp3` but files don't exist

## What's Missing
1. **Music files**: `public/music/` directory doesn't exist — need 5 royalty-free MP3 tracks
2. **Audio props in composition schemas**: Compositions have no `musicUrl`, `voiceoverUrl`, or volume props
3. **`<Audio>` components in compositions**: No audio elements in any composition
4. **Volume ducking logic**: When voiceover plays, music volume should drop (e.g., 30% → 10%)
5. **Audio fade in/out**: Music needs fade-in at start and fade-out at end for smooth transitions
6. **Silent audio track**: Videos without music/voiceover need silent audio for platform compatibility
7. **Generate API audio params**: `POST /api/video/generate` doesn't accept or pass audio URLs/volumes to Lambda
8. **Voiceover upload to S3**: Currently returns base64 data URL in-memory — Lambda can't use data URLs, needs real URL
9. **Wiring UI → API → Lambda**: Audio settings from UI need to flow through generate API to composition inputProps

## Key Decisions
- **Music source**: Use freely-licensed ambient tracks from a royalty-free source, stored in `public/music/` as static files. Lambda accesses via `staticFile()` in Remotion.
- **Voiceover persistence**: Upload generated voiceover MP3 to Supabase Storage, get a signed URL, pass that URL to Lambda. This avoids base64 data URL limitations.
- **Volume ducking approach**: Use Remotion's `volume` callback on the music `<Audio>` component. When voiceover is present, duck music to `musicVolume * 0.3` during the entire video (simple approach — voiceover typically runs the whole duration).
- **Audio fade**: 1-second fade in at start, 1-second fade out before end, implemented via `interpolate()` in the music `<Audio>` volume callback.
- **Silent track**: Add silent audio only when both music and voiceover are disabled — use a tiny 1s silent MP3 looped.

## Dependencies
- Phase 2 (compositions exist) — complete
- `@remotion/media` installed — confirmed
