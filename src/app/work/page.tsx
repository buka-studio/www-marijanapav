import ProjectsGrid from '~/src/app/work/components/ProjectsGrid';
import ViewLogger from '~/src/components/ViewCounter';

import Header from './components/Header';
import { Filter, projects } from './constants';

export default function Work({ searchParams }: { searchParams: { f?: Filter } }) {
  const filteredProjects = projects.filter((p) => {
    if (!searchParams?.f || searchParams?.f === 'all') {
      return true;
    }

    return p?.filters.includes(searchParams?.f);
  });

  return (
    <>
      <Header filter={searchParams?.f as any} />
      <ViewLogger pathname="/work" />
      <ProjectsGrid projects={filteredProjects} />
    </>
  );
}
