import Image from "next/image";

/** Quiet atmosphere behind the authenticated workspace. */
export function DashboardBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <Image
        src="/DashboardBack.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-90"
      />
      <div className="absolute inset-0 bg-background/72 dark:bg-background/88" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
    </div>
  );
}
