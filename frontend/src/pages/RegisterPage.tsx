import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { ParticleNetworkBackground } from "../components/ParticleNetworkBackground";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name);
      navigate("/", { replace: true });
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
            <h1 className="text-xl font-semibold text-ink">Create your account</h1>
          </div>
          <p className="mb-6 text-sm text-ink-500">
            Self-registration creates a Developer account. Project Manager and Admin accounts are provisioned by an
            administrator.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink-600">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
              />
            </div>
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
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-600">
                Password
              </label>
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brass-600 hover:text-brass-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
