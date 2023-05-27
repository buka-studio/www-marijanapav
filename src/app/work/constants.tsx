import { StaticImageData } from "next/image";
import { ReactNode } from "react";
import Cryptocurrency from "~/public/work/bitcoin/preview.png";
import DigitalStampCollection from "~/public/work/falkland/preview.png";
import InfinumBeerPreview from "~/public/work/infinum-beer/preview.png";
import InfinumPostersPreview from "~/public/work/infinum-posters/preview.png";
import InfinumSwagPreview from "~/public/work/infinum-swag/preview.png";
import KettlePreview from "~/public/work/kettle/preview.png";
// import HavgrimPreview from "~/public/work/havgrim/preview.png";
// import DucksPreview from "~/public/work/ducks/preview.png";
import HighRoadsPreview from "~/public/work/high-roads/preview.png";
import SupabaseIconsPreview from "~/public/work/supabase-icons/preview.png";
import SupabaseCard from "./components/SupabaseCard";
import ElizabethsFlowers from "~/public/work/elizabeths-flowers/preview.png";
import Memobottle from "~/public/work/Memobottle/preview.png";

export const filters = [
  "all",
  "illustration",
  "branding",
  "ux-ui",
  "other",
] as const;

export type Filter = (typeof filters)[number];

export type StaticProject = {
  type?: "project";
  title: string;
  description?: string;
  slug?: string;
  filters: Filter[];
  preview: StaticImageData;
  aspect?: number;
  assets?: StaticImageData[][];
  tags?: string[];
};

export type ComponentProject = {
  type: "component";
  content: ReactNode;
  filters: Filter[];
};

export type Project = StaticProject | ComponentProject;

// aspect - width/height
export const projects: Project[] = [
  {
    type: "project",
    title: "Digital Stamp Collection",
    slug: "stamp-collection",
    preview: DigitalStampCollection,
    filters: ["illustration"],
    description:
      "Cover illustration for software development agency for a blog post about Interledger — an open protocol suite developed with the intention of making payments work as easy as email.",
    assets: [
      [DigitalStampCollection],
      [DigitalStampCollection, DigitalStampCollection, DigitalStampCollection],
    ],
    tags: ["Adobe Illustrator", "Procreate", "© 2022"],
    aspect: 0.67,
  },
  {
    type: "project",
    title: "Cryptocurrency Transactions Made Simple",
    slug: "crypto",
    preview: Cryptocurrency,
    filters: ["illustration"],
    description:       
      "Cover illustration for software development agency for a blog post about Interledger — an open protocol suite developed with the intention of making payments work as easy as email.",
    aspect: 1.75,
  },
  {
    type: "project",
    title: "The High Road Streetwear Brand Logo",
    slug: "high-roads",
    preview: HighRoadsPreview,
    filters: ["illustration", "branding"],
    aspect: 1,
  },
  {
    type: "project",
    title: "Infinum Beer",
    slug: "infinum-beer",
    preview: InfinumBeerPreview,
    filters: ["branding", "ux-ui"],
    aspect: 1.2,
  },
  {
    type: "project",
    title: "Supabase Icons",
    slug: "supabase-icons",
    preview: SupabaseIconsPreview,
    filters: ["branding", "ux-ui"],
    aspect: 1.2,
  },
  {
    type: "component",
    content: <SupabaseCard />,
    filters: ["branding", "ux-ui", "illustration"],
  },

  {
    type: "project",
    title: "Infinum Merch",
    slug: "infinum-swag",
    preview: InfinumSwagPreview,
    filters: ["branding", "ux-ui"],
    description: 
    "With the brand being known for its light, clean, and bold aesthetic, the merchandise was designed to reflect these qualities and use signature red color as an accent.",
    aspect: 0.7,
    assets: [
      [DigitalStampCollection],
      [DigitalStampCollection, DigitalStampCollection, DigitalStampCollection],
    ],
    tags: ["Adobe Illustrator", "Adobe Photoshop", "© 2022"],
  },
  {
    type: "project",
    title: "Infinum Posters",
    slug: "infinum-posters",
    preview: InfinumPostersPreview,
    filters: ["illustration", "branding"],
    aspect: 0.7,
  },
  {
    type: "project",
    title: "Kettle Illustration",
    slug: "kettle",
    preview: KettlePreview,
    filters: ["illustration"],
    aspect: 0.8,
  },
  {
    type: "project",
    title: "Elizabeths Flowers",
    slug: "elizabeths-flowers",
    preview: ElizabethsFlowers,
    filters: ["branding"],
    aspect: 1,
  },
  {
    type: "project",
    title: "Memobottle design challange",
    slug: "memobottle",
    preview: Memobottle,
    filters: ["illustration"],
    aspect: 1.5,
  },
];
