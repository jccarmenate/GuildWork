import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ResetPasswordPage } from "../src/pages/ResetPasswordPage";

function renderPage(search = "?token=abc123") {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

describe("ResetPasswordPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^new password/i), "NewPassword123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Different123!");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the token from the URL and the new password", async () => {
    const user = userEvent.setup();
    renderPage("?token=abc123");

    await user.type(screen.getByLabelText(/^new password/i), "NewPassword123!");
    await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123!");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    const call = await vi.waitFor(() => {
      const found = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/auth/reset-password"));
      if (!found) throw new Error("not called yet");
      return found;
    });
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({
      token: "abc123",
      password: "NewPassword123!"
    });
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });

  it("shows the backend's error for an invalid or expired token", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "Invalid or expired reset token" }), { status: 400 }));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^new password/i), "NewPassword123!");
    await user.type(screen.getByLabelText(/confirm password/i), "NewPassword123!");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired reset token");
  });
});
