import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/auth/AuthContext";
import { RegisterPage } from "../src/pages/RegisterPage";

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mentions that self-registration only creates a Developer account", async () => {
    renderRegisterPage();
    expect(screen.getByText(/developer account/i)).toBeInTheDocument();
  });

  it("rejects a password shorter than 8 characters before calling the API", async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await user.type(screen.getByLabelText(/name/i), "Dev One");
    await user.type(screen.getByLabelText(/email/i), "dev@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed email before calling the API", async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    await user.type(screen.getByLabelText(/name/i), "Dev One");
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/valid email/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a 409 duplicate-email error from the API", async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Email already in use" }), { status: 409 }));

    await user.type(screen.getByLabelText(/name/i), "Dev One");
    await user.type(screen.getByLabelText(/email/i), "dev@example.com");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email already in use");
  });
});
