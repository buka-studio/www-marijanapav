"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const links = {
  "/work": { label: "Work", width: 70 },
  "/": { label: "About", width: 78 },
  "/contact": { label: "Contact", width: 92 },
};

export default function Navabar() {
  const pathSegment = `/${useSelectedLayoutSegment() || ""}`;

  return (
    <nav className="flex items-center rounded-full p-[2px] gap-2 relative bg-panel-background shadow-card">
      {Object.entries(links).map(([path, l]) => (
        <div className="relative flex" key={l.label}>
          {pathSegment === path && (
            <motion.div
              className="absolute h-full w-full bg-main-theme-3 rounded-full"
              layoutId="highlight"
            />
          )}
          <Link href={path} className="py-2 px-4 z-[1] text-text-primary">
            {l.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
