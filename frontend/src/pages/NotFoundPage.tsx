import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
      <div className="rounded-full bg-indigo-100 p-4">
        <Compass className="h-8 w-8 text-indigo-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-2 font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
