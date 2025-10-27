export type Stamp = {
  id: string;
  title?: string;
  year: string;
  category: string;
  country: string;
  src: string;
  srcLg: string;
  srcOriginal?: string;
  catalogCodes: string[];
  meta: Record<string, string>;
  designer: string;
  faceValue?: string;
};
