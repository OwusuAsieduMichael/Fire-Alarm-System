/** Shared Framer Motion presets for purposeful, Apple-like motion. */

export const easeApple = [0.25, 0.1, 0.25, 1] as const;
export const easeSpring = [0.22, 1, 0.36, 1] as const;

export const springSoft = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.8,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
  mass: 0.7,
};

export const pageFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.28, ease: easeApple },
};

export const listItemFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.22, ease: easeApple },
};

export const staggerChild = (index: number, base = 0.04) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: {
    delay: Math.min(index * base, 0.24),
    duration: 0.32,
    ease: easeSpring,
  },
});
