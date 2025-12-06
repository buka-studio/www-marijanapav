'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ComponentType, useEffect, useRef, useState } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import DynamicVHVarsSetter from '~/src/components/DynamicVHVarsSetter';
import { ExitIcon, LinkIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '~/src/components/ui/Dialog';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';
import { useViewLogger } from '~/src/components/ViewCounter';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

import { Project } from '../constants';
import Card from './Card';
import Carousel from './Carousel';

const dynamicProjects: Record<string, ComponentType> = {
  'illustrated-cards': dynamic(() => import('../[slug]/components/Cards'), {
    loading: () => <p>Loading...</p>,
  }),
};

function hostname(url: string): string {
  return new URL(url).hostname;
}

type Props = {
  projects: Project[];
};

export default function ProjectsGrid({ projects }: Props) {
  const titleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const mobile = useMatchMedia('(max-width: 768px)', false);
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

  const [openProject, setOpenProject] = useState<string>('');
  useViewLogger(openProject);

  return (
    <div className="flex-1 px-5 py-10" ref={containerRef}>
      <DynamicVHVarsSetter />
      <ResponsiveMasonry columnsCountBreakPoints={{ 750: 2, 900: 3 }}>
        <Masonry gutter={mobile ? '0.5rem' : '1rem'}>
          {projects.map((project, i) => {
            const DynamicComponent =
              project.type === 'project' && project.dynamic ? dynamicProjects[project.slug!] : null;

            return project.type === 'project' ? (
              <Dialog
                key={project.slug}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenProject(project.slug!);
                  }
                }}
              >
                <DialogContent className="flex h-full max-h-[calc(var(--vh,1vh)*100)] max-w-(--breakpoint-md) flex-col pb-6 sm:rounded-[20px] md:max-h-[min(calc(var(--vh,1vh)*100),800px)]">
                  <div
                    className={cn('-mx-3 h-[90vw] md:h-auto md:flex-1', {
                      '-mt-3 h-auto': Boolean(DynamicComponent),
                    })}
                  >
                    {DynamicComponent ? (
                      <div className="relative h-full">
                        <DynamicComponent />
                        <DialogClose aria-label="Close dialog" asChild>
                          <Button
                            iconLeft={<ExitIcon className="h-6 w-6" />}
                            className="absolute right-5 top-5 opacity-50 group-hover/card:opacity-100 focus-visible:opacity-100"
                          />
                        </DialogClose>
                      </div>
                    ) : (
                      <Carousel
                        className=""
                        defaultIndex={0}
                        sources={project.images!}
                        actions={
                          <DialogClose aria-label="Close dialog" asChild>
                            <Button
                              iconLeft={<ExitIcon className="h-6 w-6" />}
                              className="opacity-50 group-hover/card:opacity-100 focus-visible:opacity-100"
                            />
                          </DialogClose>
                        }
                      />
                    )}
                  </div>

                  <div className="flex flex-col overflow-auto md:overflow-auto">
                    <div>
                      <DialogTitle className="mb-4">{project.title}</DialogTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        {project.tags?.map((t) => (
                          <Tag key={t} className="text-sm text-text-secondary">
                            {t}
                          </Tag>
                        ))}
                        {project.link && (
                          <Tag asChild>
                            <a
                              className="flex items-center gap-2 text-sm underline"
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
                    </div>
                    {project.description && (
                      <DialogDescription className="mt-4 overflow-auto border-t border-t-theme-2 pt-4 leading-7 text-text-secondary md:max-h-[200px]">
                        {project.description}
                      </DialogDescription>
                    )}
                  </div>
                </DialogContent>
                <DialogTrigger asChild disabled={!Boolean(project.images) && !project.dynamic}>
                  <motion.button
                    key={project.slug}
                    initial={{ translateY: 75, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    exit={{ translateY: 75, opacity: 0 }}
                    transition={{
                      ease: 'easeOut',
                      duration: 0.5,
                      delay: i * 0.1,
                    }}
                    onAnimationComplete={() => setTitleHeight(i)}
                    className={cn('relative flex w-full rounded-lg text-left md:rounded-2xl', {
                      group: !project.hidden,
                      'group/hidden cursor-default': project.hidden,
                    })}
                    style={{ aspectRatio: project.aspect || 'initial' }}
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
                            sizes="(max-width: 900px): 50vw, (max-width: 1200px) 33vw, 420px"
                            priority={i < 3}
                          />
                        </div>
                      </div>
                      <div
                        className="title title absolute bottom-0 left-0 w-full translate-y-full rounded-tl-md rounded-tr-md p-2 px-3 text-text-primary transition-all duration-300 group-hover:translate-y-[-4px] group-focus-visible:translate-y-[-4px]"
                        ref={(e) => {
                          titleRefs.current.set(i, e!);
                        }}
                      >
                        {project.title}
                      </div>
                      <Tag className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs opacity-0 transition-all duration-300 group-hover/hidden:opacity-100 group-focus-visible/hidden:opacity-100 sm:text-sm">
                        Coming Soon
                      </Tag>
                    </Card>
                  </motion.button>
                </DialogTrigger>
              </Dialog>
            ) : project.type === 'component' ? (
              <motion.div
                initial={{ translateY: 100, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{
                  type: 'tween',
                  ease: 'easeOut',
                  duration: 0.35,
                  delay: i * 0.1,
                }}
                exit={{ translateY: 100, opacity: 0 }}
                className="group group relative flex"
                key={i}
              >
                {project.content}
              </motion.div>
            ) : null;
          })}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
}
