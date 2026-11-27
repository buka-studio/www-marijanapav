import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import Image from '~/src/components/ui/Image';

import {
  MediaBackdrop,
  ProjectMedia,
  ProjectMediaItem,
  projects,
  StaticProject,
} from '../constants';

import { SkyRecursion } from './components/sky-recursion/SkyRecursion';
import { SpeechHighlight } from './components/SpeechHighlight';
import { ProjectHeader } from './ProjectHeader';
import { ProjectLinks } from './ProjectLinks';

function hostname(url: string): string {
  const { hostname, pathname } = new URL(url);
  const path = pathname === '/' ? '' : pathname.replace(/\/$/, '');

  return `${hostname}${path}`;
}

function normalizeProjectLink(link: string | { href: string; label: string }): {
  href: string;
  label: string;
} {
  if (typeof link === 'string') {
    return { href: link, label: hostname(link) };
  }

  return link;
}

function intersection<T>(a: T[] = [], b: T[] = []): T[] {
  const s1 = new Set(b);

  return a.filter((x) => s1.has(x));
}

function getWorkHref(view: string | undefined): string {
  return `/work?view=${view === 'list' ? 'list' : 'grid'}`;
}

function isProjectRow(media: ProjectMedia): media is Extract<ProjectMedia, { type: 'row' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'row';
}

function isProjectVideo(
  media: ProjectMediaItem,
): media is Extract<ProjectMediaItem, { type: 'video' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'video';
}

function isProjectSpeech(
  media: ProjectMediaItem,
): media is Extract<ProjectMediaItem, { type: 'speech' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'speech';
}

function isProjectSkyRecursion(
  media: ProjectMediaItem,
): media is Extract<ProjectMediaItem, { type: 'sky-recursion' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'sky-recursion';
}

function isProjectImage(
  media: ProjectMediaItem,
): media is Extract<ProjectMediaItem, { type: 'image' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'image';
}

// Justified rows: each column is as wide as its image's aspect ratio, so all items share one height.
function rowColumns(items: ProjectMediaItem[]): string {
  const ratios = items.map((it) => {
    const img = isProjectImage(it) ? it.src : typeof it === 'object' && 'width' in it ? it : null;
    return img ? img.width / img.height : 1;
  });
  return ratios.map((r) => `minmax(0, ${r.toFixed(4)}fr)`).join(' ');
}

const mediaSizes =
  '(min-width: 1536px) 1064px, (min-width: 1024px) calc(100vw - 472px), calc(100vw - 40px)';
const rowMediaSizes =
  '(min-width: 1536px) 522px, (min-width: 1024px) calc((100vw - 492px) / 2), (min-width: 640px) calc((100vw - 60px) / 2), calc(100vw - 40px)';

function MediaCaption({ children }: { children: ReactNode }) {
  return (
    <figcaption className="pb-4">
      <span className="border-text-muted text-text-secondary block border-l pl-2 text-left text-xs text-pretty">
        {children}
      </span>
    </figcaption>
  );
}

// Theme-aware backdrop drawn in code, so assets can ship without a baked-in background.
function Backdrop({ backdrop, children }: { backdrop?: MediaBackdrop; children: ReactNode }) {
  if (!backdrop) return children;

  return (
    <div
      className={`bg-panel-overlay flex w-full justify-center ${backdrop.align === 'end' ? 'items-end' : 'items-center'}`}
      style={{ aspectRatio: backdrop.aspectRatio }}
    >
      {children}
    </div>
  );
}

// Subtle hairline for dark assets that would otherwise bleed into the dark page.
const darkBorder = 'border-[0.5px] border-theme-3/60';

