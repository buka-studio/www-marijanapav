import { ArrowUpRight } from 'lucide-react';

import CardTitle from '~/src/components/ui/CardTitle';
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
    title: 'Senior Brand Designer',
    company: { name: 'Vercel', href: 'https://vercel.com/' },
    from: '2025',
  },
  {
    title: 'Senior Designer',
    company: { name: 'LiveKit', href: 'https://livekit.io' },
    from: '2024',
    to: '2025',
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
      <div className="flex flex-col justify-between px-2">
        <CardTitle variant="mono" className="mb-10 border-panel-border pb-6">
          Work
        </CardTitle>
        <ul className="flex flex-col">
          {positions.map((p, i) => (
            <li
              key={i}
              className="flex flex-row items-center justify-between border-b border-panel-border py-2 text-sm last-of-type:border-none"
            >
              <span className="flex flex-1 flex-wrap items-center gap-2 whitespace-nowrap">
                {!p.to && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-main-accent opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-main-accent"></span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="text-text-primary">
                    {p.title} {p.company && 'at'}{' '}
                  </span>
                  {p.company ? (
                    <Tag asChild className="bg-transparent p-0">
                      {p.company.href ? (
                        <a
                          className="text-md group inline-flex items-center text-text-primary hover:text-main-accent"
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
              </span>
              <span className="text-text-secondary">
                <span className="hidden xs:block">
                  {p.from}—{p.to ? p.to : 'ongoing'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
