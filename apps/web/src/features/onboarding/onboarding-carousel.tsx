"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { BrandLogo } from "@/components/shared/brand-logo";
import { markOnboardingComplete } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { ONBOARDING_SLIDES } from "./slides";

const SWIPE_THRESHOLD = 50;

export function OnboardingCarousel() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[index];
  const isLast = index === ONBOARDING_SLIDES.length - 1;
  const Icon = slide.icon;

  const finish = useCallback(() => {
    markOnboardingComplete();
    router.replace("/login");
  }, [router]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, ONBOARDING_SLIDES.length - 1));
  }, [finish, isLast]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  return (
    <div className="relative z-10 flex min-h-dvh w-full flex-col px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} priority className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              FireGuard
            </p>
            <p className="text-[11px] text-white/55">IoT Platform</p>
          </div>
        </div>
        {!isLast ? (
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Skip
          </button>
        ) : (
          <span className="w-12" aria-hidden="true" />
        )}
      </header>

      <motion.div
        className="flex flex-1 flex-col justify-center py-10"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={onDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-md"
          >
            <div className="auth-glass mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-[2rem] sm:h-44 sm:w-44">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-white/10 text-white ring-1 ring-white/20">
                <Icon className="h-10 w-10" aria-hidden="true" />
              </div>
            </div>

            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {slide.eyebrow}
            </p>
            <h1 className="mt-3 text-center text-[1.85rem] font-semibold tracking-[-0.03em] text-white text-balance sm:text-[2.1rem]">
              {slide.title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-white/75">
              {slide.description}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-white/50">
              {slide.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <footer className="mx-auto w-full max-w-md space-y-5">
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Onboarding progress"
        >
          {ONBOARDING_SLIDES.map((s, i) => {
            const active = i === index;
            const done = i < index;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  active || done ? "bg-white" : "bg-white/25"
                )}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="h-12 flex-1 rounded-full border border-white/25 bg-white/5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            className="auth-glass-button h-12 flex-[1.4] rounded-full text-[15px] font-semibold text-white"
          >
            {isLast ? "Continue to Login" : "Next"}
          </button>
        </div>

        <p className="text-center text-[12px] text-white/45">
          Swipe or tap Next to continue
        </p>
      </footer>
    </div>
  );
}
