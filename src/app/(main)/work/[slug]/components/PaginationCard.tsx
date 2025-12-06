import { ArrowRightIcon } from '~/src/components/icons';
import { relativeMouseClassname } from '~/src/components/MousePositionVarsSetter';
import Image from '~/src/components/ui/Image';
import { cn } from '~/src/util';

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
      containerClassName="group shadow-none"
      className={cn('grid grid-cols-[1fr_1fr] grid-rows-1 md:grid-cols-1', direction)}
    >
      <div
        className={cn(
          'relative-mouse bg-panel-background relative h-full w-full overflow-hidden rounded-lg md:col-1 md:row-1',
          relativeMouseClassname,
          { 'col-2': direction === 'left' },
        )}
      >
        <Image
          src={project.preview.src}
          className="h-full w-full object-cover opacity-30 transition-all duration-500 ease-in-out group-hover:scale-110"
          fill
          sizes="(max-width: 768px) 50vw, 350px"
          alt=""
        />
      </div>
      <div
        className={cn(
          'relative z-1 row-1 flex h-[140px] flex-col items-center justify-center gap-2 md:col-1 md:min-h-[230px]',
          {
            'col-2': direction === 'right',
          },
        )}
      >
        {' '}
        <ArrowRightIcon
          className={cn('bg-theme-3 text-text-primary h-8 w-8 rounded-full p-1 opacity-60', {
            'rotate-180 transform': direction === 'left',
          })}
        />
        <p className="max-w-[70%] p-1 text-center text-sm md:p-2 md:text-base">{project.title}</p>
      </div>
    </Card>
  );
}
