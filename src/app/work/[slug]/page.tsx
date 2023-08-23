import { StaticImageData } from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import { LinkIcon } from '~/src/components/icons';
import MousePositionVarsSetter from '~/src/components/MousePositionVarsSetter';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';
import ViewLogger from '~/src/components/ViewCounter';

import Divider from '../components/Divider';
import { projects, StaticProject } from '../constants';
import Gallery, { GalleryTrigger } from './components/Gallery';
import PaginationCard from './components/PaginationCard';

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

export default function Work({ params }: { params: { slug: string } }) {
  const project = projects
    .filter((p) => p.type === 'project')
    .filter((p) => process.env.NODE_ENV === 'development' || !p.hidden)
    .find((p) => 'slug' in p && p.slug === params?.slug) as StaticProject;

  const associatedProjects = projects.filter(
    (p) => p.type === 'project' && !p.hidden && intersection(p.tags, project.tags).length > 0,
  ) as StaticProject[];
  const projectIndex = associatedProjects.findIndex((p) => p.slug === project.slug);
  const previousProject = projectIndex > 0 && associatedProjects[projectIndex - 1];
  const nextProject =
    projectIndex < associatedProjects.length - 1 && associatedProjects[projectIndex + 1];

  if (!project) {
    notFound();
  }

  const allImages = project.blocks?.flat().filter((e) => 'src' in (e as any)) as StaticImageData[];

  return (
    <>
      {project.slug && <ViewLogger pathname={`/work/${project.slug}`} />}
      <DynamicVHVarsSetter />
      <MousePositionVarsSetter />
      <div className="flex-1 px-5 py-10 [html:has(&)_footer>*:not(.nav)]:invisible">
        <Heading className="mb-2 max-w-xl text-left text-5xl">{project.title}</Heading>
        <p className="max-w-xl text-left">{project.description}</p>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center ">
          {(project.tags?.length || 0) > 0 && (
            <div className="justify-left flex flex-wrap gap-2">
              {project.tags?.map((t, i) => (
                <Tag key={i} className="text-sm">
                  {t}
                </Tag>
              ))}
            </div>
          )}
          {project.link && (
            <Tag asChild>
              <a
                className="flex items-center gap-2 text-sm"
                href={project.link}
                target="_blank"
                rel="noreferrer noopener"
              >
                {hostname(project.link)}
                <LinkIcon className="h-5 w-5" />
              </a>
            </Tag>
          )}
        </div>
        <Gallery sources={allImages}>
          <div className="mt-[80px] flex flex-col gap-2 md:gap-4">
            {project.blocks?.map((block, blockI) => {
              const isImageBlock = block.every((e) => 'src' in (e as any));
              if (isImageBlock) {
                return (
                  <div className="justify-left flex gap-2 md:gap-4" key={blockI}>
                    {(block as StaticImageData[]).map((e, i, items) => (
                      <div key={i} className="max-h-[700px] flex-1 [&:only-child_img]:object-cover">
                        <GalleryTrigger
                          key={i}
                          at={allImages.findIndex(
                            (e) => e.src === (block as StaticImageData[])[i].src,
                          )}
                        >
                          <Image
                            priority={blockI === 0}
                            src={e}
                            alt=""
                            sizes={genImageSizes(items.length)}
                            className="m-auto max-h-full w-full object-cover focus-within:outline-main-theme-1"
                          />
                        </GalleryTrigger>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="my-8" key={blockI}>
                  {(block as ReactNode[]).map((e, i) => e)}
                </div>
              );
            })}
          </div>
        </Gallery>
        <Divider className="mt-24 text-center text-sm">{project.title}</Divider>
        <div className="m-auto mt-20 flex max-w-3xl flex-col gap-9">
          {previousProject || nextProject ? (
            <Heading className="text-center text-4xl" as="h2">
              Explore other projects
            </Heading>
          ) : null}
          <div className="flex flex-col justify-center gap-6 md:flex-row md:[&>*]:max-w-[400px]">
            {previousProject && (
              <Link href={`/work/${previousProject.slug}`} className="flex-1 rounded-xl">
                <PaginationCard direction="left" project={previousProject} />
              </Link>
            )}
            {nextProject && (
              <Link href={`/work/${nextProject.slug}`} className="flex-1 rounded-xl">
                <PaginationCard direction="right" project={nextProject} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
