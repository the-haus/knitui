export interface ImageSourceWithSdf {
  source: string | number;
  sdf?: boolean;
}

export type ImageEntry = string | number | ImageSourceWithSdf;

export interface ImagesProps {
  images: Record<string, ImageEntry>;
  onImageMissing?: (event: { image: string }) => void;
  testID?: string;
}
