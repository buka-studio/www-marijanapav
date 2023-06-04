import { notFound } from 'next/navigation';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';
import Header from '../components/Header';
import { projects, StaticProject } from '../constants';

export default function Work({ params }: { params: { slug: string } }) {
  const project = projects
    .filter((p) => p.type === 'project')
    .find((p) => 'slug' in p && p.slug === params?.slug) as StaticProject;

  if (!project) {
    notFound();
  }

  return (
    <>
      <Header />
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
                className="text-text-alt"
                href={project.link}
                target="_blank"
                rel="noreferrer noopener"
              >
                {project.link}
              </a>
            </Tag>
          )}
        </div>
        <div className="flex flex-col gap-4 mt-[80px]">
          {project.assets?.map((r, i) => (
            <div className="flex gap-4 justify-left" key={i}>
              {r.map((c, i) => (
                <div key={i} className="max-h-[700px] [&:only-child_img]:object-cover">
                  <Image src={c} key={i} alt="" className="max-h-full object-contain m-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
