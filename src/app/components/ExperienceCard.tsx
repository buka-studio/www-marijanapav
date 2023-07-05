import Heading from '~/src/components/ui/Heading';
import Tag from '~/src/components/ui/Tag';

import Card from './Card';

const positions = [
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
    company: { name: 'Norma Studio' },
    from: '2017',
    to: '2018',
  },
  { title: 'Freelancing', from: '2015', to: '2018' },
];

export default function ExperienceCard() {
  return (
    <Card>
      <div className="px-2">
        <Heading
          as="h1"
          className="text-base text-text-secondary font-sans pb-6 border-b border-main-theme-overlay my-4"
        >
          Work Experience
        </Heading>
        <ul className="flex flex-col gap-4">
          {positions.map((p, i) => (
            <li
              key={i}
              className="flex-col items-start xs:flex-row pb-4 border-b border-main-theme-overlay flex xs:items-center justify-between last-of-type:border-none"
            >
              <span className="flex-1 flex items-center gap-2">
                <span className="text-text-secondary">
                  {p.title} {p.company && 'at'}{' '}
                </span>
                {p.company ? (
                  <Tag>
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
                {p.from}—{p.to ? p.to : 'ongoing'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
