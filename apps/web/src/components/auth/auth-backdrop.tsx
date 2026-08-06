import Image from "next/image";

export function AuthBackdrop() {
  return (
    <>
      <Image
        src="/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-cyan-950/55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_40%,rgba(220,38,38,0.22),transparent_55%)]"
      />
    </>
  );
}
