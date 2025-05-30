import { ArrowUpRight } from 'lucide-react';

import Heading from '~/src/components/ui/Heading';
import Tag from '~/src/components/ui/Tag';

import Card from './Card';

type Position = {
  title: string;
  company: { name: string; href: string };
  from: string;
  to?: string;
};
const positions: Position[] = [
  {
    title: 'Designer',
    company: { name: 'LiveKit', href: 'https://livekit.io' },
    from: '2024',
  },
  {
    title: 'Co-founder',
    company: { name: 'Buka Studio', href: 'https://buka.studio/' },
    from: '2023',
  },
  {
    title: 'Brand Designer',
    company: { name: 'Supabase', href: 'https://supabase.com/' },
    from: '2022',
    to: '2024',
  },
  {
    title: 'Brand Designer',
    company: { name: 'Infinum', href: 'https://infinum.com/' },
    from: '2018',
    to: '2022',
  },
  {
    title: 'Designer',
    company: { name: 'Norma Studio', href: 'https://norma.hr/' },
    from: '2017',
    to: '2018',
  },
  // { title: 'Freelancing', from: '2015', to: '2018' },
];

export default function ExperienceCard() {
  return (
    <Card>
      <div className="flex flex-col justify-between px-2 xl:h-[500px]">
        <Heading
          as="h1"
          className="mb-5 border-panel-border pb-6 font-sans text-base font-semibold text-text-primary xl:mb-28"
        >
          Work
        </Heading>
        <ul className="flex flex-col gap-4">
          {positions.map((p, i) => (
            <li
              key={i}
              className="flex flex-row items-center justify-between border-b border-panel-border pb-4 last-of-type:border-none"
            >
              <span className="flex flex-1 flex-wrap items-center gap-2 whitespace-nowrap">
                <span className="text-text-primary">
                  {p.title} {p.company && 'at'}{' '}
                </span>
                {p.company ? (
                  <Tag asChild className="bg-transparent p-0">
                    {p.company.href ? (
                      <a
                        className="text-md hover:text-main-accent group inline-flex items-center text-text-primary"
                        href={p.company.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {p.company.name}
                        <ArrowUpRight className="ml-0.5 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    ) : (
                      <span className="text-xs">{p.company.name}</span>
                    )}
                  </Tag>
                ) : null}
              </span>
              <span className="text-text-secondary">
                <span className="hidden xs:block">
                  {p.from}—{p.to ? p.to : 'ongoing'}
                </span>
                {!p.to && (
                  <span className="relative flex h-3 w-3 xs:hidden">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full"></span>
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
