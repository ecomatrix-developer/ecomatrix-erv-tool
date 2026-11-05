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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        {/* Larger Brand Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Image
            src="/logo.png"
            alt="Eco Matrix Solutions"
            width={342}
            height={64}
            className="h-11 w-auto shrink-0 object-contain"
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="#video-demo"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
          >
            How It Works
          </Link>
          <Link
            href="#features"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
          >
            Capabilities
          </Link>

          <Button
            onClick={onLaunchClick}
            size="sm"
            className="font-bold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1E4FD8" }}
          >
            Launch ERV Tool
          </Button>
        </nav>
      </div>
    </header>
  );
}
