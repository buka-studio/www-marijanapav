import Link from 'next/link';

import MousePositionVarsSetter from '~/src/components/MousePositionVarsSetter';
import Button from '~/src/components/ui/Button';
import ViewCounter from '~/src/components/ViewCounter';

import {
  BioCard,
  BukaCard,
  CodeCard,
  ColorThemeCard,
  ExperienceCard,
  NotesCard,
  PantoneCard,
  PhotosCard,
  SketchbookCard,
  SneakPeekCard,
  StampsCard,
  ToolsCard,
  WorkspaceCard,
} from './components';
import Header from './components/Header';
import Heading from './components/Heading';

import './page.css';

import { Filter } from './work/constants';

type FilterHref = `/work?f=${Filter}`;

const projectLinks: Array<{ label: string; href: FilterHref }> = [
  { label: 'Branding', href: '/work?f=branding' },
  { label: 'Digital', href: '/work?f=digital' },
  { label: 'Illustration', href: '/work?f=illustration' },
];

const getCards = ({ sketchbookCard }: { sketchbookCard: boolean }) => [
  { gridArea: '👋', Component: BioCard },
  { gridArea: '👔', Component: ExperienceCard },
  { gridArea: '📌', Component: WorkspaceCard },
  { gridArea: '🖌️', Component: PantoneCard },
  { gridArea: '🎨', Component: ColorThemeCard },
  { gridArea: '👀', Component: SneakPeekCard },
  { gridArea: '🖼️', Component: PhotosCard },
  { gridArea: '💯', Component: BukaCard },
  { gridArea: '🧪', Component: CodeCard },
  { gridArea: '👩‍💻', Component: sketchbookCard ? SketchbookCard : ToolsCard },
  { gridArea: '💌', Component: StampsCard },
  { gridArea: '📝', Component: NotesCard },
];

const fetchSneakPeekCount = () =>
  fetch(
    process.env.NEXT_PUBLIC_HOST +
      '/api/stats?' +
      new URLSearchParams([
        ['pathname', '/#sneak-peek'],
        ['type', 'action'],
      ]),
    { cache: 'no-store' },
  )
    .then((res) => res.json())
    .then((res) => res.count)
    .catch((e) => {
      console.error(e);
      return 0;
    });

export const metadata = {
  title: 'About | Marijana Pavlinić',
  description:
    'Designer and Illustrator working remotely from Croatia, deep diving into all things digital, crafting websites and brands.',
};

export default async function Home() {
  const currentCount = await fetchSneakPeekCount();

  return (
    <div>
      <Header />
      <ViewCounter pathname="/" />
      <MousePositionVarsSetter />
      <div className="glow pointer-events-none fixed h-[400px] w-[400px] rounded-full blur-3xl" />
      <div className="flex flex-col px-5 py-5 md:py-12">
        <main className="pb-12">
          <Heading className="mb-8" />
          <div className="mb-20 flex flex-col items-start gap-2 text-text-primary xxs:flex-row xxs:items-center xxs:gap-4">
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
            {getCards({ sketchbookCard: true }).map(({ gridArea, Component }, i) => (
              <div key={i} style={{ gridArea }}>
                <Component currentCount={currentCount} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
