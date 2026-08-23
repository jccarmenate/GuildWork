import { useState } from "react";
import { BarChart3, Boxes, Building2, FolderKanban, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RoleGuard } from "./RoleGuard";
import { RoleBadge } from "./Badges";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  function closeNav() {
    setIsNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Slim top bar with hamburger, shown below the lg breakpoint only */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <button
          onClick={() => setIsNavOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <Boxes className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">GuildWork</span>
        </div>
      </div>

      {/* Backdrop for the mobile/tablet drawer */}
      {isNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 transform flex-col bg-gradient-to-b from-slate-900 to-slate-950 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">GuildWork</span>
          </div>
          <button
            onClick={closeNav}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2" onClick={closeNav}>
          <NavLink to="/" end className={navLinkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={navLinkClass}>
            <FolderKanban className="h-4 w-4" />
            Projects
          </NavLink>
          <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
            <NavLink to="/clients" className={navLinkClass}>
              <Building2 className="h-4 w-4" />
              Clients
            </NavLink>
          </RoleGuard>
          <NavLink to="/team" className={navLinkClass}>
            <Users className="h-4 w-4" />
            Team
          </NavLink>
          <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
            <NavLink to="/analytics" className={navLinkClass}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </NavLink>
          </RoleGuard>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            {user?.role && (
              <div className="mt-1.5">
                <RoleBadge role={user.role} />
              </div>
            )}
          </div>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
