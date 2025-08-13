"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface CometCardProps {
  rotateDepth?: number;
  translateDepth?: number;
  className?: string;
  children: ReactNode;
}

export function CometCard({
  rotateDepth = 17.5,
  translateDepth = 20,
  className,
  children,
}: CometCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    // Respect reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (event.clientX - centerX) / (rect.width / 2);
    const percentY = (event.clientY - centerY) / (rect.height / 2);

    const rotateY = percentX * rotateDepth;
    const rotateX = -percentY * rotateDepth;

    const translateX = percentX * translateDepth;
    const translateY = percentY * translateDepth;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    content.style.transform = `translate3d(${translateX}px, ${translateY}px, 0.01px)`;
  };

  const reset = () => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;

    card.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    content.style.transform = `translate3d(0px, 0px, 0.01px)`;
  };

  return (
    <div
      className={cn(
        "relative will-change-transform transition-transform duration-200 ease-out",
        "[transform-style:preserve-3d]",
        className
      )}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerUp={reset}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 [transform:translateZ(1px)]" />
      <div ref={contentRef} className="[transform:translateZ(0.01px)]">
        {children}
      </div>
    </div>
  );
}