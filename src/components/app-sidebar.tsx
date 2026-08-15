"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Zap,
  FileOutput,
  History,
  Settings,
  ShieldCheck,
  Pin,
  PinOff,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout, getCurrentUserSession } from "@/app/actions/auth";
import { useHasUnsavedChanges, setHasUnsavedChanges } from "@/lib/unsaved-changes-store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "ERV Simulator", icon: Zap },
  { href: "/reports", label: "Reports & Exports", icon: FileOutput },
  { href: "/history", label: "Past Runs", icon: History },
  { href: "/admin", label: "Admin Portal", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hasUnsavedChanges = useHasUnsavedChanges();

  useEffect(() => {
    setMounted(true);
    getCurrentUserSession().then((session) => {
      if (session?.role === "admin" || session?.email === "admin@gmail.com") {
        setIsAdmin(true);
      }
    });
  }, []);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/admin") return mounted && isAdmin;
    return true;
  });

  const expanded = pinned || hovered;

  function handleNavClick(e: React.MouseEvent, href: string) {
    if (hasUnsavedChanges && href !== pathname) {
      e.preventDefault();
      setPendingHref(href);
    }
  }

  function leaveAnyway() {
    if (!pendingHref) return;
    setHasUnsavedChanges(false);
    router.push(pendingHref);
    setPendingHref(null);
  }

  return (
    <>
      {/* Reserves layout width for the collapsed rail so hover-expansion overlays
       * content instead of reflowing the page. */}
      <div className="w-[68px] shrink-0" />
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed top-0 left-0 z-[100] flex h-screen flex-col justify-between bg-slate-800 text-white shadow-xl transition-[width] duration-200 ease-out",
          expanded ? "w-60" : "w-[68px]",
        )}
      >
        <div>
          <div className="flex items-center justify-center px-4 py-6 w-full min-h-[72px]">
            {expanded ? (
              <Image
                src="/brand/logo-light.png"
                alt="Eco Matrix"
                width={200}
                height={60}
                priority
                className="h-14 w-auto max-w-full shrink-0 object-contain mx-auto"
              />
            ) : (
              <Image
                src="/brand/favicon.png"
                alt="Eco Matrix"
                width={36}
                height={36}
                priority
                className="h-9 w-9 shrink-0 object-contain mx-auto"
              />
            )}
          </div>

          <nav className="space-y-1 px-3">
            {visibleNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onClick={(e) => handleNavClick(e, item.href)}
                  title={!expanded ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    !expanded && "justify-center px-0",
                    active ? "bg-[#1E4FD8] text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 px-3 pb-4">
          <button
            type="button"
            onClick={() => logout()}
            title={!expanded ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200",
              !expanded && "justify-center px-0",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {expanded && <span>Log out</span>}
          </button>

          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            title={!expanded ? "Pin sidebar open" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200",
              !expanded && "justify-center px-0",
            )}
          >
            {pinned ? <PinOff className="size-[18px] shrink-0" /> : <Pin className="size-[18px] shrink-0" />}
            {expanded && <span>{pinned ? "Unpin" : "Pin open"}</span>}
          </button>
        </div>
      </aside>

      {pendingHref && (() => {
        const targetNav = NAV_ITEMS.find((n) => n.href === pendingHref);
        const targetLabel = targetNav ? targetNav.label : "another page";
        return (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Leave Simulator Page?</h2>
                  <p className="text-xs text-slate-500">Navigation confirmation</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                You are currently on the ERV Simulator page. Your simulation progress is saved, but are you sure you want to navigate away to <span className="font-bold text-slate-900">&quot;{targetLabel}&quot;</span>?
              </p>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setPendingHref(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Stay on Simulator
                </button>
                <button
                  type="button"
                  onClick={leaveAnyway}
                  className="rounded-xl bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Proceed to {targetLabel.split(" ")[0]}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
