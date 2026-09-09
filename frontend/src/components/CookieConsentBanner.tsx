import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "guildwork:cookie-notice-ack";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setIsVisible(true);
      }
    } catch {
      // Storage can throw in a locked-down browser context — just skip the banner.
    }
  }, []);

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to persist to, but still dismiss for this page view.
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] animate-fade-in-up">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-ink-600">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-brass-600" />
          <span>
            GuildWork uses only one strictly necessary cookie to keep you signed in — no tracking or advertising
            cookies. See our{" "}
            <Link to="/privacy" className="font-medium text-brass-600 hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </p>
        <button
          onClick={acknowledge}
          className="w-full shrink-0 rounded-md bg-brass-600 px-4 py-2 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:scale-[1.02] hover:bg-brass-700 active:scale-[0.98] sm:w-auto"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
