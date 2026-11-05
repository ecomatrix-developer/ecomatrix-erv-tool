"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  onLaunchClick?: () => void;
}

export function SiteHeader({ onLaunchClick }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        {/* Larger Brand Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2 transition-transform hover:scale-105">
          <Image
            src="/logo.png"
            alt="Eco Matrix Solutions"
            width={342}
            height={64}
            className="h-7 w-auto shrink-0 object-contain sm:h-11"
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="flex shrink-0 items-center gap-3 sm:gap-6">
          <Link
            href="#video-demo"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 md:inline-block"
          >
            How It Works
          </Link>
          <Link
            href="#features"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 md:inline-block"
          >
            Capabilities
          </Link>

          <Button
            onClick={onLaunchClick}
            size="sm"
            className="font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1E4FD8" }}
          >
            <span className="hidden sm:inline">Launch ERV Tool</span>
            <span className="sm:hidden">Launch</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
