import { ArrowUpRight } from 'lucide-react';
import { ReactNode } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import Tag from '~/src/components/ui/Tag';

import Card from './Card';

type Position = {
  title: ReactNode;
  company?: { name: string; href: string };
  from: string;
  to?: string;
  muted?: boolean;
};

const positions: Position[] = [
  {
    title: 'Senior Brand Designer',
    company: { name: 'Vercel', href: 'https://vercel.com/home' },
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
    title: (
      <a
        className="group text-text-primary/50 hover:text-main-accent inline-flex items-center"
        href="https://www.linkedin.com/in/marijana-pavlinic/"
        target="_blank"
        rel="noreferrer"
      >
        View full work history
        <ArrowUpRight className="ml-0.5 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    ),
    from: '2022',
    to: '2017',
    muted: true,
  },
];

export default function ExperienceCard() {
  return (
    <Card>
      <div className="flex flex-col justify-between px-2">
        <CardTitle variant="mono" className="border-panel-border mb-10 pb-6">
          Work
        </CardTitle>
        <ul className="flex flex-col">
          {positions.map((p, i) => (
            <li
              key={i}
              className="border-panel-border flex flex-row items-center justify-between border-b py-2 text-sm last-of-type:border-none"
            >
              <span className="flex flex-1 flex-wrap items-center gap-2 whitespace-nowrap">
                {!p.to && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="bg-main-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                    <span className="bg-main-accent relative inline-flex h-1.5 w-1.5 rounded-full"></span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className={p.muted ? 'text-text-primary/60' : 'text-text-primary'}>
                    {p.title} {p.company && p.title !== 'Other' && 'at'}{' '}
                  </span>
                  {p.company ? (
                    <Tag asChild className="bg-transparent p-0">
                      {p.company.href ? (
                        <a
                          className="text-md group text-text-primary hover:text-main-accent inline-flex items-center"
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
              <span className={p.muted ? 'text-text-primary/60' : 'text-text-primary'}>
                <span className="xs:block hidden">
                  {p.from}—{p.to ? p.to : 'present'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
