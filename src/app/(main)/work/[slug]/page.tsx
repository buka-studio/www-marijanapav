import { ArrowLeftIcon, ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import Image from '~/src/components/ui/Image';

import { ProjectMedia, ProjectMediaItem, projects, StaticProject } from '../constants';

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

function isProjectImage(
  media: ProjectMediaItem,
): media is Extract<ProjectMediaItem, { type: 'image' }> {
  return typeof media === 'object' && 'type' in media && media.type === 'image';
}

const mediaSizes =
  '(min-width: 1536px) 1064px, (min-width: 1024px) calc(100vw - 472px), calc(100vw - 40px)';
const rowMediaSizes =
  '(min-width: 1536px) 522px, (min-width: 1024px) calc((100vw - 492px) / 2), (min-width: 640px) calc((100vw - 60px) / 2), calc(100vw - 40px)';

function ProjectMediaFigure({
  item,
  priority = false,
  sizes = mediaSizes,
}: {
  item: ProjectMediaItem;
  priority?: boolean;
  sizes?: string;
}) {
  if (isProjectVideo(item)) {
    return (
      <figure className="flex min-w-0 flex-col gap-2">
        <video
          src={item.src}
          className="max-h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
        {item.caption && (
          <figcaption className="text-text-secondary text-center text-xs text-pretty">
            {item.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const image = isProjectImage(item) ? item.src : item;
  const caption = isProjectImage(item) ? item.caption : undefined;

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <Image
        priority={priority}
        src={image}
        alt={caption ?? ''}
        quality={90}
        sizes={sizes}
        placeholder={image.blurDataURL ? 'blur' : 'empty'}
        className="focus-within:outline-theme-1 max-h-full w-full object-cover"
      />
      {caption && (
        <figcaption className="text-text-secondary text-center text-xs text-pretty">
          {caption}
        </figcaption>
      )}
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
          <div className="flex items-center gap-3">
            <Link href={workHref} className="shrink-0">
              <ArrowLeftIcon className="size-5" />
            </Link>
            <h1 className="max-w-xl text-left text-sm font-medium text-pretty text-foreground">
              {project.title}
            </h1>
          </div>
          <div className="scroll-fade-y scrollbar-thumb-theme-2 mt-1 flex min-h-0 scrollbar-thin scrollbar-track-transparent flex-col gap-3 overflow-x-hidden overflow-y-auto pl-8">
            <div className="text-text-secondary max-w-xl space-y-3 text-left text-sm text-pretty">
              {project.description}
            </div>
            {projectLinks.length > 0 && (
              <div className="border-theme-3 divide-theme-3 divide-y border-y">
                {projectLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group/link hover:bg-theme-4 focus-visible:bg-theme-4 relative z-20 flex w-full items-center justify-between gap-3 py-1.5 pr-2 pl-0 text-sm text-white outline-offset-2 transition-[padding,background-color] duration-150 hover:pl-1 hover:text-white focus-visible:pl-1 focus-visible:text-white focus-visible:outline-none!"
                  >
                    <span className="truncate">{label}</span>
                    <ArrowUpRightIcon className="size-3 shrink-0 translate-x-1 opacity-0 blur-[2px] transition-all duration-150 group-hover/link:translate-x-0 group-hover/link:opacity-100 group-hover/link:blur-none group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100 group-focus-visible/link:blur-none" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {media.map((item, i) => {
            if (isProjectRow(item)) {
              return (
                <div key={i} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {item.items.map((rowItem, rowIndex) => (
                    <ProjectMediaFigure key={rowIndex} item={rowItem} sizes={rowMediaSizes} />
                  ))}
                </div>
              );
            }

            return <ProjectMediaFigure key={i} item={item} priority={i === 0} />;
          })}
        </div>
      </div>
    </>
  );
}
