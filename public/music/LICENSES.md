# Music Track Licenses

All music tracks in this directory are synthesized background audio generated using ffmpeg audio synthesis (sine wave harmonics with tremolo, echo, and filtering).

## Tracks

| File | Mood | Duration | Format |
|------|------|----------|--------|
| upbeat.mp3 | Energetic, modern, positive | 45s | MP3 128kbps 44.1kHz Stereo |
| elegant.mp3 | Sophisticated, refined | 45s | MP3 128kbps 44.1kHz Stereo |
| cinematic.mp3 | Epic, inspiring, dramatic | 45s | MP3 128kbps 44.1kHz Stereo |
| ambient.mp3 | Calm, atmospheric, peaceful | 45s | MP3 128kbps 44.1kHz Stereo |
| corporate.mp3 | Professional, confident | 45s | MP3 128kbps 44.1kHz Stereo |
| silent.mp3 | Silent fallback | ~1s | MP3 64kbps 44.1kHz Stereo |

## License

These tracks are original synthesized audio created for the SnapR platform. No third-party licenses or attributions required.

## Technical Notes

- All tracks loop seamlessly via Remotion AudioLayer (fade-in/fade-out applied at composition level)
- Tracks are referenced by AudioLayer.tsx via `staticFile('music/{trackName}.mp3')`
- The `silent.mp3` file is a platform compatibility fallback and must not be removed
