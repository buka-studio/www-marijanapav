import { Metadata } from 'next';
import { getImageProps } from 'next/image';
import { Suspense } from 'react';

import { preloadImage } from '~/src/util';

import { previewAtlas } from './components/ProjectHoverPreview/atlas';
import Projects from './components/Projects';
import { Filter, isVisibleStaticProject, projectGridPreviewSizes, projects } from './constants';

export const metadata: Metadata = {
  title: 'Work | Marijana Pavlinić',
  description:
    'Explore a curated selection of work projects and a few passion projects ranging from print to digital.',
};

export default async function Work({
  searchParams,
}: {
  searchParams: Promise<{ f?: Filter; view?: string }>;
}) {
  preloadImage(previewAtlas.src);

  const params = await searchParams;
  const filteredProjects = projects.filter((p) => {
    if (p.hidden) {
      return false;
    }

    if (!params?.f || params?.f === 'all') {
      return true;
    }

    return p?.filters.includes(params?.f);
  });

  const gridPreviewPreloads =
    params?.view === 'grid'
      ? filteredProjects
          .filter(isVisibleStaticProject)
          .slice(0, 6)
          .map((project) => {
            const { props } = getImageProps({
              alt: '',
              src: project.preview,
              quality: 90,
              sizes: projectGridPreviewSizes,
            });

            return {
              href: props.src,
              imageSizes: props.sizes,
              imageSrcSet: props.srcSet,
              title: project.title,
            };
          })
      : [];

  return (
    <div className="flex flex-1 flex-col">
      {gridPreviewPreloads.map((preload) => (
        <link
          key={preload.href}
          rel="preload"
          as="image"
          href={preload.href}
          imageSizes={preload.imageSizes}
          imageSrcSet={preload.imageSrcSet}
          data-project-preview={preload.title}
        />
      ))}
      <main className="flex-1">
        <Suspense>
          <Projects projects={filteredProjects} />
        </Suspense>
      </main>
    </div>
  );
}
