import { StaticImageData } from 'next/image';
import { ReactNode } from 'react';

import DatabaseBuild from '~/public/work/database-build/database-build.png';
import EchoTabLanding01 from '~/public/work/echo-tab-landing-page/echo-tab-landing page_01.png';
import EchoTabLandingPreview from '~/public/work/echo-tab-landing-page/preview.png';
import ElizabethsFlowers01 from '~/public/work/elizabeths-flowers/elizabethsflowers_01.png';
import ElizabethsFlowers02 from '~/public/work/elizabeths-flowers/elizabethsflowers_02.png';
import ElizabethsFlowers03 from '~/public/work/elizabeths-flowers/elizabethsflowers_03.png';
import ElizabethsFlowers04 from '~/public/work/elizabeths-flowers/elizabethsflowers_04.png';
import ElizabethsFlowers05 from '~/public/work/elizabeths-flowers/elizabethsflowers_05.png';
import ElizabethsFlowers from '~/public/work/elizabeths-flowers/preview.png';
import GeistImpactSprites from '~/public/work/geist-impact/geist-impact-sprites.png';
import GeistImpactPreview from '~/public/work/geist-impact/preview.png';
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
import InfinumBeer00 from '~/public/work/infinum-beer/infinumbeer_00.png';
import InfinumBeer01 from '~/public/work/infinum-beer/infinumbeer_01.png';
import InfinumBeerPreview from '~/public/work/infinum-beer/preview.png';
import InfinumMerch00 from '~/public/work/infinum-merch/infinum_merch_00.jpg';
import InfinumMerch01 from '~/public/work/infinum-merch/infinum_merch_01.jpg';
import InfinumMerch02 from '~/public/work/infinum-merch/infinum_merch_02.jpg';
import InfinumMerch03 from '~/public/work/infinum-merch/infinum_merch_03.png';
import InfinumMerch04 from '~/public/work/infinum-merch/infinum_merch_04.png';
import InfinumMerch05 from '~/public/work/infinum-merch/infinum_merch_05.png';
import KettlePreview from '~/public/work/kettle/preview.png';
import LiveKitWebsitePreview from '~/public/work/livekit-website/livekit-enterprise-scale.jpg';
import LiveKitWebsite02 from '~/public/work/livekit-website/livekit-explorations.png';
import LiveKitDocsAgents from '~/public/work/livekit-website/livekit-docs-agents.png';
import LiveKitWebsite01 from '~/public/work/livekit-website/livekit-features-grid.jpg';
import LiveKitHomepageFrames from '~/public/work/livekit-website/livekit-homepage-frames.png';
import LiveKitMerchCap from '~/public/work/livekit-website/livekit-merch-cap.jpg';
import LiveKitMerchStickers from '~/public/work/livekit-website/livekit-merch-stickers.jpg';
import LiveKitWebsiteHomepage from '~/public/work/livekit-website/livekit-homepage.png';
import LiveKitValuesCards from '~/public/work/livekit-website/livekit-values-cards.png';
import LiveKitFeaturesCards from '~/public/work/livekit-website/livekit-features-cards.png';
import LiveKitWebsite04 from '~/public/work/livekit-website/livekit-sdk-features.jpg';
import LiveKitWebsite05 from '~/public/work/livekit-website/livekit-values.jpg';
import LiveKitWebsite03 from '~/public/work/livekit-website/livekit-voice-ai-hero.jpg';
import LiveKit01 from '~/public/work/livekit/livekit_1.png';
import LiveKit02 from '~/public/work/livekit/livekit_2.png';
import LiveKit03 from '~/public/work/livekit/livekit_3.png';
import LiveKit04 from '~/public/work/livekit/livekit_4.png';
import LiveKitPreview from '~/public/work/livekit/livekit_preview.png';
import LiveKitLayers from '~/public/work/livekit/livekit-layers.jpg';
import MidnightStudio00 from '~/public/work/midnight-studio/midnight-studio_00.png';
import MidnightStudio01 from '~/public/work/midnight-studio/midnight-studio_01.png';
import MidnightStudio02 from '~/public/work/midnight-studio/midnight-studio_02.png';
import MidnightStudioPreview from '~/public/work/midnight-studio/midnight-studio_preview.png';
import FeedbackPostcards00 from '~/public/work/postcard/feedback-postcard_00.png';
import FeedbackPostcards01 from '~/public/work/postcard/feedback-postcard_01.png';
import FeedbackPostcards02 from '~/public/work/postcard/feedback-postcard_02.png';
import FeedbackPostcards03 from '~/public/work/postcard/feedback-postcard_03.png';
import FeedbackPostcards04 from '~/public/work/postcard/feedback-postcard_04.png';
import FeedbackPostcards05 from '~/public/work/postcard/feedback-postcard_05.png';
import FeedbackPostcards07 from '~/public/work/postcard/feedback-postcard_07.png';
import FeedbackPostcards08 from '~/public/work/postcard/feedback-postcard_08.png';
import FeedbackPostcards09 from '~/public/work/postcard/feedback-postcard_09.jpg';
import Sketchbook01 from '~/public/work/sketchbook/sketchbook_1.png';
import Sketchbook02 from '~/public/work/sketchbook/sketchbook_2.png';
import Sketchbook02a from '~/public/work/sketchbook/sketchbook_2a.png';
import Sketchbook03 from '~/public/work/sketchbook/sketchbook_3.png';
import SketchbookPreview from '~/public/work/sketchbook/sketchbook_main.png';
import Stars from '~/public/work/stamps/stars.webp';
import SupabaseArchitectureDiagrams from '~/public/work/supabase-homepage/supabase-architecture-diagrams.jpg';
import SupabaseCareers from '~/public/work/supabase-homepage/supabase-careers.png';
import SupabaseDashboardMigrations from '~/public/work/supabase-homepage/supabase-dashboard-migrations.png';
import SupabaseHomepagePreview from '~/public/work/supabase-homepage/supabase-homepage-hero.png';
import SupabaseHomepageOverview from '~/public/work/supabase-homepage/supabase-homepage-overview.png';
import SupabaseOpenSource from '~/public/work/supabase-homepage/supabase-open-source.png';
import SupabaseHomepage01 from '~/public/work/supabase-homepage/supabase01.png';
import SupabaseHomepage02 from '~/public/work/supabase-homepage/supabase02.png';
import SupabaseHomepage03 from '~/public/work/supabase-homepage/supabase03.png';
import SupabaseIcons00 from '~/public/work/supabase-icons/supabase-icons_00.png';
import SupabaseIconsGif from '~/public/work/supabase-icons/supabase-icons.webp';
import SupabaseLW6 from '~/public/work/supabase-lw6/preview.png';
import SupabaseLW71 from '~/public/work/supabase-lw7/lw7-01.png';
import SupabaseLW72 from '~/public/work/supabase-lw7/lw7-02.png';
import SupabaseLW73 from '~/public/work/supabase-lw7/lw7-03.png';
import SupabaseLW74 from '~/public/work/supabase-lw7/lw7-04.png';
import SupabaseLW75 from '~/public/work/supabase-lw7/lw7-05.png';
import SupabaseLW76 from '~/public/work/supabase-lw7/lw7-06.png';
import SupabaseLW7 from '~/public/work/supabase-lw7/preview.png';
import SupabaseLW8OgDay2 from '~/public/work/supabase-lw8/supabase-lw8-og-day2.jpg';
import SupabaseLW8OgDay3 from '~/public/work/supabase-lw8/supabase-lw8-og-day3.jpg';
import SupabaseLW8OgDay4 from '~/public/work/supabase-lw8/supabase-lw8-og-day4.jpg';
import SupabaseLW8OgDay5 from '~/public/work/supabase-lw8/supabase-lw8-og-day5.jpg';
import SupabaseLW8PostLaunch from '~/public/work/supabase-lw8/supabase-lw8-post-launch.png';
import SupabaseLW8 from '~/public/work/supabase-lw8/supabase0.png';
import SupabaseLW81 from '~/public/work/supabase-lw8/supabase1.png';
import SupabaseLW82 from '~/public/work/supabase-lw8/supabase2.png';
import SupabaseLW83 from '~/public/work/supabase-lw8/supabase3.png';
import SupabaseLW12Preview from '~/public/work/supabase-lw12/preview.png';
import SupabaseLW12Grid from '~/public/work/supabase-lw12/supabase-launch-week-12-grid.png';
import SupabaseLW12Tickets from '~/public/work/supabase-lw12/supabase-launch-week-12-tickets.jpg';
import SupabaseLW1201 from '~/public/work/supabase-lw12/supabase01.png';
import SupabaseLW1202 from '~/public/work/supabase-lw12/supabase02.png';
import SupabaseLW1203 from '~/public/work/supabase-lw12/supabase03.png';
import SupabaseLW1204 from '~/public/work/supabase-lw12/supabase04.png';
import SupabaseLW1205 from '~/public/work/supabase-lw12/supabase05.png';
import SupabaseLW1206 from '~/public/work/supabase-lw12/supabase06.png';
import WeightOfPaperDesk from '~/public/work/the-weight-of-paper/weight-of-paper-desk.jpg';
import WeightOfPaper03 from '~/public/work/the-weight-of-paper/weight-of-paper-loupe-ui.png';
import WeightOfPaperPreview from '~/public/work/the-weight-of-paper/weight-of-paper-loupe.png';
import WeightOfPaper02 from '~/public/work/the-weight-of-paper/weight-of-paper-moodboard.png';
import WeightOfPaper01 from '~/public/work/the-weight-of-paper/weight-of-paper-stamps.png';
import VercelDiagramLibrary02 from '~/public/work/vercel-diagram-library/vercel-diagram-cache-miss.png';
import VercelDiagramLibraryPreview from '~/public/work/vercel-diagram-library/vercel-diagram-library-overview.jpg';
import VercelDiagramLibrary01 from '~/public/work/vercel-diagram-library/vercel-diagram-reason.png';
import VercelStartupsCap from '~/public/work/vercel-startups/vercel-startups-cap.jpg';
import VercelStartups from '~/public/work/vercel-startups/vercel-startups-hero.png';
import VercelStartupsLogo from '~/public/work/vercel-startups/vercel-startups-logo.png';
import VercelStartupsWovenLabel from '~/public/work/vercel-startups/vercel-startups-woven-label.jpg';

