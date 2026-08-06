import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function BrandLogo({
  className,
  size = 36,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/FLAMELOGO.png"
      alt="FireGuard Fire Alarm System"
      width={size}
      height={size}
      priority={priority}
      className={cn("h-auto w-auto max-w-full object-contain", className)}
    />
  );
}
