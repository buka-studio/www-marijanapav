export const sketchPages = Array.from({ length: 24 }, (_, i) => i + 1);

const covers = 2;
const endpapers = 2;

export const pageCount = sketchPages.length + covers + endpapers;

export const defaultBookmark = 12;

export const isPage = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= pageCount;
