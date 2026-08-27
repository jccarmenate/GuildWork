import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Boxes, MailCheck } from "lucide-react";
import { apiFetch } from "../api/client";
import { ParticleNetworkBackground } from "../components/ParticleNetworkBackground";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setIsSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
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
              <p className="text-xs text-ink-500">Reset your password</p>
            </div>
          </div>

          {isSent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <MailCheck className="h-8 w-8 text-brass-600" />
              <p className="text-sm text-ink-600">
                If that email is registered, a reset link has been sent. It expires in 1 hour.
              </p>
              <Link to="/login" className="text-sm font-medium text-brass-600 hover:text-brass-700 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-600">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
              <p className="text-center text-sm text-ink-500">
                <Link to="/login" className="font-medium text-brass-600 hover:text-brass-700 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
