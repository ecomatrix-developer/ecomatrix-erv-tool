"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LoginModal } from "@/components/login-modal";
import { getCurrentUserSession } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Wind,
  Thermometer,
  Coins,
  Gauge,
  SlidersHorizontal,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Layers,
} from "lucide-react";

const BLUE = "#1E4FD8";

const CORE_CAPABILITIES = [
  {
    icon: Thermometer,
    title: "Model Thermal Loads",
    description:
      "Model preheating, post-heating, cooling, and humidification loads across all 8,760 annual climate hours.",
  },
  {
    icon: Coins,
    title: "Calculate Energy, Cost & GHG",
    description:
      "Calculate total energy use (MWh), annual operational cost ($), and greenhouse gas emissions (Tons CO₂).",
  },
  {
    icon: SlidersHorizontal,
    title: "Simulate Tech & Control Logic",
    description:
      "Simulate performance across different ERV technologies (Enthalpy wheels, sensible wheels, plate exchangers) and control strategies.",
  },
  {
    icon: BarChart3,
    title: "Compare 4 Design Alternatives",
    description:
      "Compare up to four design alternatives against a baseline case side-by-side in one clear comparative analysis table.",
  },
  {
    icon: Wind,
    title: "Visualize System Schematic",
    description:
      "Visualize system configuration and airflow process energy flow in a clean, interactive system schematic diagram.",
  },
  {
    icon: Gauge,
    title: "Financial ROI & Payback Estimates",
    description:
      "Estimate capital costs, annual operational savings ($/yr), and simple payback periods in minutes.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLaunchClick = async () => {
    try {
      const session = await getCurrentUserSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setIsLoginModalOpen(true);
      }
    } catch {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Top Header */}
      <SiteHeader onLaunchClick={handleLaunchClick} />

      {/* In-Place Login & Password Reset Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Hero Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-300 backdrop-blur-md">
                <Sparkles className="size-3.5 text-blue-400" /> ECO Matrix Engineering Platform
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance leading-tight">
                Welcome to the ERV Tool by ECO Matrix Solutions
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                The ECO Matrix ERV Tool is a purpose-built platform for modeling the energy performance of Energy Recovery Ventilation systems — helping mechanical engineers make smarter, faster, and more sustainable design decisions.
              </p>

              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-xs text-slate-300 backdrop-blur-sm space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="size-4 text-emerald-400" /> Built on Real Mechanical Workflows &amp; Hourly Climate Data
                </div>
                <p className="text-slate-400">
                  Backed by robust 8,760-hour annual weather simulations across global cities to deliver credible, decision-ready data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  onClick={handleLaunchClick}
                  size="lg"
                  className="font-bold text-white shadow-lg hover:opacity-90 transition-all scale-105"
                  style={{ backgroundColor: BLUE }}
                >
                  <span className="flex items-center gap-2">
                    Launch ERV Tool <ArrowRight className="size-4" />
                  </span>
                </Button>

                <Button asChild size="lg" variant="outline" className="border-slate-600 bg-slate-800/80 font-bold text-white hover:bg-slate-700 hover:text-white">
                  <Link href="#video-demo" className="gap-2">
                    <Play className="size-4 text-blue-400 fill-blue-400" /> Watch Video Walkthrough
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero Right Canvas Card */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl">
                <div className="rounded-xl bg-slate-950 p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <Wind className="size-4 text-[#1E4FD8]" /> Interactive Airflow Animation
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Live Model
                    </span>
                  </div>

                  <div className="flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden">
                    <video
                      ref={(el) => {
                        if (el) el.muted = true;
                      }}
                      src="/generate_me_an_animation_or_gi.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="h-auto w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED VIDEO DEMO SECTION ("HOW IT WORKS") */}
      <section id="video-demo" className="bg-slate-900 text-white py-20 border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 px-3 py-1 text-xs font-bold text-blue-400">
              <Play className="size-3.5 fill-blue-400" /> Video Demonstration
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              See How the ERV Tool Works in Action
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400">
              Watch a quick video walkthrough of setting up climate parameters, ERV wheel specs, heating &amp; cooling stages, and side-by-side payback analysis.
            </p>
          </div>

          {/* HTML5 VIDEO PLAYER CONTAINER */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-black shadow-2xl">
            <video
              className="w-full h-auto aspect-video object-cover"
              controls
              preload="auto"
            >
              <source
                src="https://storage.googleapis.com/ecomatrix-video-bucket/trail_video.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-4 text-emerald-400" /> High-Definition Video Walkthrough
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-4 text-emerald-400" /> Full Workflow Demonstration
            </span>
            <button
              onClick={handleLaunchClick}
              className="font-bold text-[#1E4FD8] hover:underline"
            >
              Try the ERV Tool Now &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E4FD8]">
              <Layers className="size-3.5" /> Engineering Capabilities
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Model &amp; Compare ERV Performance
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-500">
              Purpose-built tools to evaluate thermal loads, energy consumption, cost savings, and greenhouse gas impact in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1E4FD8]/40 hover:bg-white hover:shadow-md"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E4FD8] group-hover:bg-[#1E4FD8] group-hover:text-white transition-colors">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENGINEERING CREDIBILITY & VALUE BANNER */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#1E4FD8] text-white shadow-md">
              <FileCheck className="size-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-snug">
              &ldquo;Whether you&apos;re presenting options to a client or optimizing system design, this tool gives you the data you need clearly, quickly, and credibly.&rdquo;
            </h3>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Get started today and explore how high-performance ventilation can pay back for your project and the planet.
            </p>

            <div className="pt-2">
              <Button
                onClick={handleLaunchClick}
                size="lg"
                className="font-bold text-white shadow-lg hover:opacity-90"
                style={{ backgroundColor: BLUE }}
              >
                <span className="flex items-center gap-2">
                  Get Started with ERV Tool <ArrowRight className="size-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to Model Your ERV Project?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Configure your BaseCase and compare up to four alternative ERV technologies in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={handleLaunchClick}
              size="lg"
              className="font-bold text-white shadow-md hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              <span className="flex items-center gap-2">
                Launch ERV Calculator <ArrowRight className="size-4" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs font-semibold text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="Eco Matrix" width={140} height={40} className="h-6 w-auto object-contain" />
            <span>&copy; {new Date().getFullYear()} ECO Matrix Solutions. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={handleLaunchClick} className="hover:text-slate-900 transition-colors">
              ERV Tool
            </button>
            <a href="https://ecomatrix.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E4FD8] transition-colors">
              ecomatrix.io
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
