'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import Image from '~/src/components/ui/Image';

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

  return (
    <div className="flex-1 py-10 px-5">
      <ResponsiveMasonry columnsCountBreakPoints={{ 750: 2, 900: 3, 1200: 4 }}>
        <Masonry gutter="1rem">
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
                  onAnimationComplete={() => {
                    cardRefs.current
                      .get(i)
                      ?.style.setProperty(
                        '--title-height',
                        titleRefs.current.get(i)?.clientHeight?.toString() || '0',
                      );
                  }}
                  className=" rounded-2xl relative group flex group"
                  style={{ aspectRatio: project.aspect || 'initial' }}
                >
                  <Card
                    ref={(e) => {
                      cardRefs.current.set(i, e!);
                    }}
                    containerClassName="h-full w-full"
                    className="h-full w-full overflow-hidden"
                  >
                    <div className="overflow-hidden rounded-lg w-full h-full group-hover:translate-y-[calc(var(--title-height)*-1px)] transition-all duration-300 translate-y-0">
                      <div className="group-hover:translate-y-[calc(var(--title-height)*1px)] transition-all duration-300 translate-y-0 h-full w-full rounded-lg overflow-hidden">
                        <Image
                          alt={project.description || ''}
                          src={project.preview}
                          fill
                          className="object-cover object-top "
                        />
                      </div>
                    </div>

                    <div
                      className="title text-text-primary px-3 left-0 p-2 group-hover:translate-y-[-4px] transition-all duration-300 translate-y-full title absolute bottom-0 w-full rounded-tr-md rounded-tl-md"
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
                className="relative group flex group"
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
