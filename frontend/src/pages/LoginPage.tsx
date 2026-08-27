import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Boxes } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { ParticleNetworkBackground } from "../components/ParticleNetworkBackground";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
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
              <p className="text-xs text-ink-500">Sign in to your account</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-600">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-brass-600 hover:text-brass-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-500">
            New developer?{" "}
            <Link to="/register" className="font-medium text-brass-600 hover:text-brass-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
