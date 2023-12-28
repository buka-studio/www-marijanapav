import CopyToClipboard from '~/src/components/CopyToClipboard';
import Button from '~/src/components/ui/Button';
import ViewLogger from '~/src/components/ViewCounter';

import Header from '../components/Header';

const links = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/marijanapav',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/marijana-pavlinic/',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/marijanapavlinic/',
  },
  {
    label: 'Dribbble',
    href: 'https://dribbble.com/marijanapav',
  },
  {
    label: 'GitHub',
    href: 'https://www.github.com/marijanapav',
  },
];

const email = 'hello@marijanapav.com';

export const metadata = {
  title: 'Contact | Marijana Pavlinić',
  description: 'Reach out to say hi, talk future projects or talk about my cat.',
};

export default function Contact() {
  return (
    <>
      <Header />
      <ViewLogger pathname="/contact" />
      <main className="flex flex-1 flex-col px-11 py-8">
        <div className="flex flex-1 flex-col items-center justify-center text-text-primary">
          <h1>Say hi or talk future projects</h1>
          <div className="mb-[100px] flex flex-col items-center gap-6 text-center md:mb-8 md:flex-row ">
            <a
              href="mailto:hello@marijanasimag.com"
              className="rounded-lg font-archivo text-[clamp(2.25rem,2vw+1rem,3.75rem)]"
            >
              hello@marijana
              <wbr />
              pav.com
            </a>
            <CopyToClipboard content={email} />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {links.map(({ label, ...rest }) => {
              const linkProps = { ...rest, target: '_blank', rel: 'noopener noreferrer' };
              return (
                <Button key={label} asChild>
                  <a {...linkProps}>{label}</a>
                </Button>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
