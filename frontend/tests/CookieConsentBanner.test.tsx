import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CookieConsentBanner } from "../src/components/CookieConsentBanner";

function renderBanner() {
  return render(
    <MemoryRouter>
      <CookieConsentBanner />
    </MemoryRouter>
  );
}

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows the notice on a first visit", () => {
    renderBanner();
    expect(screen.getByText(/strictly necessary cookie/i)).toBeInTheDocument();
  });

  it("dismisses and remembers the choice across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = renderBanner();

    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByText(/strictly necessary cookie/i)).not.toBeInTheDocument();

    unmount();
    renderBanner();
    expect(screen.queryByText(/strictly necessary cookie/i)).not.toBeInTheDocument();
  });

  it("links to the privacy policy", () => {
    renderBanner();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
  });
});
