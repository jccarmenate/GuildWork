import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Boxes } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function LegalPageLayout({ title, updated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-parchment px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brass-600 hover:text-brass-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <div className="h-1.5 bg-brass-600" />
          <div className="p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brass-600">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-ink">{title}</h1>
                <p className="text-xs text-ink-500">Last updated {updated}</p>
              </div>
            </div>

            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong className="font-semibold">Draft.</strong> This page describes what GuildWork actually stores
              and does today, but it has not been reviewed by legal counsel. Have a lawyer review it before relying
              on it for a real deployment.
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-ink-600">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
