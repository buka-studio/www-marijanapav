import { StaticImageData } from 'next/image';
import { ReactNode } from 'react';

import BukaBranding01 from '~/public/work/buka-branding/bukabrand.png';
import BukaBrandingPreview from '~/public/work/buka-branding/preview.png';
import BukaWeb from '~/public/work/buka-studio-web/buka-web.png';
import EchoTabLanding01 from '~/public/work/echo-tab-landing-page/echo-tab-landing page_01.png';
import EchoTabLanding02 from '~/public/work/echo-tab-landing-page/echo-tab-landing page_02.png';
import EchoTabLandingPreview from '~/public/work/echo-tab-landing-page/preview.png';
import EchoTab from '~/public/work/echo-tab/echo-tab.webp';
import ElizabethsFlowers01 from '~/public/work/elizabeths-flowers/elizabethsflowers_01.png';
import ElizabethsFlowers02 from '~/public/work/elizabeths-flowers/elizabethsflowers_02.png';
import ElizabethsFlowers03 from '~/public/work/elizabeths-flowers/elizabethsflowers_03.png';
import ElizabethsFlowers04 from '~/public/work/elizabeths-flowers/elizabethsflowers_04.png';
import ElizabethsFlowers05 from '~/public/work/elizabeths-flowers/elizabethsflowers_05.png';
import ElizabethsFlowers from '~/public/work/elizabeths-flowers/preview.png';
import HavgrimPreview00 from '~/public/work/havgrim/havgrim_00.png';
import HavgrimPreview01 from '~/public/work/havgrim/havgrim_01.png';
import HavgrimPreview02 from '~/public/work/havgrim/havgrim_02.png';
import HavgrimPreview03 from '~/public/work/havgrim/havgrim_03.png';
import HavgrimPreview from '~/public/work/havgrim/preview.png';
import HighRoads01 from '~/public/work/high-roads/highroads_01.jpg';
import HighRoads02 from '~/public/work/high-roads/highroads_02.jpg';
import HighRoads03 from '~/public/work/high-roads/highroads_03.jpg';
import HighRoads04 from '~/public/work/high-roads/highroads_04.jpg';
import HighRoads05 from '~/public/work/high-roads/highroads_05.jpg';
import HighRoadsPreview from '~/public/work/high-roads/preview.png';
import IllustratedCardsPreview from '~/public/work/illustrated-cards/preview.png';
import InfinumBeer00 from '~/public/work/infinum-beer/infinumbeer_00.png';
import InfinumBeer01 from '~/public/work/infinum-beer/infinumbeer_01.png';
import InfinumBeerPreview from '~/public/work/infinum-beer/preview.png';
import Honey00 from '~/public/work/infinum-honey/honey_00.jpg';
import Honey01 from '~/public/work/infinum-honey/honey_01.jpg';
import Honey02 from '~/public/work/infinum-honey/honey_02.jpg';
import Honey03 from '~/public/work/infinum-honey/honey_03.jpg';
import InfinumHoneyPreview from '~/public/work/infinum-honey/preview.png';
import InfinumMerch00 from '~/public/work/infinum-merch/infinum_merch_00.jpg';
import InfinumMerch01 from '~/public/work/infinum-merch/infinum_merch_01.jpg';
import InfinumMerch02 from '~/public/work/infinum-merch/infinum_merch_02.jpg';
import InfinumMerch03 from '~/public/work/infinum-merch/infinum_merch_03.png';
import InfinumMerch04 from '~/public/work/infinum-merch/infinum_merch_04.png';
import InfinumMerch05 from '~/public/work/infinum-merch/infinum_merch_05.png';
import InfinumSwagPreview from '~/public/work/infinum-merch/preview.png';
import InfinumPosters0 from '~/public/work/infinum-posters/infinum-posters_0.png';
import InfinumPosters00 from '~/public/work/infinum-posters/infinum-posters_00.png';
import InfinumPosters01 from '~/public/work/infinum-posters/infinum-posters_01.png';
import InfinumPosters02 from '~/public/work/infinum-posters/infinum-posters_02.png';
import InfinumPosters03 from '~/public/work/infinum-posters/infinum-posters_03.png';
import InfinumPostersPreview from '~/public/work/infinum-posters/preview.png';
import KettlePreview from '~/public/work/kettle/preview.png';
import MemoriesPoster00 from '~/public/work/memories-poster/memories-poster_00.png';
import MemoriesPosterPreview from '~/public/work/memories-poster/preview.png';
import MidnightStudio00 from '~/public/work/midnight-studio/midnight-studio_00.png';
import MidnightStudio01 from '~/public/work/midnight-studio/midnight-studio_01.png';
import MidnightStudio02 from '~/public/work/midnight-studio/midnight-studio_02.png';
import MidnightStudioPreview from '~/public/work/midnight-studio/midnight-studio_preview.png';
import OperaPosters0 from '~/public/work/opera-posters/posters_0.png';
import OperaPosters00 from '~/public/work/opera-posters/posters_00.png';
import OperaPosters01 from '~/public/work/opera-posters/posters_01.png';
import OperaPosters02 from '~/public/work/opera-posters/posters_02.png';
import OperaPostersPreview from '~/public/work/opera-posters/preview.png';
import SignOffPreview from '~/public/work/program-end/sign-off_preview.png';
import SignOff01 from '~/public/work/program-end/sign-off01.png';
import SignOff02 from '~/public/work/program-end/sign-off02.png';
import SignOff03 from '~/public/work/program-end/sign-off03.png';
import SignOff04 from '~/public/work/program-end/sign-off04.png';
import rpavlini from '~/public/work/rpavlini/rpavlini.png';
import StampsPreview from '~/public/work/stamps/preview.png';
import Stamps00 from '~/public/work/stamps/stamps_00.png';
import Stamps01 from '~/public/work/stamps/stamps_01.png';
import Stamps07 from '~/public/work/stamps/stamps_07.png';
import Stamps08 from '~/public/work/stamps/stamps_08.png';
import Stamps10 from '~/public/work/stamps/stamps_10.png';
import Stars from '~/public/work/stamps/stars.gif';
import SupabaseHomepage01 from '~/public/work/supabase-homepage/supabase01.png';
import SupabaseHomepage02 from '~/public/work/supabase-homepage/supabase02.png';
import SupabaseHomepage03 from '~/public/work/supabase-homepage/supabase03.png';
import SupabaseIcons00 from '~/public/work/supabase-icons/supabase-icons_00.png';
import SupabaseIcons01 from '~/public/work/supabase-icons/supabase-icons_01.png';
import SupabaseIcons02 from '~/public/work/supabase-icons/supabase-icons_02.png';
import SupabaseIcons03 from '~/public/work/supabase-icons/supabase-icons_03.png';
import SupabaseIconsGif from '~/public/work/supabase-icons/supabase-icons.webp';
import SupabaseLW6 from '~/public/work/supabase-lw6/preview.png';
import SupabaseLW71 from '~/public/work/supabase-lw7/lw7-01.png';
import SupabaseLW72 from '~/public/work/supabase-lw7/lw7-02.png';
import SupabaseLW73 from '~/public/work/supabase-lw7/lw7-03.png';
import SupabaseLW74 from '~/public/work/supabase-lw7/lw7-04.png';
import SupabaseLW75 from '~/public/work/supabase-lw7/lw7-05.png';
import SupabaseLW76 from '~/public/work/supabase-lw7/lw7-06.png';
import SupabaseLW7 from '~/public/work/supabase-lw7/preview.png';
import SupabaseLW8 from '~/public/work/supabase-lw8/supabase0.png';
import SupabaseLW81 from '~/public/work/supabase-lw8/supabase1.png';
import SupabaseLW82 from '~/public/work/supabase-lw8/supabase2.png';
import SupabaseLW83 from '~/public/work/supabase-lw8/supabase3.png';
import SupabaseLW12Preview from '~/public/work/supabase-lw12/preview.png';
import SupabaseLW1201 from '~/public/work/supabase-lw12/supabase01.png';
import SupabaseLW1202 from '~/public/work/supabase-lw12/supabase02.png';
import SupabaseLW1203 from '~/public/work/supabase-lw12/supabase03.png';
import SupabaseLW1204 from '~/public/work/supabase-lw12/supabase04.png';
import SupabaseLW1205 from '~/public/work/supabase-lw12/supabase05.png';
import SupabaseLW1206 from '~/public/work/supabase-lw12/supabase06.png';