function ProjectMediaFigure({
  item,
  priority = false,
  sizes = mediaSizes,
}: {
  item: ProjectMediaItem;
  priority?: boolean;
  sizes?: string;
}) {
  if (isProjectSkyRecursion(item)) {
    return (
      <figure className="flex min-w-0 flex-col gap-2">
        <SkyRecursion />
        {item.caption && <MediaCaption>{item.caption}</MediaCaption>}
      </figure>
    );
  }

  if (isProjectSpeech(item)) {
    return (
      <figure className="flex min-w-0 flex-col gap-2">
        <SpeechHighlight src={item.src} lines={item.lines} />
        {item.caption && <MediaCaption>{item.caption}</MediaCaption>}
      </figure>
    );
  }

  if (isProjectVideo(item)) {
    return (
      <figure className="flex min-w-0 flex-col gap-2">
        <Backdrop backdrop={item.backdrop}>
          <video
            src={item.src}
            className={`${item.backdrop ? 'h-auto' : 'max-h-full w-full object-cover'} ${item.border ? darkBorder : ''}`}
            style={item.backdrop ? { width: item.backdrop.width } : undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        </Backdrop>
        {item.caption && <MediaCaption>{item.caption}</MediaCaption>}
      </figure>
    );
  }

  const image = isProjectImage(item) ? item.src : item;
  const caption = isProjectImage(item) ? item.caption : undefined;
  const backdrop = isProjectImage(item) ? item.backdrop : undefined;
  const border = isProjectImage(item) && item.border ? darkBorder : '';

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <Backdrop backdrop={backdrop}>
        <Image
          priority={priority}
          src={image}
          alt={caption ?? ''}
          quality={90}
          sizes={sizes}
          placeholder={image.blurDataURL && !backdrop ? 'blur' : 'empty'}
          className={`${
            backdrop
              ? 'focus-within:outline-theme-1 h-auto'
              : 'focus-within:outline-theme-1 max-h-full w-full object-cover'
          } ${border}`}
          style={backdrop ? { width: backdrop.width } : undefined}
        />
      </Backdrop>
      {caption && <MediaCaption>{caption}</MediaCaption>}
    </figure>
  );
}

export default async function Work({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;
  const workHref = getWorkHref(view);

  const project = projects
    .filter((p) => p.type === 'project')
    .filter((p) => process.env.NODE_ENV === 'development' || !p.hidden)
    .find((p) => 'slug' in p && p.slug === slug) as StaticProject;

  const associatedProjects = projects.filter(
    (p) => p.type === 'project' && !p.hidden && intersection(p.tags, project.tags).length > 0,
  ) as StaticProject[];
  const projectIndex = associatedProjects.findIndex((p) => p.slug === project.slug);

  if (!project) {
    notFound();
  }

  const media = project.images ?? [];
  const projectLinks = [...(project.link ? [project.link] : []), ...(project.links ?? [])].map(
    normalizeProjectLink,
  );

  return (
    <>
      <DynamicVHVarsSetter />
      <div className="grid flex-1 grid-cols-1 gap-8 px-5 py-10 pb-[200px] lg:grid-cols-[400px_1fr] [html:has(&)_footer>*:not(.nav)]:invisible">
        <div className="top-[100px] flex h-full max-h-[calc(100dvh-200px)] flex-col lg:sticky">
          <ProjectHeader title={project.title} backHref={workHref} />
          <div
            className="scroll-fade-y scrollbar-thumb-theme-2 flex min-h-0 scrollbar-thin scrollbar-track-transparent flex-col gap-3 overflow-x-hidden overflow-y-auto"
          >
            <div className="text-text-secondary max-w-xl space-y-3 text-left text-sm text-pretty">
              {project.description}
            </div>
            <ProjectLinks links={projectLinks} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {media.map((item, i) => {
            if (isProjectRow(item)) {
              return (
                <figure key={i} className="flex min-w-0 flex-col gap-2">
                  <div
                    className="gap-3 sm:gap-5"
                    style={{ display: 'grid', gridTemplateColumns: rowColumns(item.items) }}
                  >
                    {item.items.map((rowItem, rowIndex) => (
                      <ProjectMediaFigure key={rowIndex} item={rowItem} sizes={rowMediaSizes} />
                    ))}
                  </div>
                  {/* Caption spanning the whole row */}
                  {item.caption && <MediaCaption>{item.caption}</MediaCaption>}
                </figure>
              );
            }

            return (
              <ProjectMediaFigure key={i} item={item} priority={i === 0} />
            );
          })}
        </div>
      </div>
    </>
  );
}
