import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PrivacyPolicyPage } from "../src/pages/PrivacyPolicyPage";
import { TermsPage } from "../src/pages/TermsPage";

describe("PrivacyPolicyPage", () => {
  it("renders the policy heading, a draft notice, and a link back to sign in", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/has not been reviewed by legal counsel/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute("href", "/login");
    expect(document.title).toBe("Privacy policy · GuildWork");
  });

  it("links through to the terms page", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /terms & conditions/i })).toHaveAttribute("href", "/terms");
  });
});

describe("TermsPage", () => {
  it("renders the terms heading and links back to the privacy policy", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /terms & conditions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
    expect(document.title).toBe("Terms & conditions · GuildWork");
  });
});
