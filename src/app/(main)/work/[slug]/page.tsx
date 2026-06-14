import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { StaticImageData } from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';

import { projects, StaticProject } from '../constants';

function hostname(url: string): string {
  return new URL(url).hostname;
}

function intersection<T>(a: T[] = [], b: T[] = []): T[] {
  const s1 = new Set(b);

  return a.filter((x) => s1.has(x));
}

function genImageSizes(length: number): string {
  return `(max-width: 1360px) ${Math.round(100 / length)}vw, ${Math.round(1360 / length)}px`;
}

function getWorkHref(view: string | undefined): string {
  return `/work?view=${view === 'list' ? 'list' : 'grid'}`;
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

  const allImages = project.images?.flat().filter((e) => 'src' in (e as any)) as StaticImageData[];

  return (
    <>
      <DynamicVHVarsSetter />
      <div className="grid flex-1 grid-cols-1 gap-8 px-5 py-10 pb-[200px] lg:grid-cols-[400px_1fr] [html:has(&)_footer>*:not(.nav)]:invisible">
        <div className="top-[100px] flex h-full max-h-[calc(100dvh-200px)] gap-3 lg:sticky">
          <Link href={workHref} className="mt-1.5">
            <ArrowLeftIcon className="size-5" />
          </Link>

          <div className="flex flex-col">
            <Heading className="mb-1 max-w-xl text-left text-lg text-pretty">
              {project.title}
            </Heading>
            <div className="scroll-fade-y scrollbar-thumb-theme-2 min-h-0 scrollbar-thin scrollbar-track-transparent overflow-x-hidden overflow-y-auto">
              <p className="text-text-secondary max-w-xl text-left text-sm text-pretty">
                {project.description}
              </p>
            </div>
            <div className="mt-auto flex flex-col items-start justify-between gap-3 pt-5 sm:flex-row sm:items-center">
              {project.link && (
                <a
                  className="flex items-center gap-2 text-sm"
                  href={project.link}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {hostname(project.link)}
                  <LinkIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {allImages.map((e, i) => {
            return (
              <Image
                key={i}
                priority={i === 0}
                src={e}
                alt=""
                className="focus-within:outline-theme-1 max-h-full w-full object-cover"
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
