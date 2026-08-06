import Image from "next/image";

/** Full-bleed atmosphere for the authenticated dashboard workspace. */
export function DashboardBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/DashboardBack.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Keep cards/text readable over the photo */}
      <div className="absolute inset-0 bg-background/78 dark:bg-background/82" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-transparent to-background/55" />
    </div>
  );
}
