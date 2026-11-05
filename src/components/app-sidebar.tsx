"use client";

import { useState, useEffect, useTransition } from "react";
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
  AlertTriangle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUserSession, logout } from "@/app/actions/auth";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hasUnsavedChanges = useHasUnsavedChanges();
  const [logoutPending, setLogoutPending] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();

  function doLogout() {
    startLogoutTransition(async () => {
      await logout();
    });
  }

  function handleLogoutClick() {
    setMobileOpen(false);
    if (hasUnsavedChanges) {
      setLogoutPending(true);
      return;
    }
    doLogout();
  }

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
    // Always close the mobile drawer on nav: either the link proceeds (drawer
    // should close behind it) or it's blocked below (drawer should close so
    // the unsaved-changes dialog isn't hidden underneath it).
    setMobileOpen(false);
    if (hasUnsavedChanges && href !== pathname) {
      e.preventDefault();
      setPendingHref(href);
    }
  }

  function leaveAnyway() {
    if (logoutPending) {
      setHasUnsavedChanges(false);
      setLogoutPending(false);
      doLogout();
      return;
    }
    if (!pendingHref) return;
    setHasUnsavedChanges(false);
    router.push(pendingHref);
    setPendingHref(null);
  }

  return (
    <>
      {/* ---------- MOBILE / TABLET TOP BAR (below lg) ---------- */}
      <header className="sticky top-0 z-[90] flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
        >
          <Menu className="size-5" />
        </button>
        <Image
          src="/brand/favicon.png"
          alt="Eco Matrix"
          width={32}
          height={32}
          priority
          className="h-8 w-8 shrink-0 object-contain"
        />
        <div className="size-10" aria-hidden="true" />
      </header>

      {/* ---------- MOBILE / TABLET DRAWER (below lg) ---------- */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[105] bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150 lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[110] flex w-72 max-w-[82vw] flex-col justify-between bg-white shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <Image
              src="/logo.png"
              alt="Eco Matrix"
              width={176}
              height={33}
              className="h-auto w-[160px] max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="space-y-1 p-3">
            {visibleNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors",
                    active ? "bg-[#1E4FD8] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="size-[18px] shrink-0" />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>

      {/* ---------- DESKTOP / LAPTOP HOVER SIDEBAR (lg and up) ---------- */}
      {/* Reserves layout width for the collapsed rail so hover-expansion overlays
       * content instead of reflowing the page. */}
      <div className="hidden w-[68px] shrink-0 lg:block" />
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed top-0 left-0 z-[100] hidden h-screen flex-col justify-between border-r border-slate-200 bg-white text-slate-900 shadow-xl transition-[width] duration-200 ease-out lg:flex",
          expanded ? "w-60" : "w-[68px]",
        )}
      >
        <div>
          <div className="flex items-center justify-center border-b border-slate-100 px-4 py-6 w-full min-h-[72px]">
            {expanded ? (
              <Image
                src="/logo.png"
                alt="Eco Matrix"
                width={176}
                height={33}
                priority
                className="h-auto w-[176px] max-w-full shrink-0 object-contain mx-auto"
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
                    active ? "bg-[#1E4FD8] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-slate-100 px-3 py-4">
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            title={!expanded ? "Pin sidebar open" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
              !expanded && "justify-center px-0",
            )}
          >
            {pinned ? <PinOff className="size-[18px] shrink-0" /> : <Pin className="size-[18px] shrink-0" />}
            {expanded && <span>{pinned ? "Unpin" : "Pin open"}</span>}
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            title={!expanded ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60",
              !expanded && "justify-center px-0",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {expanded && <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>}
          </button>
        </div>
      </aside>

      {(pendingHref || logoutPending) && (() => {
        const targetNav = NAV_ITEMS.find((n) => n.href === pendingHref);
        const targetLabel = logoutPending ? "the Home Page" : targetNav ? targetNav.label : "another page";
        return (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 sm:p-6">
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
              <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPendingHref(null);
                    setLogoutPending(false);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Stay on Simulator
                </button>
                <button
                  type="button"
                  onClick={leaveAnyway}
                  className="rounded-xl bg-[#1E4FD8] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {logoutPending ? "Log Out Anyway" : `Proceed to ${targetLabel.split(" ")[0]}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
