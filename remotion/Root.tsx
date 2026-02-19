import { Composition } from 'remotion';
import { TestVideo, testVideoSchema, type TestVideoProps } from './compositions/TestVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<typeof testVideoSchema, TestVideoProps>
        id="TestVideo"
        component={TestVideo}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920} // 9:16 aspect ratio
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
