import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-br from-parchment to-parchment-dark px-4 text-center text-ink-500">
      <div className="rounded-full bg-brass-100 p-4">
        <Compass className="h-8 w-8 text-brass-600" />
      </div>
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-ink-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-2 font-medium text-brass-600 hover:text-brass-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
