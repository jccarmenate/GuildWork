import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RoleGuard } from "./RoleGuard";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-slate-900">GuildWork</span>
            <nav className="flex gap-1">
              <NavLink to="/" end className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/projects" className={linkClass}>
                Projects
              </NavLink>
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <NavLink to="/clients" className={linkClass}>
                  Clients
                </NavLink>
              </RoleGuard>
              <NavLink to="/team" className={linkClass}>
                Team
              </NavLink>
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <NavLink to="/analytics" className={linkClass}>
                  Analytics
                </NavLink>
              </RoleGuard>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>
              {user?.name} <span className="text-slate-400">({user?.role})</span>
            </span>
            <button
              onClick={() => void logout()}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
