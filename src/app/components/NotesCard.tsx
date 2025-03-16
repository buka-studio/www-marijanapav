'use client';

import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function NotesCard() {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        // Replace 'username/repo' with your actual GitHub username and repository name
        const response = await fetch(
          'https://api.github.com/repos/buka-studio/www-marijanapav/commits',
        );
        const commits = await response.json();
        const lastCommitDate = new Date(commits[0].commit.author.date);
        setLastUpdated(lastCommitDate.toLocaleDateString());
      } catch (error) {
        console.error('Error fetching last update:', error);
        setLastUpdated('unavailable');
      }
    };

    fetchLastUpdate();
  }, []);

  return (
    <Card className="">
      <div className="flex flex-col justify-between gap-5">
        <Heading
          as="h2"
          className=" flex items-center gap-2 font-sans font-semibold text-text-primary"
        >
          Notes
        </Heading>
        <p className="text-sm leading-5 text-text-primary">
          This site is constantly evolving, expect frequent nitpick commits. Last updated:{' '}
          <a
            href="https://github.com/buka-studio/www-marijanapav/commits"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-0.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            {lastUpdated || 'Loading...'}
            <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </p>
      </div>
    </Card>
  );
}
