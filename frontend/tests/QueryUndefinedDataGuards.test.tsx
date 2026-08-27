import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/auth/AuthContext";
import { ClientsPage } from "../src/pages/ClientsPage";
import { AuditLogPage } from "../src/pages/AuditLogPage";
import { DashboardPage } from "../src/pages/DashboardPage";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function errorResponse(status = 500) {
  return new Response(JSON.stringify({ error: "boom" }), { status, headers: { "Content-Type": "application/json" } });
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("pages guard against isLoading:false + data:undefined (e.g. a failed request)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ClientsPage does not crash when the clients query errors out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/clients")) return errorResponse();
        return jsonResponse({});
      })
    );

    renderWithQueryClient(<ClientsPage />);

    await waitFor(() => expect(screen.queryByText(/loading clients/i)).not.toBeInTheDocument());
    expect(screen.getByText(/no clients yet/i)).toBeInTheDocument();
  });

  it("AuditLogPage does not crash when the audit log query errors out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/audit-log")) return errorResponse();
        return jsonResponse({});
      })
    );

    renderWithQueryClient(<AuditLogPage />);

    await waitFor(() => expect(screen.queryByText(/loading audit log/i)).not.toBeInTheDocument());
    expect(screen.getByText(/no audited activity yet/i)).toBeInTheDocument();
  });

  it("DashboardPage (developer view) does not crash when the projects query errors out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/auth/refresh")) {
          return jsonResponse({ accessToken: "token-abc", user: { id: "u1", email: "u@example.com", name: "Dev", role: "DEVELOPER" } });
        }
        if (url.includes("/api/auth/me")) {
          return jsonResponse({ id: "u1", email: "u@example.com", name: "Dev", role: "DEVELOPER" });
        }
        if (url.includes("/api/projects")) return errorResponse();
        if (url.includes("/api/developers/me")) return jsonResponse({ id: "d1", skills: [], mentor: null });
        if (url.includes("/api/bugs")) return jsonResponse({ items: [], total: 0, page: 1, pageSize: 25 });
        return jsonResponse({});
      })
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText(/your assigned projects/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/you are not assigned to any projects yet/i)).toBeInTheDocument());
  });

  it("ProjectsPage does not crash when data is undefined without isError being set", async () => {
    vi.doMock("../src/api/projects", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/api/projects")>();
      return {
        ...actual,
        useProjects: () => ({ isLoading: false, isError: false, data: undefined })
      };
    });
    const { ProjectsPage: ProjectsPageWithMockedHook } = await import("../src/pages/ProjectsPage");

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/auth/refresh")) {
          return jsonResponse({ accessToken: "token-abc", user: { id: "u1", email: "u@example.com", name: "Dev", role: "DEVELOPER" } });
        }
        if (url.includes("/api/auth/me")) {
          return jsonResponse({ id: "u1", email: "u@example.com", name: "Dev", role: "DEVELOPER" });
        }
        return jsonResponse({ items: [], total: 0, page: 1, pageSize: 25 });
      })
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectsPageWithMockedHook />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument());
    expect(screen.queryByText(/cannot read properties of undefined/i)).not.toBeInTheDocument();

    vi.doUnmock("../src/api/projects");
  });
});
