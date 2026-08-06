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
      src="/fireguard-logo.png"
      alt="FireGuard"
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
