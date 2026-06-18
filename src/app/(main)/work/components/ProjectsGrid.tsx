'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';
import { cn } from '~/src/util';

import { Project, projectGridPreviewSizes } from '../constants';
import Card from './Card';

import './ProjectsGrid.css';

type Props = {
  projects: Project[];
};

export default function ProjectsGrid({ projects }: Props) {
  const titleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);

  function setTitleHeight(i: number) {
    cardRefs.current
      .get(i)
      ?.style.setProperty(
        '--title-height',
        titleRefs.current.get(i)?.clientHeight?.toString() || '0',
      );
  }

  useEffect(() => {
    cardRefs.current.forEach((_, i) => {
      setTitleHeight(i);
    });
  }, []);

  return (
    <div
      className="grid flex-1 grid-cols-1 gap-5 px-5 py-10 *:aspect-4/3 sm:grid-cols-2"
      ref={containerRef}
    >
      <DynamicVHVarsSetter />

      {projects.map((project, i) => {
        return project.type === 'project' ? (
          <Link
            key={project.slug}
            href={`/work/${project.slug}?view=grid`}
            style={{ '--projects-grid-card-index': i } as CSSProperties}
            className={cn(
              'projects-grid-card relative flex w-full rounded-lg text-left grayscale-100 hover:grayscale-0 focus-visible:grayscale-0 md:rounded-2xl',
              {
                group: !project.hidden,
                'group/hidden cursor-default': project.hidden,
              },
            )}
          >
            <Card
              ref={(e) => {
                cardRefs.current.set(i, e!);
              }}
              containerClassName="h-full w-full"
              className="h-full w-full overflow-hidden"
            >
              <div className="h-full w-full translate-y-0 overflow-hidden rounded transition-all duration-300 group-hover:translate-y-[calc(var(--title-height)*-1px)] group-focus-visible:translate-y-[calc(var(--title-height)*-1px)] md:rounded-lg">
                <div className="relative h-full w-full translate-y-0 overflow-hidden rounded transition-all duration-300 group-hover:translate-y-[calc(var(--title-height)*1px)] group-hover/hidden:blur-[2px] group-focus-visible:translate-y-[calc(var(--title-height)*1px)] group-focus-visible/hidden:blur-[2px] md:rounded-xl">
                  <Image
                    alt={project.title}
                    src={project.preview}
                    quality={100}
                    fill
                    className="object-cover object-top group-hover/hidden:opacity-50 group-focus-visible/hidden:opacity-50"
                    sizes={projectGridPreviewSizes}
                    priority={i < 3}
                  />
                </div>
              </div>
              <div
                className="title title text-text-primary absolute bottom-0 left-0 w-full translate-y-full rounded-tl-md rounded-tr-md p-2 px-3 transition-all duration-300 group-hover:translate-y-[-4px] group-focus-visible:translate-y-[-4px]"
                ref={(e) => {
                  titleRefs.current.set(i, e!);
                }}
              >
                {project.title}
              </div>
              <Tag className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs whitespace-nowrap opacity-0 transition-all duration-300 group-hover/hidden:opacity-100 group-focus-visible/hidden:opacity-100 sm:text-sm">
                Coming Soon
              </Tag>
            </Card>
          </Link>
        ) : project.type === 'component' ? (
          <div
            style={{ '--projects-grid-card-index': i } as CSSProperties}
            className="projects-grid-card group group relative flex"
            key={i}
          >
            {project.content}
          </div>
        ) : null;
      })}
    </div>
  );
}
