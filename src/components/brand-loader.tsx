"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export function BrandLoader({
  size = "md",
  text = "Loading...",
  subtext,
  fullScreen = false,
  overlay = false,
  className,
}: BrandLoaderProps) {
  const outerRingSizes = {
    sm: "size-8 border-2",
    md: "size-14 border-3",
    lg: "size-20 border-4",
    xl: "size-28 border-[5px]",
  };

  const logoSizes = {
    sm: 18,
    md: 32,
    lg: 48,
    xl: 68,
  };

  const textSizes = {
    sm: "text-xs font-semibold",
    md: "text-sm font-bold",
    lg: "text-base font-extrabold",
    xl: "text-lg font-black",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}>
      {/* Brand Spinner Wrapper */}
      <div className="relative flex items-center justify-center">
        {/* Glowing Background Aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1E4FD8]/20 via-emerald-400/20 to-blue-500/20 blur-lg animate-pulse" />

        {/* Outer Rotating Gradient Ring */}
        <div
          className={cn(
            "rounded-full border-solid border-slate-200 border-t-[#1E4FD8] border-r-emerald-500 animate-spin",
            outerRingSizes[size]
          )}
          style={{ animationDuration: "0.85s" }}
        />

        {/* Inner Counter-rotating Accent Ring (for md+) */}
        {(size === "md" || size === "lg" || size === "xl") && (
          <div
            className="absolute rounded-full border border-dashed border-emerald-400/60 animate-spin"
            style={{
              width: size === "md" ? "42px" : size === "lg" ? "62px" : "86px",
              height: size === "md" ? "42px" : size === "lg" ? "62px" : "86px",
              animationDirection: "reverse",
              animationDuration: "2s",
            }}
          />
        )}

        {/* Center Eco Matrix Logo Icon */}
        <div className="absolute flex items-center justify-center transition-transform hover:scale-105">
          <Image
            src="/brand/favicon.png"
            alt="Eco Matrix"
            width={logoSizes[size]}
            height={logoSizes[size]}
            priority
            className="object-contain drop-shadow-[0_2px_8px_rgba(30,79,216,0.35)] animate-pulse"
          />
        </div>
      </div>

      {/* Loading Label & Subtext */}
      {text && (
        <div className="flex flex-col items-center text-center">
          <p className={cn("text-slate-800 tracking-tight flex items-center gap-1", textSizes[size])}>
            {text}
            <span className="inline-flex">
              <span className="animate-bounce text-[#1E4FD8]" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce text-emerald-500" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce text-[#1E4FD8]" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </p>
          {subtext && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtext}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
        <div className="rounded-3xl border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          {content}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-xs animate-in fade-in duration-150">
        {content}
      </div>
    );
  }

  return content;
}
