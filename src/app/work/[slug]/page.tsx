import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';
import ViewLogger from '~/src/components/ViewCounter';

import MouseVarsProvider from '../../components/MouseVarsProvider';
import { projects, StaticProject } from '../constants';
import PaginationCard from './components/PaginationCard';

function hostname(url: string): string {
  return new URL(url).hostname;
}

function intersection<T>(a: T[] = [], b: T[] = []): T[] {
  const s1 = new Set(b);

  return a.filter((x) => s1.has(x));
}

export default function Work({ params }: { params: { slug: string } }) {
  const project = projects
    .filter((p) => p.type === 'project')
    .find((p) => 'slug' in p && p.slug === params?.slug) as StaticProject;

  const associatedProjects = projects.filter(
    (p) => p.type === 'project' && intersection(p.tags, project.tags).length > 0,
  ) as StaticProject[];
  const projectIndex = associatedProjects.findIndex((p) => p.slug === project.slug);
  const previousProject = projectIndex > 0 && associatedProjects[projectIndex - 1];
  const nextProject =
    projectIndex < associatedProjects.length - 1 && associatedProjects[projectIndex + 1];

  if (!project) {
    notFound();
  }

  return (
    <>
      {project.slug && <ViewLogger pathname={`/work/${project.slug}`} />}
      <div className="flex-1 py-10 px-5 [html:has(&)_footer>*:not(.nav)]:invisible">
        <Heading className="text-5xl mb-2 text-left max-w-xl">{project.title}</Heading>
        <p className="max-w-lg text-left">{project.description}</p>
        <div className="mt-10 flex items-center justify-between">
          {(project.tags?.length || 0) > 0 && (
            <div className="flex justify-left gap-2">
              {project.tags?.map((t, i) => (
                <Tag key={i} className="text-sm ">
                  {t}
                </Tag>
              ))}
            </div>
          )}
          {project.link && (
            <Tag>
              <a
                className="text-text-alt flex gap-2"
                href={project.link}
                target="_blank"
                rel="noreferrer noopener"
              >
                {hostname(project.link)}
                <LinkIcon />
              </a>
            </Tag>
          )}
        </div>
        <div className="flex flex-col gap-4 mt-[80px]">
          {project.assets?.map((r, i) => (
            <div className="flex gap-4 justify-left" key={i}>
              {r.map((c, i) => (
                <div key={i} className="max-h-[700px] [&:only-child_img]:object-cover flex-1">
                  <Image src={c} key={i} alt="" className="max-h-full w-full object-cover m-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <MouseVarsProvider>
          <div className="flex flex-col max-w-[800px] m-auto gap-9 mt-20">
            {previousProject || nextProject ? (
              <Heading className="text-4xl text-center" as="h2">
                Explore other projects
              </Heading>
            ) : null}
            <div className="md:flex-row flex flex-col gap-6 justify-center md:[&>*]:max-w-[400px]">
              {previousProject && (
                <Link href={`/work/${previousProject.slug}`} className="flex-1">
                  <PaginationCard direction="left" project={previousProject} />
                </Link>
              )}
              {nextProject && (
                <Link href={`/work/${nextProject.slug}`} className="flex-1">
                  <PaginationCard direction="right" project={nextProject} />
                </Link>
              )}
            </div>
          </div>
        </MouseVarsProvider>
      </div>
    </>
  );
}
