import Link from 'next/link';

import MousePositionVarsSetter from '~/src/components/MousePositionVarsSetter';
import Button from '~/src/components/ui/Button';

import {
  BioCard,
  BukaCard,
  CodeCard,
  ColorThemeCard,
  NotesCard,
  PantoneCard,
  PhotosCardWebgl,
  SketchbookCard,
  SkewedStampsCard,
  SneakPeekCard,
  StatusCard,
  ToolsCreatedCard,
  WorkspaceCard,
} from './components';
import Header from './components/Header';
import Heading from './components/Heading';

import './page.css';

import { Metadata } from 'next';

import SystemMetricsCollector from '~/src/lib/SystemMetricsCollector';
import { preloadImage } from '~/src/util';

import { photosAtlas } from './components/PhotosCardWebgl/atlas';
import { Filter } from './work/constants';

type FilterHref = `/work?f=${Filter}`;

const projectLinks: Array<{ label: string; href: FilterHref }> = [
  { label: 'Branding', href: '/work?f=branding' },
  { label: 'Digital', href: '/work?f=digital' },
  { label: 'Illustration', href: '/work?f=illustration' },
];

const getCards = () => [
  { gridArea: '👋', Component: BioCard },
  { gridArea: '💯', Component: BukaCard },
  { gridArea: '💬', Component: StatusCard },
  { gridArea: '📌', Component: WorkspaceCard },
  { gridArea: '🖌️', Component: PantoneCard },
  { gridArea: '🎨', Component: ColorThemeCard },
  { gridArea: '👀', Component: SneakPeekCard },
  { gridArea: '🖼️', Component: PhotosCardWebgl },
  { gridArea: '🧪', Component: CodeCard },
  { gridArea: '🔧', Component: ToolsCreatedCard },
  { gridArea: '👩‍💻', Component: SketchbookCard },
  { gridArea: '💌', Component: SkewedStampsCard },
  { gridArea: '📝', Component: NotesCard },
];

export const metadata: Metadata = {
  title: 'About | Marijana Pavlinić',
  description:
    'Designer and Illustrator working remotely from Croatia, deep diving into all things digital, crafting websites and brands.',
};

export default async function Home() {
  preloadImage(photosAtlas.src);
  const metrics = await SystemMetricsCollector.collect();

  return (
    <div>
      <Header />
      <MousePositionVarsSetter />
      <div className="glow pointer-events-none fixed h-[400px] w-[400px] rounded-full blur-3xl" />
      <div className="flex flex-col px-5 py-5 md:py-12">
        <main className="pb-12">
          <Heading className="mb-8" />
          <div className="text-text-primary xxs:flex-row xxs:items-center xxs:gap-4 mb-20 flex flex-col items-start gap-2">
            <div>What I do</div>
            <div className="flex gap-2">
              {projectLinks.map(({ label, ...linkProps }) => (
                <Button size="sm" asChild key={label}>
                  <Link {...linkProps}>{label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="home-cards">
            {getCards().map(({ gridArea, Component }, i) => (
              <div key={i} style={{ gridArea }}>
                <Component currentCount={metrics.counters.sneakPeekActions} metrics={metrics} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
