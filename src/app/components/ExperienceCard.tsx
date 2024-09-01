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
    title: 'Co-founder',
    company: { name: 'Buka Studio', href: 'https://buka.studio/' },
    from: '2023',
  },
  {
    title: 'Brand Designer',
    company: { name: 'Supabase', href: 'https://supabase.com/' },
    from: '2022',
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
      <div className="px-2">
        <Heading
          as="h1"
          className="mb-28 border-main-theme-overlay pb-6 font-sans text-base text-text-secondary"
        >
          Work
        </Heading>
        <ul className="flex flex-col gap-4">
          {positions.map((p, i) => (
            <li
              key={i}
              className="flex flex-row items-center justify-between border-b border-main-theme-overlay pb-4 last-of-type:border-none"
            >
              <span className="flex flex-1 items-center gap-2">
                <span className="text-text-secondary">
                  {p.title} {p.company && 'at'}{' '}
                </span>
                {p.company ? (
                  <Tag asChild>
                    {p.company.href ? (
                      <a className="text-xs" href={p.company.href} rel="noreferrer" target="_blank">
                        {p.company.name}
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
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-text-primary opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-text-secondary"></span>
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
