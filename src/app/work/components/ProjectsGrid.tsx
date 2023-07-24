'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import Image from '~/src/components/ui/Image';
import useMatchMedia from '~/src/hooks/useMatchMedia';

import { Project } from '../constants';
import Card from './Card';

type Props = {
  projects: Project[];
};

// todo: figure out a css native masonry layout that works well with ssr
// function transpose(matrix: any[][]): any[][] {
//   return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
// }

// function chunk(array: any[], size: number): any[][] {
//   const chunked_arr = [];
//   let index = 0;
//   while (index < array.length) {
//     chunked_arr.push(array.slice(index, size + index));
//     index += size;
//   }
//   return chunked_arr;
// }

export default function ProjectsGrid({ projects }: Props) {
  const titleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const mobile = useMatchMedia('(max-width: 768px)', false);

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
    <div className="flex-1 px-5 py-10">
      <ResponsiveMasonry columnsCountBreakPoints={{ 750: 2, 900: 3, 1200: 4 }}>
        <Masonry gutter={mobile ? '0.5rem' : '1rem'}>
          {projects.map((project, i) =>
            project.type === 'project' ? (
              <Link passHref legacyBehavior key={project.slug} href={`/work/${project.slug}`}>
                <motion.a
                  initial={{ translateY: 75, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  exit={{ translateY: 75, opacity: 0 }}
                  transition={{
                    ease: 'easeOut',
                    duration: 0.5,
                    delay: i * 0.1,
                  }}
                  onAnimationComplete={() => setTitleHeight(i)}
                  className="group group relative flex rounded-2xl"
                  style={{ aspectRatio: project.aspect || 'initial' }}
                >
                  <Card
                    ref={(e) => {
                      cardRefs.current.set(i, e!);
                    }}
                    containerClassName="h-full w-full"
                    className="h-full w-full overflow-hidden"
                  >
                    <div className="h-full w-full translate-y-0 overflow-hidden rounded-lg transition-all duration-300 group-hover:translate-y-[calc(var(--title-height)*-1px)] group-focus-visible:translate-y-[calc(var(--title-height)*-1px)]">
                      <div className="relative h-full w-full translate-y-0 overflow-hidden rounded-lg transition-all duration-300 group-hover:translate-y-[calc(var(--title-height)*1px)] group-focus-visible:translate-y-[calc(var(--title-height)*1px)]">
                        <Image
                          alt={project.description || ''}
                          src={project.preview}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 900px): 50vw, (max-width: 1200px) 33vw, 320px"
                          priority={i < 4}
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
                  </Card>
                </motion.a>
              </Link>
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
            ) : null,
          )}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
}
