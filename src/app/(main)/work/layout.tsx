import { getImageProps } from 'next/image';
import { Suspense } from 'react';

import Header from './components/Header';
import { projectGridPreviewSizes, projects, type StaticProject } from './constants';

function isVisibleStaticProject(project: (typeof projects)[number]): project is StaticProject {
  return project.type !== 'component' && !project.hidden;
}

const gridPreviewPreloads = projects
  .filter(isVisibleStaticProject)
  .slice(0, 6)
  .map((project) => {
    const { props } = getImageProps({
      alt: '',
      src: project.preview,
      quality: 100,
      sizes: projectGridPreviewSizes,
    });

    return {
      href: props.src,
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
      title: project.title,
    };
  });

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
