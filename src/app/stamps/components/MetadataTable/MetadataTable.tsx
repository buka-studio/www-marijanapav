import { ComponentProps, CSSProperties } from 'react';

import { cn } from '~/src/util';

import { Stamp } from '../../models';

import './MetadataTable.css';

function KeyCell({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-stone-300 py-2 uppercase text-stone-400', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ValueCell({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('break-all border-b border-stone-300 py-2 text-stone-500', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default function MetadataTable({ stamp }: { stamp: Stamp }) {
  return (
    <div className="font-courier grid grid-cols-[1fr_1fr] gap-x-4 font-bold" key={stamp?.id}>
      {Object.entries(stamp).map(([key, value], i) => {
        if (key === 'meta') {
          return null;
        }

        return (
          <>
            <KeyCell
              className={cn({
                'border-t': i === 0,
              })}
            >
              {key}
            </KeyCell>
            <ValueCell
              className={cn({
                'border-t': i === 0,
              })}
              style={
                {
                  '--color': '#78716c',
                } as CSSProperties
              }
            >
              {key === 'catalogCodes' ? (
                <span
                  className="typewriter"
                  style={{ '--n': (value as string[]).flat().join(' ').length } as CSSProperties}
                >
                  {(value as string[]).map((code: string, i) => (
                    <span className="" key={i}>
                      {code}
                    </span>
                  ))}
                </span>
              ) : (
                <span
                  className="typewriter"
                  style={{ '--n': (value as string).length } as CSSProperties}
                >
                  {String(value)}
                </span>
              )}
            </ValueCell>
          </>
        );
      })}
    </div>
  );
}
