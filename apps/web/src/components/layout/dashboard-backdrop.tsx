import Image from "next/image";

/** Full-bleed atmosphere for the authenticated dashboard workspace. */
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
        className="scale-105 object-cover object-center"
      />
      {/* Light: warm charcoal veil so the photo reads industrial, not washed white */}
      <div className="absolute inset-0 bg-[hsl(28_16%_14%/0.34)] dark:bg-background/82" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(34_18%_92%/0.78)] via-[hsl(32_12%_88%/0.52)] to-[hsl(26_20%_18%/0.42)] dark:from-background/40 dark:via-transparent dark:to-background/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(36_20%_96%/0.35),transparent_55%)] dark:hidden" />
    </div>
  );
}
