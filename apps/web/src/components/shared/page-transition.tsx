"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageFade } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={cn("w-full", className)}
      initial={pageFade.initial}
      animate={pageFade.animate}
      exit={pageFade.exit}
      transition={pageFade.transition}
    >
      {children}
    </motion.div>
  );
}
