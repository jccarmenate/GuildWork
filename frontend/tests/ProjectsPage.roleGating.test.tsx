import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/auth/AuthContext";
import { ProjectsPage } from "../src/pages/ProjectsPage";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderProjectsPageAs(role: "DEVELOPER" | "ADMIN") {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/auth/refresh")) {
      return jsonResponse({ accessToken: "token-abc", user: { id: "u1", email: "u@example.com", name: "Test User", role } });
    }
    if (url.includes("/api/auth/me")) {
      return jsonResponse({ id: "u1", email: "u@example.com", name: "Test User", role });
    }
    if (url.includes("/api/projects")) {
      return jsonResponse({ items: [], total: 0, page: 1, pageSize: 25 });
    }
    if (url.includes("/api/clients")) {
      return jsonResponse({ items: [], total: 0, page: 1, pageSize: 25 });
    }
    return jsonResponse({}, 200);
  });
  vi.stubGlobal("fetch", fetchMock);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectsPage />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return fetchMock;
}

describe("ProjectsPage role gating", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not show a New Project button for a Developer", async () => {
    renderProjectsPageAs("DEVELOPER");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /new project/i })).not.toBeInTheDocument();
  });

  it("shows a New Project button for an Admin", async () => {
    renderProjectsPageAs("ADMIN");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    });
  });
});
