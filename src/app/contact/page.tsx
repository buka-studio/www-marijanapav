import CopyToClipboard from '~/src/components/CopyToClipboard';
import Button from '~/src/components/ui/Button';
import ViewLogger from '~/src/components/ViewCounter';

import Header from '../components/Header';

const links = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/marijanasimag/',
  },
  {
    label: 'Linkedin',
    href: 'https://www.linkedin.com/in/marijana-simag/',
  },
  {
    label: 'Behance',
    href: 'https://www.behance.net/marijanasimag',
  },
  {
    label: 'Dribbble',
    href: 'https://dribbble.com/marijanasimag',
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/MarijanaSimag',
  },
];

const email = 'hello@marijanasimag.com';

export const metadata = {
  title: 'Contact | Marijana Šimag',
  description: 'Reach out to say hi, talk future projects or talk about my cat.',
};

export default function Contact() {
  return (
    <>
      <Header />
      <ViewLogger pathname="/contact" />
      <main className="flex flex-col py-8 px-11 flex-1">
        <div className="items-center flex-1 justify-center flex flex-col text-text-primary">
          <h1>Say hi or talk future projects</h1>
          <div className="flex md:flex-row flex-col mb-[100px] md:mb-8 gap-6 items-center text-center ">
            <a
              href="mailto:hello@marijanasimag.com"
              className="text-[clamp(2.25rem,2vw+1rem,3.75rem)] font-archivo rounded-lg"
            >
              hello@marijana
              <wbr />
              simag.com
            </a>
            <CopyToClipboard content={email} />
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
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
