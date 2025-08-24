import { motion } from 'framer-motion';

import { cn } from '~/src/util';

import { CollectionType, collectionTypes } from '../constants';

export default function CollectionsList({
  collection,
  onCollectionClick,
  className,
}: {
  collection: CollectionType;
  onCollectionClick: (collection: CollectionType) => void;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'flex flex-col gap-2 rounded-lg p-2 backdrop-blur-sm md:flex-row md:gap-6',
        className,
      )}
    >
      {collectionTypes.map((c) => (
        <li key={c} className="relative flex items-center">
          {c === collection && (
            <motion.span
              layoutId="collection-highlight"
              className="block h-4 w-[2px] rounded-full bg-stone-900 md:absolute md:bottom-0  md:h-px md:w-full "
            />
          )}
          <button
            onClick={() => onCollectionClick(c)}
            className={cn(
              'pl-[2px] font-commitmono text-sm font-bold uppercase text-stone-400 transition-[padding] duration-100 focus:outline-none focus-visible:text-stone-500 focus-visible:outline-none md:pl-0',
              {
                'pl-2 text-stone-500 md:pl-0': c === collection,
              },
            )}
          >
            {c}
          </button>
        </li>
      ))}
    </ul>
  );
}
