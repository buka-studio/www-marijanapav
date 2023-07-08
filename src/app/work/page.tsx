import ProjectsGrid from '~/src/app/work/components/ProjectsGrid';
import ViewLogger from '~/src/components/ViewCounter';

import Header from './components/Header';
import { Filter, projects } from './constants';

export const metadata = {
  title: 'Work | Marijana Šimag',
  description:
    'Explore a curated selection of work projects and a few passion projects ranging from print to digital.',
};

export default function Work({ searchParams }: { searchParams: { f?: Filter } }) {
  const filteredProjects = projects.filter((p) => {
    if (p.hidden) {
      return false;
    }

    if (!searchParams?.f || searchParams?.f === 'all') {
      return true;
    }

    return p?.filters.includes(searchParams?.f);
  });

  return (
    <div className="flex flex-col flex-1">
      <Header filter={searchParams?.f as any} />
      <ViewLogger pathname="/work" />
      <main className="flex-1">
        <ProjectsGrid projects={filteredProjects} />
      </main>
    </div>
  );
}
