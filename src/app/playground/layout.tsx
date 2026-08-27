export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 p-4 [color-scheme:light] md:p-6">{children}</div>
  );
}
