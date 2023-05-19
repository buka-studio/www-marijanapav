import Link from "next/link";
import Button from "~/src/components/ui/Button";
import Heading from "./Heading";
import {
  BackgroundCard,
  BukaCard,
  CurrentCard,
  ExperienceCard,
  LocationCard,
  PantoneCard,
  PhotosCard,
  SneakPeekCard,
  StampsCard,
  ThemeCard,
  ToolsCard,
} from "./components";
import Header from "./components/Header";
import MouseVarsProvider from "./components/MouseVarsProvider";

const projectLinks = [
  { label: "Branding", href: "/work?f=branding" },
  { label: "UX/UI", href: "/work?f=product-design" },
  { label: "Illustration", href: "/work?f=illustration" },
  { label: "Other", href: "/work?f=other" },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className="fixed glow h-[400px] w-[400px] blur-3xl rounded-full pointer-events-none" />
      <div className="flex flex-col px-5 py-12">
        <main className="pb-[100px]">
          <Heading />
          <div className="mb-[82px] flex items-center gap-4 text-text-primary">
            <div>What I do</div>
            <div className="flex gap-2">
              {projectLinks.map((l) => (
                <Link href={l.href} passHref key={l.href} legacyBehavior>
                  <Button as="a" size="sm">
                    {l.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <MouseVarsProvider>
            <div className="grid grid-cols-1 lg:grid-cols-[22fr_38fr_40fr] gap-[20px] mb-[20px] lg:flex-row">
              <div className="lg:col-span-2">
                <BackgroundCard />
              </div>
              <div className="flex flex-col gap-[20px] [&_>*]:flex-1">
                <ExperienceCard />
                <LocationCard />
              </div>
            </div>
            <div className="cards grid grid-cols-1 lg:grid-cols-[22fr_38fr_40fr] gap-[20px] [&_.ui-card]:h-full [&_.ui-card>*]:h-full">
              <div className="flex flex-col gap-[20px]">
                <PantoneCard />
                <ThemeCard />
                <SneakPeekCard />
              </div>
              <div className="flex flex-col gap-[20px]">
                <PhotosCard />
                <BukaCard />
                <CurrentCard />
              </div>
              <div className="flex flex-col gap-[20px]">
                <ToolsCard />
                <StampsCard />
              </div>
            </div>
          </MouseVarsProvider>
        </main>
      </div>
    </>
  );
}
