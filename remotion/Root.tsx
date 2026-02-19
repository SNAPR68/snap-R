import { Composition, type CalculateMetadataFunction } from 'remotion';
import { TestVideo, testVideoSchema, type TestVideoProps } from './compositions/TestVideo';
import {
  PropertyShowcase,
  propertyShowcaseSchema,
  type PropertyShowcaseProps,
  calculateDuration,
} from './compositions/PropertyShowcase';

// Default props shared across all PropertyShowcase compositions
const showcaseDefaultProps: PropertyShowcaseProps = {
  listing: {
    address: '123 Main St, Beverly Hills, CA 90210',
    price: 2500000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&h=1920&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&h=1920&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&h=1920&fit=crop',
    ],
  },
  aspectRatio: '9:16',
};

// Dynamic duration calculation based on photo count
const showcaseMetadata: CalculateMetadataFunction<PropertyShowcaseProps> = ({
  props,
}) => {
  return {
    durationInFrames: calculateDuration(props.listing.photos.length),
  };
};

// Aspect ratio dimension configs
const ASPECT_CONFIGS = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* PropertyShowcase — 3 aspect ratios */}
      <Composition
        id="PropertyShowcase-9x16"
        component={PropertyShowcase}
        durationInFrames={300}
        fps={30}
        width={ASPECT_CONFIGS['9:16'].width}
        height={ASPECT_CONFIGS['9:16'].height}
        schema={propertyShowcaseSchema}
        defaultProps={{ ...showcaseDefaultProps, aspectRatio: '9:16' as const }}
        calculateMetadata={showcaseMetadata}
      />
      <Composition
        id="PropertyShowcase-1x1"
        component={PropertyShowcase}
        durationInFrames={300}
        fps={30}
        width={ASPECT_CONFIGS['1:1'].width}
        height={ASPECT_CONFIGS['1:1'].height}
        schema={propertyShowcaseSchema}
        defaultProps={{ ...showcaseDefaultProps, aspectRatio: '1:1' as const }}
        calculateMetadata={showcaseMetadata}
      />
      <Composition
        id="PropertyShowcase-16x9"
        component={PropertyShowcase}
        durationInFrames={300}
        fps={30}
        width={ASPECT_CONFIGS['16:9'].width}
        height={ASPECT_CONFIGS['16:9'].height}
        schema={propertyShowcaseSchema}
        defaultProps={{ ...showcaseDefaultProps, aspectRatio: '16:9' as const }}
        calculateMetadata={showcaseMetadata}
      />

      {/* Test composition (Phase 1) */}
      <Composition<typeof testVideoSchema, TestVideoProps>
        id="TestVideo"
        component={TestVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        schema={testVideoSchema}
        defaultProps={{
          listing: {
            address: '123 Main St',
            price: 500000,
            beds: 3,
            baths: 2,
            photos: [
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&h=1920&fit=crop',
            ],
          },
          aspectRatio: '9:16' as const,
        }}
      />
    </>
  );
};
