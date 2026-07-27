import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  FileDown,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LogIn,
  ScanSearch,
  Settings,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/config/site";

const features = [
  {
    title: "Dashboard",
    description:
      "Your AI developer command center — stats, quick actions, and recent activity across every module.",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "AI Code Review",
    description:
      "Paste or upload code for multi-language analysis with scored findings, severity, diffs, charts, and history.",
    icon: ScanSearch,
    href: "/reviews",
  },
  {
    title: "Documentation Generator",
    description:
      "Turn source into scoped enterprise docs — API, database, architecture — with quality scoring and export.",
    icon: BookOpen,
    href: "/documentation",
  },
  {
    title: "README Generator",
    description:
      "Ship GitHub-ready READMEs with templates, auto stack detection, live markdown preview, and history.",
    icon: FileText,
    href: "/readme",
  },
  {
    title: "Repository Import",
    description:
      "Import a public GitHub repo, inspect health, stack, tree, and deps, then launch review, docs, or reports.",
    icon: FolderGit2,
    href: "/repositories",
  },
  {
    title: "PDF Reports",
    description:
      "Export branded analysis PDFs from reviews, docs jobs, or repositories with cover pages and score breakdowns.",
    icon: FileDown,
    href: "/reports",
  },
  {
    title: "Settings & Keys",
    description:
      "Manage profile, OpenAI/Anthropic/GitHub keys, model preferences, appearance, notifications, and sessions.",
    icon: Settings,
    href: "/settings",
  },
  {
    title: "Secure Sign-In",
    description:
      "Auth.js credentials login with optional GitHub OAuth — production sessions ready for Vercel.",
    icon: LogIn,
    href: "/login",
  },
] as const;

const workflow = [
  {
    step: "01",
    title: "Import or paste",
    text: "Bring in a GitHub repo or drop source directly into review, docs, or README.",
  },
  {
    step: "02",
    title: "Let AI analyze",
    text: "CodePilot scores quality, security, and clarity with actionable findings.",
  },
  {
    step: "03",
    title: "Export & ship",
    text: "Preview markdown, save history, and download branded PDF reports.",
  },
] as const;

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8%] h-[30rem] w-[30rem] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -right-20 top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-500/15 blur-[110px]" />
        <div className="absolute bottom-[5%] left-1/4 h-[22rem] w-[22rem] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0)_0%,rgba(2,6,23,0.9)_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-lg shadow-cyan-500/20 transition group-hover:scale-[1.03]">
              <Bot className="h-5 w-5 text-white" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-white sm:text-lg">
                {siteConfig.name}
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:block">
                AI Developer Suite
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white sm:inline-flex"
            >
              Features
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-col items-center py-16 text-center sm:py-20 lg:py-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
              Premium AI suite for review, docs & reports
            </div>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Ship better code with{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                AI Precision
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              {siteConfig.description} Review, document, import repos, and
              export PDFs — all in one workspace.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 sm:w-auto"
              >
                Launch App
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              <span>Code Review</span>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span>Docs</span>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span>README</span>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span>Repos</span>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span>PDF Reports</span>
            </div>
          </section>

          <section className="mb-16 grid gap-4 sm:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 text-left backdrop-blur"
              >
                <div className="font-mono text-xs font-semibold tracking-widest text-cyan-400">
                  {item.step}
                </div>
                <h2 className="mt-2 text-base font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </section>

          <section id="features" className="scroll-mt-20 pb-16 sm:pb-20">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Everything in {siteConfig.name}
              </h2>
              <p className="mt-3 text-sm text-slate-400 sm:text-base">
                Eight modules that cover review, docs, repos, reports, and
                account control.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ title, description, icon: Icon, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-300 ring-1 ring-cyan-500/20 transition group-hover:scale-105">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                    {description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 opacity-80 transition group-hover:opacity-100">
                    Open module
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-20 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Ready to accelerate your workflow?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
              Jump into the dashboard or sign in with the demo account to try
              every module end to end.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 sm:w-auto"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-900/60 sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800/80 py-6 text-center text-sm text-slate-500">
          © {year} {siteConfig.name}. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
