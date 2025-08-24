export type Stamp = {
  id: number;
  title: string;
  year: string;
  category: string;
  country: string;
  src: string;
  srcLg: string;
  catalogCodes: string[];
  meta: Record<string, string>;
  designer: string;
};
