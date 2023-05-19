"use client";

import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";
import { LogoIcon } from "~/src/components/icons";
import useScroll from "~/src/hooks/useScroll";
import ThemeSwitcher from "./ThemeSwitcher";

const headerTriggerY = 50;

export default function Header({ children }: { children?: ReactNode }) {
  const { y, directionY } = useScroll();

  return (
    <header
      className={clsx(
        "flex justify-between py-4 px-5 z-10 sticky top-0 transition-all duration-300 rounded-br-[32px] rounded-bl-[32px] ease-in-out flex-wrap",
        {
          ["translate-y-[-100px]"]: y > headerTriggerY && directionY === "down",
          ["backdrop-blur-[6px] bg-transparent [&]"]: y > headerTriggerY,
        }
      )}
    >
      <Link href="/" className="flex gap-2 text-text-primary items-center">
        <LogoIcon
          className={clsx("transition-all duration-300", {
            ["text-main-theme-2"]: y > headerTriggerY,
          })}
        />
        <span className="hidden md:inline">Marijana Šimag</span>
      </Link>
      {children && (
        <div className="order-3 mt-4 w-full lg:w-auto lg:order-none">
          {children}
        </div>
      )}
      <ThemeSwitcher />
    </header>
  );
}
