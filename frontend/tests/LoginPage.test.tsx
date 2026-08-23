import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/auth/AuthContext";
import { LoginPage } from "../src/pages/LoginPage";

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a validation error and makes no request when submitted empty", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/required/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend's generic invalid-credentials error", async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 })
    );

    await user.type(screen.getByLabelText(/email/i), "dev@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("submits credentials to /api/auth/login on valid input", async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ accessToken: "token-abc", user: { id: "u1", email: "dev@example.com", name: "Dev", role: "DEVELOPER" } }),
        { status: 200 }
      )
    );

    await user.type(screen.getByLabelText(/email/i), "dev@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const loginCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/api/auth/login"));
      expect(loginCall).toBeTruthy();
    });
  });
});
