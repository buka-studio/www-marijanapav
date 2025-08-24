import { Metadata } from 'next';
import React from 'react';

import CopyToClipboard from '../../components/CopyToClipboard';
import Button from '../../components/ui/Button';
import ViewLogger from '../../components/ViewCounter';
import Header from '../components/Header';

const links = [
  { label: 'Twitter', href: 'https://twitter.com/marijanapav' },

  { label: 'GitHub', href: 'https://www.github.com/marijanapav' },
  { label: 'Bluesky', href: 'https://bsky.app/profile/marijanapav.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/marijana-pavlinic/' },
];

const email = 'marijana@buka.studio';

export const metadata: Metadata = {
  title: 'Contact | Marijana Pavlinić',
  description: 'Reach out to say hi or talk future projects.',
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
              href="mailto:marijana@buka.studio"
              className="rounded-lg font-archivo text-[clamp(2.25rem,2vw+1rem,3.75rem)]"
            >
              marijana@buka.studio
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-1">
            <CopyToClipboard content={email} />
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
