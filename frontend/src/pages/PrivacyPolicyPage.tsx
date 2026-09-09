import { Link } from "react-router-dom";
import { LegalPageLayout, LegalSection } from "../components/LegalPageLayout";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function PrivacyPolicyPage() {
  useDocumentTitle("Privacy policy");

  return (
    <LegalPageLayout title="Privacy policy" updated="September 2026">
      <LegalSection title="Who this covers">
        <p>
          GuildWork is an internal project-management tool used by employees and contractors of the consultancy that
          runs it. It is not a public product — accounts are created by an administrator or by self-registration
          for developers joining the team, not by the general public.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <p>About your account: your name, email address, role, and a bcrypt hash of your password (never the password itself).</p>
        <p>About your work: projects and clients you’re assigned to, bugs you report or are assigned, comments and file attachments you post, and your skills/seniority profile if you’re a developer.</p>
        <p>About your sessions: a hashed refresh token tied to your account, so we can keep you signed in without storing the token itself in a readable form.</p>
        <p>Activity records: role changes and destructive actions (deleting a project, client, or bug) are logged with who did it and when, for accountability.</p>
      </LegalSection>

      <LegalSection title="What we don’t do">
        <p>We don’t sell or share your data with third parties. We don’t use tracking or advertising cookies. We don’t run analytics that profile individual users across other sites.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          GuildWork sets exactly one cookie: a strictly necessary, <code className="rounded bg-parchment px-1 py-0.5 font-mono text-xs">httpOnly</code>{" "}
          session cookie used to keep you signed in. It cannot be read by JavaScript and is never used for tracking
          or advertising.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Account and work data is kept for as long as your account is active. Password reset links expire after one
          hour whether used or not. If your access is revoked, an administrator can remove your account on request.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask an administrator to see, correct, or delete the personal data GuildWork holds about you,
          subject to what’s needed to keep an accurate project history.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy go to your GuildWork administrator. See also our{" "}
          <Link to="/terms" className="font-medium text-brass-600 hover:underline">
            terms &amp; conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
