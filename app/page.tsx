import { TimeBackground } from "@/components/time-background";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-garamond italic text-sm tracking-[0.3em] opacity-60">ato</p>
      </div>
      <TimeBackground />
    </main>
  );
}
