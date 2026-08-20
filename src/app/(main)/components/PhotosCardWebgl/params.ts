type Slider = [number, number, number, number];

export type PhotoDistortParams = {
  maxSquash: number;
  squashThreshold: number;
  envelope: number;
  maxBlur: number;
  blurThreshold: number;
  speedRef: number;
  attack: number;
  release: number;
};

export const photoDistortDialConfig: Record<keyof PhotoDistortParams, Slider> = {
  maxSquash: [0.14, 0, 0.6, 0.005],
  squashThreshold: [0.42, 0, 0.95, 0.01],
  envelope: [0.25, 0, 1, 0.01],
  maxBlur: [0.08, 0, 0.35, 0.005],
  blurThreshold: [0.55, 0, 0.95, 0.01],
  speedRef: [3200, 200, 10000, 50],
  attack: [14, 1, 40, 0.5],
  release: [6, 1, 20, 0.5],
};

export const defaultPhotoDistortParams: PhotoDistortParams = {
  maxSquash: photoDistortDialConfig.maxSquash[0],
  squashThreshold: photoDistortDialConfig.squashThreshold[0],
  envelope: photoDistortDialConfig.envelope[0],
  maxBlur: photoDistortDialConfig.maxBlur[0],
  blurThreshold: photoDistortDialConfig.blurThreshold[0],
  speedRef: photoDistortDialConfig.speedRef[0],
  attack: photoDistortDialConfig.attack[0],
  release: photoDistortDialConfig.release[0],
};