import SupabaseCard from './components/SupabaseCard';

export const filters = ['all', 'illustration', 'branding', 'digital', 'merch'] as const;

export const projectGridPreviewSizes = '(max-width: 639px) 100vw, 50vw';

export type Filter = (typeof filters)[number];

/**
 * Draw the backdrop in code (theme-aware) instead of baking it into the asset.
 * `aspectRatio` is the backdrop's shape, `width` how wide the media sits inside it,
 * `align` where it sits vertically (default centred; `end` for media cropped at the bottom).
 */
export type MediaBackdrop = { aspectRatio: string; width: string; align?: 'center' | 'end' };

export type ProjectImage = {
  type: 'image';
  src: StaticImageData;
  caption?: string;
  backdrop?: MediaBackdrop;
  /** Subtle 1px theme border, for dark assets that would otherwise bleed into the page. */
  border?: boolean;
};

export type ProjectVideo = {
  type: 'video';
  src: string;
  caption?: ReactNode;
  backdrop?: MediaBackdrop;
  /** Subtle 1px theme border, for dark assets that would otherwise bleed into the page. */
  border?: boolean;
};

/** A looping clip beside a quote; the last line lights up word by word (live-caption style). */
export type ProjectSpeech = {
  type: 'speech';
  src: string;
  lines: string[];
  caption?: ReactNode;
};

