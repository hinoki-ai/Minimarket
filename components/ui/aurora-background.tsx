import React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-[100vh] w-full bg-transparent",
        className,
      )}
      style={{ isolation: 'isolate' }}
      {...props}
    >
      {/* Inject critical keyframes directly into component */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes aurora {
            0% {
              background-position: 50% 50%, 50% 50%;
              transform: translateZ(0);
            }
            50% {
              background-position: 200% 50%, 200% 50%;
            }
            100% {
              background-position: 350% 50%, 350% 50%;
              transform: translateZ(0);
            }
          }
        `
      }} />
      {/* Background decorative elements - ensure they don't interfere with interactions */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
        style={{
          ["--aurora" as any]:
            "repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)",
          ["--dark-gradient" as any]:
            "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
          ["--white-gradient" as any]:
            "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
          ["--blue-300" as any]: "#93c5fd",
          ["--blue-400" as any]: "#60a5fa",
          ["--blue-500" as any]: "#3b82f6",
          ["--indigo-300" as any]: "#a5b4fc",
          ["--violet-200" as any]: "#ddd6fe",
          ["--black" as any]: "#000",
          ["--white" as any]: "#fff",
          ["--transparent" as any]: "transparent",
        } as React.CSSProperties}
      >
        <div
          className={cn(
            "after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-50 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:scroll] after:mix-blend-difference after:content-[''] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]",
          )}
          aria-hidden="true"
        />
      </div>
      {/* Content container with proper z-index and positioning */}
      <div className="relative z-30 pointer-events-auto" style={{ isolation: 'isolate' }}>
        {children}
      </div>
    </div>
  );
}

