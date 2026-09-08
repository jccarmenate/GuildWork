import { Link } from "react-router-dom";
import { LegalPageLayout, LegalSection } from "../components/LegalPageLayout";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function TermsPage() {
  useDocumentTitle("Terms & conditions");

  return (
    <LegalPageLayout title="Terms & conditions" updated="September 2026">
      <LegalSection title="Acceptance">
        <p>By creating an account or signing in, you agree to use GuildWork only for the internal work of the consultancy that operates it.</p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You're responsible for keeping your password confidential and for activity that happens under your
          account. Self-registration creates a Developer account; Project Manager and Admin roles are assigned by an
          administrator.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Don't upload attachments you don't have the right to share.</li>
          <li>Don't attempt to access projects, clients, or developer data you're not assigned to.</li>
          <li>Don't use automated tools to scrape or overload the service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Content you submit">
        <p>
          Bug reports, comments, and attachments you post remain associated with your account for the project's
          history. Deleting a bug or project doesn't erase the audit trail of that action.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>GuildWork is provided as an internal tool "as is," without uptime guarantees, while the consultancy operates it.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>These terms may change as the product evolves. Continued use after a change means you accept the update.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions go to your GuildWork administrator. See also our{" "}
          <Link to="/privacy" className="font-medium text-brass-600 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
