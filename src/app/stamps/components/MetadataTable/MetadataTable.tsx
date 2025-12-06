import { ComponentProps, CSSProperties, Fragment } from 'react';
import colors from 'tailwindcss/colors';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/src/components/ui/HoverCard';
import Image from '~/src/components/ui/Image';
import { Popover, PopoverContent, PopoverTrigger } from '~/src/components/ui/Popover';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

import { collections } from '../../constants';
import { Stamp } from '../../models';
import { useStampStore } from '../../store';
import ExistingStamp from './ExistingStamp.svg';

import './MetadataTable.css';

const cellKeys = [
  'country',
  'year',
  'catalogCodes',
  'meta',
] as const satisfies readonly (keyof Stamp)[];

type CellKey = (typeof cellKeys)[number];

const cellKeyLabels: Partial<Record<CellKey | string, string>> = {
  year: 'Issued On',
  category: 'Category',
  designer: 'Designer',
  catalogCodes: 'Catalog Codes',
  faceValue: 'Face Value',
  printRun: 'Print Run',
};

type RowValue = string | string[] | undefined;

function toRowValue(value: unknown): RowValue {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return String(value);
}

function getRows(stamp: Stamp): Record<string, RowValue> {
  const labelFor = (key: string) => cellKeyLabels[key as CellKey] ?? key;
  const rows: Record<string, RowValue> = {};

  cellKeys.forEach((key) => {
    if (key === 'meta') {
      Object.entries(stamp.meta ?? {}).forEach(([metaKey, metaValue]) => {
        rows[labelFor(metaKey)] = toRowValue(metaValue);
      });
      return;
    }

    rows[labelFor(key)] = toRowValue(stamp[key]);
  });

  return rows;
}

function KeyCell({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-stone-300 py-2 text-stone-400 uppercase', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ValueCell({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-stone-300 py-2 break-all text-stone-500 uppercase', className)}
      {...props}
    >
      {children}
    </div>
  );
}

const PopoverOrHoverCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const isHoverableDevice = useMatchMedia('(hover: hover)');

  const trigger = (
    <ExistingStamp className="w-[120px] cursor-pointer transition-colors duration-150 group-data-[state=open]:[--bg:var(--color-stone-400)] group-data-[state=open]:[--fg:var(--color-stone-800)]" />
  );

  if (isHoverableDevice) {
    return (
      <HoverCard openDelay={0}>
        <HoverCardTrigger className={cn('group', className)}>{trigger}</HoverCardTrigger>
        <HoverCardContent
          side="top"
          className="flex h-auto w-auto items-center justify-center bg-stone-50"
        >
          {children}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <Popover>
      <PopoverTrigger className={cn('group', className)}>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        className="flex h-auto w-auto items-center justify-center bg-stone-50"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default function MetadataTable({ className }: { className?: string }) {
  const stampStore = useStampStore();
  const collection = collections[stampStore.collection];
  const stamp = collection.stamps.find((stamp) => stamp.id === stampStore.selectedStampId) as Stamp;

  if (!stamp) {
    return null;
  }

  const rows = getRows(stamp);

  return (
    <div>
      <div className="font-libertinus mb-5 text-stone-700">
        {stamp.srcOriginal ? (
          <>
            <div className="flex items-center gap-1">
              This stamp was inspired by an{' '}
              <PopoverOrHoverCard className="group/hovercard hidden lg:block">
                <Image src={stamp.srcOriginal} alt="Original stamp" width={200} height={200} />
              </PopoverOrHoverCard>
              <span className="lg:hidden">existing stamp.</span>
            </div>
            <div className="mt-2 flex h-[200px] w-full items-center justify-center rounded-md border border-stone-300 bg-stone-50 p-2 lg:hidden">
              <Image
                src={stamp.srcOriginal}
                alt="Original stamp"
                width={200}
                height={200}
                className="h-full w-full object-contain object-center"
              />
            </div>
          </>
        ) : (
          <div>This stamp is completely fictional.</div>
        )}
      </div>
      <div
        className={cn(
          'grid transform-gpu grid-cols-[2fr_3fr] font-mono text-sm font-bold',
          className,
        )}
        key={stamp?.id}
      >
        {Object.entries(rows).map(([label, value], i) => {
          const isArray = Array.isArray(value);

          const defaultValue = '--';

          return (
            <Fragment key={label}>
              <KeyCell
                className={cn('pr-4', {
                  'border-t': i === 0,
                })}
              >
                {label}
              </KeyCell>
              <ValueCell
                className={cn({
                  'border-t': i === 0,
                })}
                style={
                  {
                    '--color': colors.stone[500],
                  } as CSSProperties
                }
              >
                {isArray ? (
                  <span className="flex flex-col">
                    {(value as string[]).map((code: string, i) => (
                      <span
                        className="typewriter"
                        key={i}
                        style={{ '--n': code.length } as CSSProperties}
                      >
                        {code}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span
                    className="typewriter"
                    style={{ '--n': (value || defaultValue).length } as CSSProperties}
                  >
                    {value ? String(value) : defaultValue}
                  </span>
                )}
              </ValueCell>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
