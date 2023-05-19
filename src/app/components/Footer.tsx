import { ReactNode } from "react";
import { LettersIcon } from "~/src/components/icons";
import FloatingNav from "../../components/FloatingNav";

export default function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="flex justify-between pb-4 md:pb-8 text-text-primary px-5 z-10">
      <div className="flex gap-2 items-center">
        <div className="rounded-full p-2 bg-main-theme-3">
          <LettersIcon />
        </div>
        <span className="[&_a]:underline text-xs">
          <a href="#">Archivo</a>, paired with <a href="#">Inter</a>.
        </span>
      </div>

      <div className="fixed bottom-[70px] md:bottom-8 left-1/2 -translate-x-1/2 rounded-full">
        <FloatingNav />
      </div>

      <div className="text-xs flex gap-2 items-center">
        Built by{" "}
        <a href="https://rpavlini.com" className="underline">
          rpavlini.com
        </a>
      </div>
    </footer>
  );
}
