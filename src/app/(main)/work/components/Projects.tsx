'use client';

import { ListIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import Button from '~/src/components/ui/Button';

import { Project } from '../constants';
import ProjectsGrid from './ProjectsGrid';
import ProjectsList from './ProjectsList';

type Props = {
  projects: Project[];
};

type ViewMode = 'grid' | 'list';

function getViewMode(view: string | null): ViewMode {
  return view === 'list' ? 'list' : 'grid';
}

export default function Projects({ projects }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = getViewMode(searchParams.get('view'));
  const toggleViewMode = useCallback(() => {
    const nextViewMode = viewMode === 'grid' ? 'list' : 'grid';
    const params = new URLSearchParams(searchParams.toString());

    params.set('view', nextViewMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, viewMode]);

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="mt-8 flex items-start justify-between gap-5 px-5">
        <p className="text-theme-1 max-w-[500px] text-sm">
          I do a wide variety of projects but lately I enjoy most finding ways to illustrate complex
          systems in technical visuals that reflect the brand
        </p>
        <Button
          type="button"
          className="shrink-0"
          size="default"
          aria-label="Toggle view"
          aria-pressed={viewMode === 'list'}
          onClick={toggleViewMode}
          buttonClassName="p-3"
          iconLeft={
            viewMode === 'grid' ? (
              <ListIcon className="size-5" />
            ) : (
              <SquaresFourIcon className="size-5" />
            )
          }
        />
      </div>
      <div className="pb-[50px] md:pb-[200px]">
        {viewMode === 'grid' ? (
          <ProjectsGrid projects={projects} />
        ) : (
          <ProjectsList projects={projects} />
        )}
      </div>
    </div>
  );
}

export { ProjectsGrid, ProjectsList };
