import { Config } from '@remotion/cli/config';

// Set video rendering configuration
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p'); // CRITICAL: Required for Safari/QuickTime compatibility
Config.setConcurrency(4);
