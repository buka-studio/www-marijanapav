"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { DarkIcon, LightIcon, SystemIcon } from "~/src/components/icons";
import useDidMount from "~/src/hooks/useDidMount";

const controls = [
  {
    icon: <DarkIcon className="w-5 h-5 z-1 relative" />,
    value: "dark",
  },
  {
    icon: <LightIcon className="w-5 h-5 z-1 relative" />,
    value: "light",
  },
  {
    icon: <SystemIcon className="w-5 h-5 z-1 relative" />,
    value: "system",
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const didMount = useDidMount();

  return (
    <div className="flex items-center gap-3 rounded-full border-main-theme-overlay border p-1 shadow-card bg-panel-background">
      {controls.map(({ icon, value }) => {
        const isActive = didMount && theme === value;
        return (
          <button
            className={clsx(
              "p-[6px] hover:text-main-theme-1 rounded-full relative",
              {
                ["text-text-secondary"]: !isActive,
                ["text-main-theme-1"]: isActive,
              }
            )}
            key={value}
            onClick={() => setTheme(value)}
          >
            {isActive && (
              <motion.span
                className="absolute 
                top-0  left-0 h-8 w-8 bg-main-theme-3 rounded-full"
                layoutId="theme-dot"
              />
            )}
            {icon}
          </button>
        );
      })}
    </div>
  );
}
