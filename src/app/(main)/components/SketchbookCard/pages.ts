export const sketchPages = Array.from({ length: 24 }, (_, i) => i + 1);

// two covers and an endpaper inside each
export const pageCount = sketchPages.length + 4;

export const defaultBookmark = 12;

export const isPage = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= pageCount;
