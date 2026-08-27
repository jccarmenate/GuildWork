import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Boxes, CheckCircle2 } from "lucide-react";
import { apiFetch, ApiError } from "../api/client";
import { ParticleNetworkBackground } from "../components/ParticleNetworkBackground";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-parchment via-parchment to-brass-50 px-4">
      <ParticleNetworkBackground />
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="h-1.5 bg-brass-600" />
        <div className="p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brass-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink">GuildWork</h1>
              <p className="text-xs text-ink-500">Choose a new password</p>
            </div>
          </div>

          {isDone ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="text-sm text-ink-600">Password updated. Please sign in again.</p>
              <Link to="/login" className="text-sm font-medium text-brass-600 hover:text-brass-700 hover:underline">
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-600">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink-600">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-brass-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-brass-700 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
