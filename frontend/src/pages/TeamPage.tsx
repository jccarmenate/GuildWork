import { useState } from "react";
import { Users, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useDevelopers, useMyDeveloperProfile, useAddMySkill, useRemoveMySkill, useUpdateMyProfile } from "../api/developers";
import { useWorkloadAnalytics } from "../api/analytics";
import { useSkills } from "../api/skills";
import { RoleGuard } from "../components/RoleGuard";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import { apiFetch } from "../api/client";
import type { UserRole } from "../api/types";

function TeamRosterView() {
  const [page, setPage] = useState(1);
  const developers = useDevelopers({ page });
  const workload = useWorkloadAnalytics();
  const { user } = useAuth();

  async function changeRole(userId: string, role: UserRole) {
    await apiFetch(`/api/auth/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
  }

  const workloadByDevId = new Map(workload.data?.map((w) => [w.developerId, w]));

  if (developers.isLoading) {
    return <Spinner label="Loading team..." />;
  }
  if (!developers.data || developers.data.items.length === 0) {
    return <EmptyState icon={Users} title="No developers yet" />;
  }

  return (
    <div>
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment text-ink-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Seniority</th>
              <th className="px-4 py-2">Skills</th>
              <th className="px-4 py-2">Mentor</th>
              <th className="px-4 py-2">Active projects</th>
              <th className="px-4 py-2">Open bugs</th>
              {user?.role === "ADMIN" && <th className="px-4 py-2">Role</th>}
            </tr>
          </thead>
          <tbody>
            {developers.data?.items.map((d) => {
              const w = workloadByDevId.get(d.id);
              return (
                <tr key={d.id} className="border-t border-line transition-colors duration-150 hover:bg-parchment">
                  <td className="px-4 py-2 font-medium text-ink">{d.user.name}</td>
                  <td className="px-4 py-2 text-ink-500">{d.seniority}</td>
                  <td className="px-4 py-2 text-ink-500">{d.skills.map((s) => s.skill.name).join(", ") || "-"}</td>
                  <td className="px-4 py-2 text-ink-500">{d.mentor?.user.name ?? "-"}</td>
                  <td className="px-4 py-2 text-ink-500">{w?.activeAssignments ?? "-"}</td>
                  <td className="px-4 py-2 text-ink-500">{w?.openBugs ?? "-"}</td>
                  {user?.role === "ADMIN" && (
                    <td className="px-4 py-2">
                      <select
                        defaultValue="DEVELOPER"
                        onChange={(e) => void changeRole(d.userId, e.target.value as UserRole)}
                        className="rounded-md border border-line px-2 py-1 text-xs focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
                      >
                        <option value="DEVELOPER">Developer</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    <Pagination
      page={developers.data!.page}
      pageSize={developers.data!.pageSize}
      total={developers.data!.total}
      onPageChange={setPage}
    />
    </div>
  );
}

function MyProfileView() {
  const profile = useMyDeveloperProfile();
  const skills = useSkills();
  const addSkill = useAddMySkill();
  const removeSkill = useRemoveMySkill();
  const updateProfile = useUpdateMyProfile();
  const [bio, setBio] = useState(profile.data?.bio ?? "");

  if (profile.isLoading) return <Spinner label="Loading your profile..." />;
  if (!profile.data) return <p className="text-sm text-red-600">Could not load your profile.</p>;

  const mySkillIds = new Set(profile.data.skills.map((s) => s.skillId));

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-ink-600">
          {profile.data.user.name} — {profile.data.seniority}
        </h2>
        <p className="mb-2 text-sm text-ink-500">Mentor: {profile.data.mentor?.user.name ?? "None assigned"}</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the team about yourself..."
          className="mb-2 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
        />
        <button
          onClick={() => updateProfile.mutate({ bio })}
          className="rounded-md bg-brass-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-brass-700 active:scale-[0.98]"
        >
          Save bio
        </button>
      </section>

      <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Your skills</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {profile.data.skills.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1.5 rounded-full bg-brass-50 px-3 py-1 text-xs font-medium text-brass-700"
            >
              {s.skill.name} ({s.proficiency})
              <button
                onClick={() => removeSkill.mutate(s.skillId)}
                className="text-brass-400 transition-colors duration-150 hover:text-brass-700"
                aria-label={`Remove ${s.skill.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) addSkill.mutate({ skillId: e.target.value });
            e.target.value = "";
          }}
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
        >
          <option value="">Add a skill...</option>
          {skills.data
            ?.filter((s) => !mySkillIds.has(s.id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </section>
    </div>
  );
}

export function TeamPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">Team</h1>
      <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
        <TeamRosterView />
      </RoleGuard>
      <RoleGuard allow={["DEVELOPER"]}>
        <MyProfileView />
      </RoleGuard>
    </div>
  );
}
