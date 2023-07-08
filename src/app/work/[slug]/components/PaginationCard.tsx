import clsx from 'clsx';

import { ArrowRightIcon } from '~/src/components/icons';
import { relativeMouseClassname } from '~/src/components/MouseVarsProvider';
import Image from '~/src/components/ui/Image';

import Card from '../../components/Card';
import { StaticProject } from '../../constants';

import './PaginationCard.css';

export default function PaginationCard({
  project,
  direction,
}: {
  project: StaticProject;
  direction: 'left' | 'right';
}) {
  return (
    <Card
      containerClassName="group"
      className={clsx('grid md:grid-cols-1 grid-rows-1 grid-cols-[1fr_1fr]', direction)}
    >
      <div
        className={clsx(
          'w-full h-full relative-mouse bg-panel-background md:[grid-row:1] md:[grid-column:1] rounded-lg overflow-hidden',
          relativeMouseClassname,
          { ['[grid-column:2]']: direction === 'left' },
        )}
      >
        <Image
          src={project.preview.src}
          className="object-cover w-full opacity-30 h-full group-hover:scale-110 transition-all duration-500 ease-in-out"
          fill
          alt=""
        />
      </div>
      <div
        className={clsx(
          'flex flex-col gap-2 justify-center items-center h-[140px] md:min-h-[230px] [grid-row:1] md:[grid-column:1] relative z-[1]',
          {
            ['[grid-column:2]']: direction === 'right',
          },
        )}
      >
        {' '}
        <ArrowRightIcon
          className={clsx('text-text-primary bg-main-theme-3 p-1 w-8 h-8 rounded-full', {
            ['transform rotate-180']: direction === 'left',
          })}
        />
        <p className="text-center p-2">{project.title}</p>
      </div>
    </Card>
  );
}