import SupabaseCard from './components/SupabaseCard';

export const filters = ['all', 'illustration', 'branding', 'digital', 'merch'] as const;

export type Filter = (typeof filters)[number];

export type StaticProject = {
  type?: 'project';
  title: string;
  description?: ReactNode;
  slug?: string;
  filters: Filter[];
  preview: StaticImageData;
  aspect?: number;
  blocks?: Array<Array<StaticImageData | ReactNode>>;
  images?: StaticImageData[];
  dynamic?: boolean;
  tags?: string[];
  link?: string;
  publishedAt?: string;
};

export type ComponentProject = {
  type: 'component';
  content: ReactNode;
  filters: Filter[];
};

export type Project = (StaticProject | ComponentProject) & {
  hidden?: boolean;
};

// aspect - width/height - for grid layout
// todo: consider contentlayer or some other lightweight cms
export const projects: Project[] = [
  {
    type: 'project',
    title: 'EchoTab Chrome Extension Landing page',
    slug: 'echo-tab',
    preview: EchoTabLandingPreview,
    images: [EchoTabLanding01, EchoTabLanding02],
    filters: ['digital', 'branding'],
    description:
      'Landing page design for a clean and simple browser extension, that helps you manage thousands of saved tabs, with multi-select, smart AI tagging and Cmd+K command menu for an efficient workflow.',
    link: 'https://echotab.buka.studio/',
    tags: ['Figma', '© 2024'],
    aspect: 1.1,
  },
  {
    type: 'project',
    title: 'EchoTab Chrome Extension',
    slug: 'echo-tab',
    preview: EchoTab,
    images: [EchoTab],
    filters: ['digital'],
    description:
      'A clean and simple browser extension, that helps you manage thousands of saved tabs, with multi-select, smart AI tagging and CmdK command menu for an efficient workflow.',
    link: 'https://echotab.buka.studio/',
    tags: ['Figma', '© 2024'],
    aspect: 1.5,
  },
  {
    type: 'project',
    title: 'Robert Pavlinić Personal Website',
    slug: 'rpavlini',
    preview: rpavlini,
    images: [rpavlini],
    filters: ['digital', 'branding'],
    description:
      'I designed a simple personal website for my partner, drawing inspiration from the minimalist aesthetic that mirrors the simplicity of a markdown file. Next up, we are focused on adding a few components to provide a more personal touch. More on that soon.',
    link: 'https://rpavlini.com',
    tags: ['Figma', '© 2024'],
    aspect: 1.3,
  },
  {
    type: 'project',
    title: 'Buka Studio Branding',
    slug: 'buka-studio',
    preview: BukaBrandingPreview,
    images: [BukaBranding01, BukaWeb],
    filters: ['digital', 'branding'],
    description: 'Branding for Buka Studio, design and development company I run with my husband.',
    link: 'https://buka.studio',
    tags: ['Figma', '© 2024'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'Supabase Bento Grid',
    slug: 'supabase-hero',
    preview: SupabaseHomepage01,
    images: [SupabaseHomepage01, SupabaseHomepage02, SupabaseHomepage03],
    filters: ['digital', 'illustration'],
    description:
      'Design for Supabase hero section that showcases all of Supabase products in a bento grid.',
    link: 'https://supabase.com',
    tags: ['Figma', '© 2023'],
    aspect: 1.3,
  },
  {
    type: 'project',
    title: 'Supabase Launch Week 12',
    slug: 'supabase-launch-week-12',
    preview: SupabaseLW12Preview,
    images: [
      SupabaseLW1201,
      SupabaseLW1202,
      SupabaseLW1203,
      SupabaseLW1204,
      SupabaseLW1205,
      SupabaseLW1206,
    ],
    filters: ['digital', 'branding'],
    description:
      'Another Supabase Launch Week, a week of announcing new features. Each day we unlock new features that the team has been working on for the last few months. Each day is accompanied with visuals, diagrams, blog posts, merch and community meetups.',
    link: 'https://supabase.com/launch-week',
    tags: ['Figma', '© 2024'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'Supabase Launch Week 8',
    slug: 'supabase-launch-week-8',
    preview: Stars,
    images: [SupabaseLW8, SupabaseLW81, SupabaseLW82, SupabaseLW83],
    filters: ['digital', 'branding'],
    description:
      "Supabase Launch Week is week-long event packed with product updates, community announcements, meetups, daily video announcements, and live Discord hangouts. It's a showcase of what the Supabase team has been working on in the past few months, and on the design front it's an opportunity to push our brand's boundaries.",
    link: 'https://supabase.com/launch-week/8',
    tags: ['Figma', '© 2023'],
    aspect: 0.7,
  },

  {
    type: 'project',
    title: 'Interactive Illustrated Cards',
    slug: 'illustrated-cards',
    preview: IllustratedCardsPreview,
    filters: ['digital'],
    aspect: 0.7,
    description:
      'Exploration for a landing page with holographic cards linking to various pages in a developer portfolio. Cards explore a monoline and monochromatic approach with holographic elements and various interactive games.',
    tags: ['Figma', '© 2023'],
    dynamic: true,
  },
  {
    type: 'project',
    title: 'Supabase Launch Week 7 Branding',
    slug: 'supabase-lw7',
    images: [SupabaseLW71, SupabaseLW72, SupabaseLW73, SupabaseLW74, SupabaseLW75, SupabaseLW76],
    preview: SupabaseLW7,
    filters: ['branding', 'digital'],
    description:
      "Supabase Launch Week is week-long event where we announce updates and new features. It's a showcase of what the Supabase team has been working on in the past few months, and on the design front it's an opportunity to push our brand's boundaries. For Launch Week 7 I created many visuals with Midjourney which we later used to spin off 400+ unique visuals for each Launch Week ticket. ",
    aspect: 1,
    tags: ['Figma', 'Midjourney', '© 2023'],
  },
  {
    type: 'project',
    title: 'Supabase Icons',
    slug: 'supabase-icons',
    preview: SupabaseIcons01,
    images: [SupabaseIcons00, SupabaseIconsGif, SupabaseIcons01, SupabaseIcons02, SupabaseIcons03],
    filters: ['branding', 'digital'],
    tags: ['Figma', '© 2022'],

    aspect: 1,
  },

  {
    type: 'project',
    title: 'Digital Stamp Collection',
    slug: 'stamp-collection',
    preview: StampsPreview,
    filters: ['illustration'],
    description:
      "This is my personal project of digitally recreating my grandpa's stamps. It's a homage to his philatelic journey, brought online when I started my own philately collection, but in a different format. Through this collection I've set myself a goal to publish new stamp daily for a year, and learn different drawing softwares in the process.",
    images: [Stamps00, Stamps01, Stamps10, Stamps07, Stamps08],
    tags: ['Adobe Illustrator', 'Procreate', '© 2022'],
    aspect: 0.7,
  },

  {
    type: 'project',
    title: 'Infinum Craft Beer Can Packaging',
    slug: 'infinum-beer',
    preview: InfinumBeerPreview,
    filters: ['branding', 'merch'],
    aspect: 1,
    description:
      'In collaboration with Infinum and Lepidečki Brewery, I designed a label for a refreshing lager beer aimed at developers, nudging users to think of Github PRs. The "Pour Request" beer comes in all-black cans with an eye-catching white label featuring an oversized Neue Haas Grotesk typography that will make you want to spin the bottle and take a sip.',
    images: [InfinumBeer00, InfinumBeer01],
    tags: ['Adobe Illustrator', '© 2022'],
  },

  {
    type: 'project',
    title: 'Memories Poster',
    slug: 'memories-poster',
    preview: MemoriesPosterPreview,
    filters: ['illustration'],
    description:
      'I collected tons of tickets, stickers, papers, and generally memories that I shared with my husband over the years. These are some of them but made digital.',
    aspect: 0.75,
    images: [MemoriesPoster00],
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2021'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Kettle Illustration',
    slug: 'kettle',
    preview: KettlePreview,
    filters: ['illustration'],
    aspect: 0.85,
  },

  {
    type: 'project',
    title: 'Infinum Posters',
    slug: 'infinum-posters',
    preview: InfinumPostersPreview,
    filters: ['branding'],
    description:
      "Typography exploration I worked on as part of Infinum's refreshed branding brought to life through a collection of large B2 office posters inspired by iconic Vignelli type compositions. Each layout pays homage to the power of the bold Neue Haas Grotesk typeface, aligning with Infinum's brand ethos.",
    images: [
      InfinumPosters0,
      InfinumPosters00,
      InfinumPosters01,
      InfinumPosters02,
      InfinumPosters03,
    ],
    tags: ['Figma', '© 2022'],
    link: 'https://infinum.com/brand',
    aspect: 1.1,
  },
  {
    hidden: true,
    type: 'component',
    content: <SupabaseCard />,
    filters: ['branding', 'digital'],
  },

  {
    type: 'project',
    title: 'Infinum Merch',
    slug: 'infinum-swag',
    preview: InfinumSwagPreview,
    filters: ['branding', 'merch'],
    description:
      'Design for Infinum merch, a well known Croatian software agency, known for its light, clean, and bold aesthetic. The merchandise was designed to reflect these qualities and use signature red color as an accent.',
    aspect: 0.73,
    images: [
      InfinumMerch00,
      InfinumMerch01,
      InfinumMerch02,
      InfinumMerch03,
      InfinumMerch04,
      InfinumMerch05,
    ],
    link: 'https://infinum.com/brand',
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2022'],
  },
  {
    type: 'project',
    title: 'Series of Royal Opera Posters',
    slug: 'opera-posters',
    preview: OperaPostersPreview,
    filters: ['illustration'],
    description: 'Series of posters taking a refreshing perspective on these well-known stories.',
    aspect: 0.73,
    images: [OperaPosters0, OperaPosters00, OperaPosters01, OperaPosters02],
    tags: ['Adobe Illustrator', 'Procreate', '© 2021'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'The High Road Streetwear Brand Logo',
    slug: 'high-roads',
    preview: HighRoadsPreview,
    filters: ['branding'],
    description:
      'A branding project for an urban fashion brand that blends class with streetwear flair. Distinctive high contrast typeface combined with bold colors as its primary brand components shows off a bit of the brands personality.',
    aspect: 1,
    images: [HighRoads01, HighRoads02, HighRoads03, HighRoads04, HighRoads05],
    tags: ['Adobe Illustrator', '© 2020'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Supabase Launch Week 6 Branding',
    slug: 'supabase-lw6',
    preview: SupabaseLW6,
    filters: ['illustration'],
    description: 'Remember when TV programs ended at 00:00?',
    aspect: 1,
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    type: 'project',
    title: 'Packaging for Croatian honey collection ',
    slug: 'infinum-honey',
    preview: InfinumHoneyPreview,
    filters: ['branding', 'merch'],
    description:
      'Packaging and label design I did for Infinum, Croatian software agency. In the midst of a worldwide quarantine, Christmas 2020 called for a touch of sweetness to uplift spirits. We answered the call by curating a three-pack of Croatian honey, as a heartfelt gift for Infinum clients. With over 500 gifts shipped, we aimed to bring a taste of warmth and indulgence to homes during these challenging times.',
    aspect: 1,
    images: [Honey00, Honey01, Honey02, Honey03],
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Elizabeth’s Flowers Floral Studio Logo',
    slug: 'elizabeths-flowers',
    preview: ElizabethsFlowers,
    filters: ['branding'],
    aspect: 1,
    description:
      "To capture the essence of Elizabeth's Flowers' quality and attention to detail, we opted for a timeless, elegant serif font and a green and subtly pink color palette.",
    images: [
      ElizabethsFlowers01,
      ElizabethsFlowers02,
      ElizabethsFlowers03,
      ElizabethsFlowers04,
      ElizabethsFlowers05,
    ],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Midnight Design Studio Branding',
    slug: 'midnight-studio',
    preview: MidnightStudioPreview,
    filters: ['branding'],
    aspect: 1.3,
    description:
      'Branding for a design studio specializing in bold and captivating branding identities. Through a fusion of sharp typography and striking color palettes, we created impactful visual identity that resonates with the target audience',
    images: [MidnightStudio00, MidnightStudio01, MidnightStudio02],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'The Havgrim Seaside Hotel Branding',
    slug: 'havgrim',
    preview: HavgrimPreview,
    filters: ['branding'],
    aspect: 1.2,
    description:
      'Nestled in the captivating landscapes of the Faroe Islands, the Havgrim Hotel branding captures the essence of tradition and timeless elegance. With its classic light color palette and refined typography, it evokes a sense of heritage.',
    images: [HavgrimPreview00, HavgrimPreview01, HavgrimPreview02, HavgrimPreview03],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    type: 'project',
    title: 'Sign-off Poster Series',
    slug: 'program-end',
    preview: SignOffPreview,
    filters: ['illustration'],
    description:
      'Remember when TV programs used to end at midnight? What did you imagine happens after clock runs 00:00? These series of nostalgic posters takes you back to the days when the familiar image signaled the end of late-night programming. Posters showcase gradual deconstruction of the well known visual, from its structured grid to an explosion of colors and forms.',
    images: [SignOff01, SignOff02, SignOff03, SignOff04],
    tags: ['Adobe Illustrator', '© 2021'],
    aspect: 0.7,
  },
];
