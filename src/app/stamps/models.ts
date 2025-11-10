export type Stamp = {
  id: string;
  title?: string;
  year: string;
  country: string;
  src: string;
  srcLg: string;
  srcOriginal?: string;
  catalogCodes: string[];
  meta?: Record<string, string>;
  width?: number;
  height?: number;
};
