export interface ImageSourceWithSdf {
  source: string | number;
  sdf?: boolean;
  /**
   * Pixel density of the bitmap in `source` — e.g. `2` for a bitmap rasterized
   * at 2×. Registered with the image so a `SymbolLayer` draws it at logical
   * (`source ÷ scale`) size instead of raw bitmap-pixel size. Default `1`.
   */
  scale?: number;
}

export type ImageEntry = string | number | ImageSourceWithSdf;

export interface ImagesProps {
  images: Record<string, ImageEntry>;
  onImageMissing?: (event: { image: string }) => void;
  testID?: string;
}
