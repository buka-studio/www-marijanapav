import { Metadata } from 'next';
import { Suspense } from 'react';

import Projects from './components/Projects';
import { Filter, projects } from './constants';

export const metadata: Metadata = {
  title: 'Work | Marijana Pavlinić',
  description:
    'Explore a curated selection of work projects and a few passion projects ranging from print to digital.',
};

export default async function Work({ searchParams }: { searchParams: Promise<{ f?: Filter }> }) {
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

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <Suspense>
          <Projects projects={filteredProjects} />
        </Suspense>
      </main>
    </div>
  );
}
