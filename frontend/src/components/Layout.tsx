import { useState } from "react";
import { BarChart3, Boxes, Building2, FolderKanban, History, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RoleGuard } from "./RoleGuard";
import { RoleBadge } from "./Badges";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 border-l-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "border-brass-400 bg-white/[0.06] text-white"
      : "border-transparent text-ink-200/80 hover:border-ink-200/40 hover:bg-white/[0.04] hover:text-white"
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  function closeNav() {
    setIsNavOpen(false);
  }

  return (
    <div className="bg-dot-grid min-h-screen bg-parchment">
      {/* Slim top bar with hamburger, shown below the lg breakpoint only */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 shadow-sm lg:hidden">
        <button
          onClick={() => setIsNavOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition-colors duration-150 hover:bg-parchment-dark"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brass-600">
            <Boxes className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold text-ink">GuildWork</span>
        </div>
      </div>

      {/* Backdrop for the mobile/tablet drawer */}
      {isNavOpen && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={closeNav} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 transform flex-col bg-ink transition-transform duration-200 ease-out lg:translate-x-0 ${
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brass-500">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-white">GuildWork</span>
          </div>
          <button
            onClick={closeNav}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-200 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-1 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brass-400/80">Roster</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 py-2" onClick={closeNav}>
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
          <RoleGuard allow={["ADMIN"]}>
            <NavLink to="/audit-log" className={navLinkClass}>
              <History className="h-4 w-4" />
              Audit log
            </NavLink>
          </RoleGuard>
        </nav>

        <div className="border-t border-white/10 p-4">
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
            className="flex w-full items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-ink-200 transition-colors duration-150 hover:border-white/25 hover:bg-white/5 hover:text-white"
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
