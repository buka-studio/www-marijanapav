import { motion, MotionProps } from 'framer-motion';
import { useState } from 'react';

const pathProps: Partial<MotionProps> = {
  variants: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
  },
  transition: { duration: 0, opacity: { duration: 0 }, ease: 'easeIn' },
};

const groupProps: Partial<MotionProps> = {
  variants: {
    initial: { pathLength: 0, opacity: 0 },
    animate: (custom: number = 0) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        staggerChildren: 0,
      },
    }),
  },
  initial: 'initial',
};

export default function Sun({ className, animate }: { className?: string; animate?: boolean }) {
  const [animated, setAnimated] = useState(true);

  return (
    <motion.svg
      viewBox="0 0 58 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={() => setAnimated(!animated)}
    >
      <motion.g
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.g className="eyes">
          <motion.path d="M22.2031 22.7371C22.9675 23.4749 22.9169 25.452 22.9343 26.4359" />
          <motion.path d="M26.873 23.1309C27.0253 24.0783 27.1807 25.0997 27.6268 25.954" />
        </motion.g>
        <path d="M17.9931 29.1111C17.9729 28.9862 18.2802 30.1555 18.379 30.4941C18.6852 31.544 19.1063 32.4632 19.8365 33.2854C21.7613 35.4533 25.2853 36.3013 28.1261 36.0145C32.4076 35.582 38.6775 32.2619 36.6683 27.09C36.4247 26.4629 36.5105 25.067 36.0542 24.6262" />
        <path d="M33.4226 13.8148C33.7435 13.8974 33.0619 13.1339 32.9659 13.0405C31.2991 11.4201 29.1798 10.7036 26.8771 10.8265C21.86 11.0944 16.7133 13.3185 13.9862 17.7608C8.95233 25.9609 14.4402 37.592 22.8539 40.9625C30.2422 43.9233 43.1391 40.6065 44.4217 31.4716C45.059 26.9313 42.2553 21.1017 39.1857 17.9381C37.8715 16.5836 36.2954 15.9174 34.7858 14.8517C34.3191 14.5226 32.8692 13.6731 33.4226 13.8148Z" />
        <motion.g className="rays" {...groupProps} animate={animated ? 'animate' : 'initial'}>
          <motion.path
            d="M38.8769 1.74536C37.607 1.97973 37.3364 5.76721 37.0557 6.73825"
            {...pathProps}
          />
          <motion.path
            d="M49.4734 7.45492C48.6353 4.50888 44.4194 10.8032 43.584 11.8763"
            {...pathProps}
          />
          <motion.path
            d="M20.2637 0.75C21.3898 2.08368 22.0386 4.20441 22.6523 5.8255"
            {...pathProps}
          />
          <motion.path
            d="M10.3994 9.23975C11.4296 10.0422 12.498 10.6023 13.7564 10.9663"
            {...pathProps}
          />
          <motion.path
            d="M4.98242 19.6183C6.03875 19.4236 7.23476 19.4497 8.32534 19.2993"
            {...pathProps}
          />
          <motion.path
            d="M0.75 33.2131C2.23544 32.5966 3.98681 32.0218 5.56292 31.7317"
            {...pathProps}
          />
          <motion.path
            d="M2.60352 43.8039C4.42742 43.0034 6.22445 42.1586 7.96911 41.1963"
            {...pathProps}
          />
          <motion.path
            d="M13.1959 44.2954C12.5915 45.1724 12.4552 46.6391 12.3672 47.6847"
            {...pathProps}
          />
          <motion.path
            d="M23.1918 47.6382C22.5511 48.7402 22.2778 50.4687 22.2314 51.7453"
            {...pathProps}
          />
          <motion.path
            d="M31.9044 49.9294C31.7016 51.1053 31.8373 52.2684 31.7943 53.4503"
            {...pathProps}
          />
          <motion.path
            d="M40.4102 47.7009C40.4787 49.4107 41.3778 50.8384 42.1817 52.2956"
            {...pathProps}
          />
          <motion.path
            d="M46.25 43.1899C46.3944 44.6378 47.1606 45.6619 48.225 46.5577"
            {...pathProps}
          />
          <motion.path
            d="M50.123 36.0686C51.5212 37.358 53.3726 38.1094 55.2845 38.0899"
            {...pathProps}
          />
          <motion.path
            d="M49.6162 29.193C52.1378 29.285 54.6011 29.1662 57.0904 28.7075"
            {...pathProps}
          />
          <motion.path
            d="M47.2763 21.3349C46.3496 21.257 48.1621 21.3302 48.4233 21.2886C49.6939 21.0858 50.8187 20.7016 52.0382 20.292"
            {...pathProps}
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