export type ProjectMediaItem = StaticImageData | ProjectImage | ProjectVideo | ProjectSpeech;

export type ProjectMediaRow = {
  type: 'row';
  items: ProjectMediaItem[];
  /** One caption under the whole row (spans all items). */
  caption?: ReactNode;
};

export type ProjectMedia = ProjectMediaItem | ProjectMediaRow;

export type StaticProject = {
  type?: 'project';
  title: string;
  description?: ReactNode;
  slug?: string;
  filters: Filter[];
  preview: StaticImageData;
  previewUnoptimized?: boolean;
  aspect?: number;
  previewPadded?: boolean;
  blocks?: Array<Array<StaticImageData | ReactNode>>;
  images?: ProjectMedia[];
  dynamic?: boolean;
  tags?: string[];
  link?: string;
  links?: Array<string | { href: string; label: string }>;
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

export function isVisibleStaticProject(project: Project): project is StaticProject {
  return project.type !== 'component' && !project.hidden;
}

const stampsCodropsLink = {
  href: 'https://tympanus.net/codrops/2026/06/09/building-an-interactive-digital-stamp-collection-with-shaders-postcards-and-playful-inspection/',
  label: 'Read blog post on codrops.com',
} as const;

// aspect - width/height - for grid layout
// todo: consider contentlayer or some other lightweight cms
export const projects: Project[] = [
  {
    type: 'project',
    title: 'Vercel for Startups',
    slug: 'vercel-startups',
    preview: VercelStartups,
    images: [
      VercelStartups,
      { type: 'video', src: '/work/vercel-startups/vercel-startups.mp4' },
      VercelStartupsLogo,
      {
        type: 'row',
        items: [VercelStartupsCap, VercelStartupsWovenLabel],
      },
    ],
    filters: ['digital', 'branding'],
    description:
      'Branding for Vercel for Startups. Built a compact mark and visual system that sits cleanly within the Vercel brand while giving the program its own identity across the site, launch assets, and product touchpoints.',
    link: 'https://vercel.com/startups',
    tags: ['Figma', '© 2025'],
    aspect: 1,
  },
  {
    hidden: true,
    type: 'project',
    title: 'Vercel Diagram Library',
    slug: 'vercel-diagram-library',
    preview: VercelDiagramLibraryPreview,
    images: [VercelDiagramLibraryPreview, VercelDiagramLibrary01, VercelDiagramLibrary02],
    filters: ['digital', 'branding'],
    description:
      'A dark-mode diagram system for explaining Vercel architecture: caches, routers, security, and AI workflows, with a consistent, monospaced, high-contrast visual language.',
    tags: ['Figma', '© 2025'],
    aspect: 1.4,
  },
  {
    type: 'project',
    title: 'Geist Impact',
    slug: 'geist-impact',
    preview: GeistImpactPreview,
    images: [
      { type: 'video', src: '/work/geist-impact/geist-impact-01.mp4' },
      {
        type: 'image',
        src: GeistImpactSprites,
        caption:
          'Pixel sprites for each of the geist’s in-game states, from sleepy and sad to angry and in love.',
      },
      { type: 'video', src: '/work/geist-impact/geist-impact-02.mp4' },
    ],
    filters: ['digital'],
    description: (
      <>
        Geist Impact is a browser game inspired by Space Impact, made to accompany the release of{' '}
        <a
          href="https://vercel.com/font"
          target="_blank"
          rel="noreferrer noopener"
          className="text-text-primary underline underline-offset-2"
        >
          Geist Pixel
        </a>{' '}
        by Vercel. Instead of alien invaders, a geist (ghost) appears, and Geist Pixel letters
        advance toward you in place of the usual enemy waves.
      </>
    ),
    link: 'https://geist-impact.vercel.app',
    tags: ['v0', '© 2026'],
    aspect: 1.2,
    previewPadded: true,
  },
  {
    type: 'project',
    title: 'Feedback postcards on the web',
    slug: 'feedback-postcards',
    preview: FeedbackPostcards00,
    images: [
      { type: 'video', src: '/work/postcard/feedback-postcard-demo.mp4' },
      FeedbackPostcards01,
      FeedbackPostcards02,
      FeedbackPostcards03,
      FeedbackPostcards04,
      FeedbackPostcards05,
      FeedbackPostcards07,
      FeedbackPostcards08,
      FeedbackPostcards09,
    ],
    filters: ['illustration'],
    description: (
      <>
        <p>
          Illustrations for the digital postcard component, where users can send feedback or request
          new stamp designs. I imagined the person writing the feedback and tried to capture them in
          the moment of writing it. This is why the illustration changes based on screen size: on
          mobile, the person is holding a phone; on desktop, they are typing on a keyboard.
        </p>
        <p>
          Made with my partner as part of our digital stamp collection. The postage mark is a nod to
          Queen Victoria’s Penny Black, the first stamp ever issued, redrawn as a portrait of the
          two of us behind the project.
        </p>
      </>
    ),
    link: 'https://marijanapav.com/stamps',
    links: [stampsCodropsLink],
    tags: ['Figma', '© 2025'],
    aspect: 1.1,
  },
  {
    type: 'project',
    title: 'The Weight of Paper',
    slug: 'the-weight-of-paper',
    preview: WeightOfPaperPreview,
    images: [
      { type: 'video', src: '/work/the-weight-of-paper/weight-of-paper-demo.mp4' },
      { type: 'video', src: '/work/the-weight-of-paper/handwriting.mp4' },
      WeightOfPaperDesk,
      WeightOfPaper01,
      WeightOfPaper02,
      WeightOfPaper03,
    ],
    filters: ['illustration', 'digital'],
    description: (
      <>
        <p>
          What started in 2020 as a lockdown drawing practice, recreating stamps from my grandpa’s
          album, grew into a digital collection of almost a hundred vector illustrations, made by
          hand with no AI. In 2025, my partner and I turned a shortlist of those stamps into an
          online philately experience.
        </p>
        <p>
          The goal was not another image gallery, but something that kept the calm, tactile feel of
          a real album: a loose field of stamps to browse, a glass loupe for close inspection, and a
          postcard for sending feedback back.
        </p>
      </>
    ),
    link: 'https://marijanapav.com/stamps',
    links: [stampsCodropsLink],
    tags: ['Figma', 'Adobe Illustrator', 'Procreate', '© 2025'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'LiveKit branding',
    slug: 'livekit-branding',
    preview: LiveKitWebsiteHomepage,
    images: [
      // Website overview first.
      {
        type: 'image',
        src: LiveKitHomepageFrames,
        backdrop: { aspectRatio: '2820 / 2279', width: '85.25%', align: 'end' },
      },
      {
        type: 'speech',
        src: '/work/livekit-website/livekit-speech-clip.mp4',
        lines: [
          'If one day AI is as smart as a human,',
          'we’ll interact with it like we do with each other.',
          'Sometimes we text, but most times we talk.',
        ],
      },
      {
        type: 'video',
        src: '/work/livekit-website/livekit-brand-guidelines.mp4',
        backdrop: { aspectRatio: '1402 / 1002', width: '68.5%' },
      },
      {
        type: 'image',
        src: LiveKitValuesCards,
        backdrop: { aspectRatio: '2400 / 2198', width: '83.33%' },
        caption:
          'Cards and visuals I created for the LiveKit brand values we defined as a team early on when design team was just assembled.',
      },
      {
        type: 'image',
        src: LiveKitFeaturesCards,
        backdrop: { aspectRatio: '2400 / 1498', width: '84.6%' },
      },
      {
        type: 'video',
        src: '/work/livekit-website/livekit-gradation-levels.mp4',
        border: true,
        caption:
          'Recursive structures symbolize resilient infrastructure, hinting at how fragmented data packets are organized into seamless real-time communication. Sky-inspired imagery adds a sense of scale, connectivity, and openness, balancing the precision of the technical visual language with organic elements.',
      },
      {
        type: 'video',
        src: '/work/livekit-website/livekit-og-images.mp4',
        backdrop: { aspectRatio: '1402 / 1002', width: '68.5%' },
        caption: 'The system applied to social and OG images, from launch posts to talks and demos.',
      },
      {
        type: 'video',
        src: '/work/livekit-website/livekit-logo-menu.mp4',
        border: true,
        caption:
          'Clicking the logo opens quick access to brand assets: copy the icon or wordmark as SVG, or download the full kit.',
      },
      { type: 'video', src: '/work/livekit-website/livekit-enterprise-scale.mp4', border: true },
      { type: 'image', src: LiveKitDocsAgents, border: true },
      {
        type: 'row',
        items: [
          { type: 'image', src: LiveKitMerchCap, border: true },
          { type: 'image', src: LiveKitMerchStickers, border: true },
        ],
      },
      {
        type: 'video',
        src: '/work/livekit-website/livekit-poster-colorways.mp4',
        backdrop: { aspectRatio: '2128 / 1330', width: '37.5%' },
      },
    ],
    filters: ['digital', 'branding'],
    description: (
      <>
        <p>
          My work at LiveKit focused on evolving its visual identity and establishing a cohesive
          brand experience across the website, developer documentation, product launches, marketing
          materials, and merchandise. This also included defining the color palette and typographic
          pairings, as well as developing a system of visual assets.
        </p>
        <p>
          The visual direction centered on giving form to the invisible world of infrastructure.
          Through precise, expressive linework and technical minimalism, I explored ways to expose
          the underlying structure of complex systems, translating technical concepts into a
          distinctive visual language.
        </p>
        <p>
          While redesigning the website, I worked closely with design engineers who also encouraged
          me to push changes myself. This made me much more comfortable working with
          code, and I ended up building a few pages on my own, as well as helped implement light
          mode in the docs.
        </p>
      </>
    ),
    link: 'https://livekit.com/',
    tags: ['Figma', '© 2025'],
    aspect: 1.2,
  },
  {
    hidden: true,
    type: 'project',
    title: 'LiveKit Brand and Website',
    slug: 'livekit-website',
    preview: LiveKitWebsitePreview,
    images: [
      LiveKitWebsite05,
      LiveKitWebsitePreview,
      LiveKitWebsite01,
      LiveKitWebsite02,
      LiveKitWebsite03,
      LiveKitWebsite04,
    ],
    filters: ['digital', 'branding'],
    description:
      'Website design for LiveKit Voice AI, covering hero, ecosystem, agent framework, and enterprise-scale infrastructure visuals that make real-time voice feel tangible, global, and built for developers.',
    link: 'https://livekit.com/',
    tags: ['Figma', '© 2025'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'An overview of how LiveKit works',
    slug: 'how-livekit-works',
    preview: LiveKitPreview,
    images: [
      { type: 'video', src: '/work/livekit/how-livekit-works.mp4' },
      LiveKit01,
      LiveKit02,
      LiveKit03,
      LiveKit04,
      LiveKitLayers,
    ],
    filters: ['digital', 'branding', 'illustration'],
    description:
      'Homepage “How it works” component for LiveKit, designed to make invisible infrastructure feel tangible. It walks through the end-to-end flow of a voice agent interaction, layering the system so you can interact with it and get a clearer feel for how these elements connect.',
    link: 'https://livekit.com/',
    tags: ['Figma', '© 2024'],
    aspect: 0.9,
  },
  {
    type: 'project',
    title: 'EchoTab Chrome Extension',
    slug: 'echo-tab-landing',
    preview: EchoTabLandingPreview,
    images: [
      { type: 'video', src: '/work/echo-tab-landing-page/echotab-genie.mp4' },
      {
        type: 'row',
        items: [
          { type: 'video', src: '/work/echo-tab-landing-page/echotab-bookmarks.mp4' },
          { type: 'video', src: '/work/echo-tab-landing-page/echo-tab.mp4' },
        ],
      },
      EchoTabLanding01,
    ],
    filters: ['digital', 'branding'],
    description:
      'Product and landing page design for EchoTab, a clean and simple browser extension that helps you manage thousands of saved tabs, with multi-select, smart AI tagging, and a Cmd+K command menu for an efficient workflow.',
    link: 'https://echotab.buka.studio/',
    links: [
      {
        href: 'https://chromewebstore.google.com/detail/echotab/cnhamlcjfdekdinhkfmllfdjamcncbkl',
        label: 'Get the extension at Chrome Web Store',
      },
    ],
    tags: ['Figma', '© 2024', 'In Progress'],
    aspect: 1.1,
  },
  {
    hidden: true,
    type: 'project',
    title: 'Digital Sketchbook',
    slug: 'sketchbook',
    preview: SketchbookPreview,
    images: [Sketchbook01, Sketchbook02, Sketchbook02a, Sketchbook03],
    filters: ['illustration'],
    description:
      'A personal collection of sketches made in Procreate, just for fun. I’m planning on adding a lot more sketches and turning them into a showcase site, presented inside a lifelike 3D sketchbook (WIP). ',
    tags: ['Procreate', 'In Progress'],
    aspect: 1.4,
  },
  {
    type: 'project',
    title: 'Supabase Branding and Website',
    slug: 'supabase-branding',
    preview: SupabaseHomepagePreview,
    images: [
      SupabaseHomepageOverview,
      SupabaseDashboardMigrations,
      SupabaseHomepage01,
      SupabaseHomepage02,
      SupabaseHomepage03,
      SupabaseCareers,
      SupabaseOpenSource,
      SupabaseArchitectureDiagrams,
      DatabaseBuild,
      SupabaseIcons00,
      SupabaseIconsGif,
    ],
    filters: ['digital', 'branding', 'illustration'],
    description:
      'I joined Supabase in 2022 as the sole brand designer, defining the brand across all touchpoints for more than two years as the company grew from about 40 to 150 people. Designed across the full site, from homepage and product pages to careers and Launch Week pages 5 through 12, alongside product diagrams, iconography, merch for Launch Week and company offsites, and sales decks and company pitches. Essentially I designed whatever was needed to support the team, land each release, and keep the brand moving forward.',
    link: 'https://supabase.com',
    tags: ['Figma', '© 2022–2023'],
    aspect: 0.45,
  },
  {
    type: 'project',
    title: 'Supabase Launch Week 12',
    slug: 'supabase-launch-week-12',
    preview: SupabaseLW12Preview,
    images: [
      SupabaseLW1202,
      SupabaseLW12Grid,
      {
        type: 'image',
        src: SupabaseLW12Tickets,
        caption:
          'Figma exploration of Launch Week 12 ticket colorways, each framed as a Supabase query and its response.',
      },
      SupabaseLW1201,
      SupabaseLW1203,
      SupabaseLW1204,
      SupabaseLW1205,
      SupabaseLW1206,
    ],
    filters: ['digital', 'branding'],
    description:
      'Supabase Launch Week 12 was a week of product announcements, with each day unlocking new features the team had been building for months, accompanied by visuals, diagrams, blog posts, merch, and community meetups.',
    link: 'https://supabase.com',
    links: [
      {
        href: 'https://web.archive.org/web/20240823175303/https://supabase.com/launch-week',
        label: 'Web Archive for supabase.com/launch-week',
      },
    ],
    tags: ['Figma', '© 2024'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'Supabase Launch Week 8',
    slug: 'supabase-launch-week-8',
    preview: Stars,
    previewUnoptimized: true,
    images: [
      SupabaseLW8PostLaunch,
      SupabaseLW8,
      SupabaseLW81,
      SupabaseLW82,
      SupabaseLW83,
      {
        type: 'row',
        items: [SupabaseLW8OgDay2, SupabaseLW8OgDay5],
      },
      {
        type: 'row',
        items: [SupabaseLW8OgDay3, SupabaseLW8OgDay4],
      },
    ],
    filters: ['digital', 'branding'],
    description:
      'Supabase Launch Week 8 was a week-long event packed with product updates, community announcements, meetups, daily video drops, and live Discord hangouts, a showcase of recent work and a chance to push the brand’s visual boundaries.',
    link: 'https://supabase.com',
    tags: ['Figma', '© 2023'],
    aspect: 0.7,
  },

  {
    type: 'project',
    title: 'Supabase Launch Week 7 Branding',
    slug: 'supabase-lw7',
    images: [SupabaseLW71, SupabaseLW72, SupabaseLW73, SupabaseLW74, SupabaseLW75, SupabaseLW76],
    preview: SupabaseLW7,
    filters: ['branding', 'digital'],
    description:
      'Supabase Launch Week 7 was a week of product updates and new feature announcements. For this edition I created Midjourney visuals that were later spun into 400+ unique designs for each Launch Week ticket.',
    link: 'https://supabase.com',
    aspect: 1,
    tags: ['Figma', 'Midjourney', '© 2023'],
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
    link: 'https://infinum.com',
    tags: ['Adobe Illustrator', '© 2022'],
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
    hidden: true,
    type: 'component',
    content: <SupabaseCard />,
    filters: ['branding', 'digital'],
  },

  {
    type: 'project',
    title: 'Infinum Merch',
    slug: 'infinum-swag',
    preview: InfinumMerch00,
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
];
