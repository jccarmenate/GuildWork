import { BarChart3, Boxes, Building2, FolderKanban, LayoutDashboard, LogOut, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RoleGuard } from "./RoleGuard";
import { RoleBadge } from "./Badges";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-slate-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">GuildWork</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
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
            className="flex w-full items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="ml-60 min-h-screen px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
