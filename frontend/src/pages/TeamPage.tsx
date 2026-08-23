import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useDevelopers, useMyDeveloperProfile, useAddMySkill, useRemoveMySkill, useUpdateMyProfile } from "../api/developers";
import { useWorkloadAnalytics } from "../api/analytics";
import { useSkills } from "../api/skills";
import { RoleGuard } from "../components/RoleGuard";
import { apiFetch } from "../api/client";
import type { UserRole } from "../api/types";

function TeamRosterView() {
  const developers = useDevelopers();
  const workload = useWorkloadAnalytics();
  const { user } = useAuth();

  async function changeRole(userId: string, role: UserRole) {
    await apiFetch(`/api/auth/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
  }

  const workloadByDevId = new Map(workload.data?.map((w) => [w.developerId, w]));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
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
          {developers.data?.map((d) => {
            const w = workloadByDevId.get(d.id);
            return (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{d.user.name}</td>
                <td className="px-4 py-2 text-slate-600">{d.seniority}</td>
                <td className="px-4 py-2 text-slate-600">{d.skills.map((s) => s.skill.name).join(", ") || "-"}</td>
                <td className="px-4 py-2 text-slate-600">{d.mentor?.user.name ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{w?.activeAssignments ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{w?.openBugs ?? "-"}</td>
                {user?.role === "ADMIN" && (
                  <td className="px-4 py-2">
                    <select
                      defaultValue="DEVELOPER"
                      onChange={(e) => void changeRole(d.userId, e.target.value as UserRole)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
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
  );
}

function MyProfileView() {
  const profile = useMyDeveloperProfile();
  const skills = useSkills();
  const addSkill = useAddMySkill();
  const removeSkill = useRemoveMySkill();
  const updateProfile = useUpdateMyProfile();
  const [bio, setBio] = useState(profile.data?.bio ?? "");

  if (profile.isLoading) return <p className="text-sm text-slate-500">Loading your profile...</p>;
  if (!profile.data) return <p className="text-sm text-red-600">Could not load your profile.</p>;

  const mySkillIds = new Set(profile.data.skills.map((s) => s.skillId));

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          {profile.data.user.name} — {profile.data.seniority}
        </h2>
        <p className="mb-2 text-sm text-slate-500">Mentor: {profile.data.mentor?.user.name ?? "None assigned"}</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the team about yourself..."
          className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => updateProfile.mutate({ bio })}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          Save bio
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Your skills</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {profile.data.skills.map((s) => (
            <span key={s.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs">
              {s.skill.name} ({s.proficiency})
              <button onClick={() => removeSkill.mutate(s.skillId)} className="text-red-600">
                x
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
      <h1 className="mb-4 text-xl font-bold text-slate-900">Team</h1>
      <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
        <TeamRosterView />
      </RoleGuard>
      <RoleGuard allow={["DEVELOPER"]}>
        <MyProfileView />
      </RoleGuard>
    </div>
  );
}
