// Hand-written OpenAPI 3.0 description of the GuildWork API. Kept as a plain
// object (not generated from the zod schemas) so it stays readable without
// pulling in a schema-conversion dependency for a route surface this size.

function pagedSchema(itemRef: string) {
  return {
    type: "object",
    properties: {
      items: { type: "array", items: { $ref: `#/components/schemas/${itemRef}` } },
      total: { type: "integer" },
      page: { type: "integer" },
      pageSize: { type: "integer" }
    }
  };
}

function jsonBody(schema: Record<string, unknown>) {
  return { required: true, content: { "application/json": { schema } } };
}

function jsonResponse(schemaRef: string, description = "OK") {
  return { description, content: { "application/json": { schema: { $ref: `#/components/schemas/${schemaRef}` } } } };
}

const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
const pageParam = { name: "page", in: "query", schema: { type: "integer", default: 1 } };
const pageSizeParam = { name: "pageSize", in: "query", schema: { type: "integer", default: 25, maximum: 100 } };

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GuildWork API",
    version: "1.0.0",
    description:
      "Project-management and bug-tracking API for a software consultancy. " +
      "Every route requires a Bearer access token except /auth/register, /auth/login, " +
      "/auth/refresh, /auth/forgot-password, and /auth/reset-password."
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" }, details: { type: "object" } }
      },
      UserRole: { type: "string", enum: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"] },
      Seniority: { type: "string", enum: ["JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"] },
      Proficiency: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] },
      Priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      ProjectStatus: { type: "string", enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] },
      Severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      BugStatus: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"] },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { $ref: "#/components/schemas/UserRole" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", description: "15-minute JWT. Hold in memory only, never localStorage." },
          user: { $ref: "#/components/schemas/User" }
        }
      },
      Client: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          industry: { type: "string", nullable: true },
          contactName: { type: "string", nullable: true },
          contactEmail: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      Skill: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          category: { type: "string", nullable: true }
        }
      },
      DeveloperProfile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          seniority: { $ref: "#/components/schemas/Seniority" },
          bio: { type: "string", nullable: true },
          mentorId: { type: "string", format: "uuid", nullable: true },
          user: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" } } },
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                skillId: { type: "string" },
                proficiency: { $ref: "#/components/schemas/Proficiency" },
                skill: { $ref: "#/components/schemas/Skill" }
              }
            }
          }
        }
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          clientId: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          priority: { $ref: "#/components/schemas/Priority" },
          status: { $ref: "#/components/schemas/ProjectStatus" },
          budget: { type: "number", nullable: true },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time", nullable: true },
          createdByUserId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          client: { $ref: "#/components/schemas/Client" }
        }
      },
      Bug: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          severity: { $ref: "#/components/schemas/Severity" },
          status: { $ref: "#/components/schemas/BugStatus" },
          reportedByUserId: { type: "string", format: "uuid" },
          assignedToDeveloperId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      BugComment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bugId: { type: "string", format: "uuid" },
          body: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          author: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } }
        }
      },
      BugAttachment: {
        type: "object",
        description: "Metadata only — GET the /attachments/{attachmentId} route to fetch the file bytes.",
        properties: {
          id: { type: "string", format: "uuid" },
          filename: { type: "string" },
          mimeType: { type: "string" },
          size: { type: "integer", description: "Bytes, capped at 5 MB" },
          createdAt: { type: "string", format: "date-time" },
          uploadedBy: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } }
        }
      },
      AuditLogEntry: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          action: { type: "string", example: "PROJECT_DELETED" },
          entityType: { type: "string", example: "Project" },
          entityId: { type: "string", format: "uuid" },
          metadata: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          actor: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" } } }
        }
      },
      PagedProjects: pagedSchema("Project"),
      PagedClients: pagedSchema("Client"),
      PagedDevelopers: pagedSchema("DeveloperProfile"),
      PagedBugs: pagedSchema("Bug"),
      PagedAuditLog: pagedSchema("AuditLogEntry")
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Liveness/readiness check",
        security: [],
        responses: {
          "200": { description: "Database reachable" },
          "503": { description: "Database unreachable" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Self-register as a Developer",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["email", "password", "name"],
          properties: { email: { type: "string" }, password: { type: "string", minLength: 8 }, name: { type: "string" } }
        }),
        responses: {
          "201": jsonResponse("AuthResponse"),
          "400": jsonResponse("Error"),
          "409": jsonResponse("Error", "Email already in use")
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["email", "password"],
          properties: { email: { type: "string" }, password: { type: "string" } }
        }),
        responses: { "200": jsonResponse("AuthResponse"), "401": jsonResponse("Error", "Invalid email or password") }
      }
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate the refresh cookie for a new access token",
        description: "Reads the httpOnly refresh cookie; not called with a body. Reused-token detection revokes all sessions.",
        security: [],
        responses: { "200": jsonResponse("AuthResponse"), "401": jsonResponse("Error") }
      }
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "Revoke the current refresh token", responses: { "204": { description: "Logged out" } } }
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset link",
        description: "Always returns 202 regardless of whether the email is registered, to avoid account enumeration.",
        security: [],
        requestBody: jsonBody({ type: "object", required: ["email"], properties: { email: { type: "string" } } }),
        responses: { "202": { description: "Request accepted" } }
      }
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset a password with a token from the email link",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["token", "password"],
          properties: { token: { type: "string" }, password: { type: "string", minLength: 8 } }
        }),
        responses: { "200": { description: "Password updated" }, "400": jsonResponse("Error", "Invalid or expired reset token") }
      }
    },
    "/auth/me": {
      get: { tags: ["Auth"], summary: "Current user", responses: { "200": jsonResponse("User") } }
    },
    "/auth/admin/users": {
      get: {
        tags: ["Auth"],
        summary: "List all users (Admin only)",
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } }, "403": jsonResponse("Error") }
      },
      post: {
        tags: ["Auth"],
        summary: "Create a user with a specific role (Admin only)",
        requestBody: jsonBody({
          type: "object",
          required: ["email", "password", "name", "role"],
          properties: {
            email: { type: "string" },
            password: { type: "string", minLength: 8 },
            name: { type: "string" },
            role: { $ref: "#/components/schemas/UserRole" }
          }
        }),
        responses: { "201": jsonResponse("User"), "403": jsonResponse("Error") }
      }
    },
    "/auth/admin/users/{id}/role": {
      patch: {
        tags: ["Auth"],
        summary: "Change a user's role (Admin only) — records an audit log entry",
        parameters: [idParam],
        requestBody: jsonBody({ type: "object", required: ["role"], properties: { role: { $ref: "#/components/schemas/UserRole" } } }),
        responses: { "200": jsonResponse("User"), "403": jsonResponse("Error"), "404": jsonResponse("Error") }
      }
    },
    "/clients": {
      get: {
        tags: ["Clients"],
        summary: "List clients (Admin/PM only, paginated)",
        parameters: [pageParam, pageSizeParam],
        responses: { "200": jsonResponse("PagedClients"), "403": jsonResponse("Error") }
      },
      post: {
        tags: ["Clients"],
        summary: "Create a client (Admin/PM only)",
        requestBody: jsonBody({
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            industry: { type: "string", nullable: true },
            contactName: { type: "string", nullable: true },
            contactEmail: { type: "string", nullable: true }
          }
        }),
        responses: { "201": jsonResponse("Client"), "403": jsonResponse("Error") }
      }
    },
    "/clients/{id}": {
      get: { tags: ["Clients"], parameters: [idParam], responses: { "200": jsonResponse("Client"), "404": jsonResponse("Error") } },
      patch: {
        tags: ["Clients"],
        summary: "Update a client (Admin/PM only)",
        parameters: [idParam],
        requestBody: jsonBody({ type: "object", properties: { name: { type: "string" }, industry: { type: "string" } } }),
        responses: { "200": jsonResponse("Client"), "404": jsonResponse("Error") }
      },
      delete: {
        tags: ["Clients"],
        summary: "Soft-delete a client (Admin/PM only) — records an audit log entry",
        parameters: [idParam],
        responses: { "204": { description: "Deleted" }, "404": jsonResponse("Error") }
      }
    },
    "/clients/{id}/restore": {
      post: {
        tags: ["Clients"],
        summary: "Restore a soft-deleted client (Admin/PM only)",
        parameters: [idParam],
        responses: { "200": jsonResponse("Client"), "404": jsonResponse("Error") }
      }
    },
    "/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects (paginated) — a Developer only sees projects they're assigned to",
        parameters: [
          pageParam,
          pageSizeParam,
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/ProjectStatus" } },
          { name: "priority", in: "query", schema: { $ref: "#/components/schemas/Priority" } },
          { name: "clientId", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Case-insensitive name search" }
        ],
        responses: { "200": jsonResponse("PagedProjects") }
      },
      post: {
        tags: ["Projects"],
        summary: "Create a project (Admin/PM only)",
        requestBody: jsonBody({
          type: "object",
          required: ["clientId", "name", "startDate"],
          properties: {
            clientId: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            priority: { $ref: "#/components/schemas/Priority" },
            status: { $ref: "#/components/schemas/ProjectStatus" },
            budget: { type: "number", nullable: true },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date", nullable: true }
          }
        }),
        responses: { "201": jsonResponse("Project"), "403": jsonResponse("Error") }
      }
    },
    "/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Project detail with client, required skills, assignments, and bugs",
        parameters: [idParam],
        description: "A Developer not assigned to this project gets 404, not 403, so existence can't be probed by status code.",
        responses: { "200": jsonResponse("Project"), "404": jsonResponse("Error") }
      },
      patch: { tags: ["Projects"], summary: "Update a project (Admin/PM only)", parameters: [idParam], responses: { "200": jsonResponse("Project"), "404": jsonResponse("Error") } },
      delete: {
        tags: ["Projects"],
        summary: "Soft-delete a project (Admin/PM only) — records an audit log entry",
        parameters: [idParam],
        responses: { "204": { description: "Deleted" }, "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/restore": {
      post: { tags: ["Projects"], summary: "Restore a soft-deleted project (Admin/PM only)", parameters: [idParam], responses: { "200": jsonResponse("Project"), "404": jsonResponse("Error") } }
    },
    "/projects/{id}/assignments": {
      post: {
        tags: ["Projects"],
        summary: "Assign a developer to the project (Admin/PM only)",
        parameters: [idParam],
        requestBody: jsonBody({
          type: "object",
          required: ["developerId"],
          properties: { developerId: { type: "string", format: "uuid" }, roleOnProject: { type: "string", nullable: true }, hoursAllocated: { type: "number", nullable: true } }
        }),
        responses: { "201": { description: "Assigned" }, "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/assignments/{developerId}": {
      delete: {
        tags: ["Projects"],
        summary: "Unassign a developer (Admin/PM only)",
        parameters: [idParam, { name: "developerId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Unassigned" }, "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/skills": {
      post: {
        tags: ["Projects"],
        summary: "Add a required skill to the project (Admin/PM only)",
        parameters: [idParam],
        requestBody: jsonBody({ type: "object", required: ["skillId"], properties: { skillId: { type: "string", format: "uuid" } } }),
        responses: { "201": { description: "Added" }, "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/skills/{skillId}": {
      delete: {
        tags: ["Projects"],
        summary: "Remove a required skill (Admin/PM only)",
        parameters: [idParam, { name: "skillId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Removed" }, "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/bugs": {
      post: {
        tags: ["Projects"],
        summary: "Report a bug on the project (Admin/PM only) — emails the assignee if one is set",
        parameters: [idParam],
        requestBody: jsonBody({
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            severity: { $ref: "#/components/schemas/Severity" },
            assignedToDeveloperId: { type: "string", format: "uuid", nullable: true }
          }
        }),
        responses: { "201": jsonResponse("Bug"), "404": jsonResponse("Error") }
      }
    },
    "/projects/{id}/report.pdf": {
      get: {
        tags: ["Projects"],
        summary: "Download a PDF status report",
        description: "Rate-limited (20 req / 15 min) since PDF rendering is CPU-bound.",
        parameters: [idParam],
        responses: { "200": { description: "application/pdf stream" }, "404": jsonResponse("Error"), "429": { description: "Rate limited" } }
      }
    },
    "/bugs": {
      get: {
        tags: ["Bugs"],
        summary: "List bugs (paginated) — a Developer only sees bugs assigned to them",
        parameters: [pageParam, pageSizeParam],
        responses: { "200": jsonResponse("PagedBugs") }
      }
    },
    "/bugs/{id}": {
      patch: {
        tags: ["Bugs"],
        summary: "Update a bug",
        description:
          "Admin/PM can change any field. A Developer may only change `status` on a bug assigned to them. " +
          "Resolving triggers an email to the reporter; reassigning triggers an email to the new assignee.",
        parameters: [idParam],
        requestBody: jsonBody({
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            severity: { $ref: "#/components/schemas/Severity" },
            status: { $ref: "#/components/schemas/BugStatus" },
            assignedToDeveloperId: { type: "string", format: "uuid", nullable: true }
          }
        }),
        responses: { "200": jsonResponse("Bug"), "403": jsonResponse("Error"), "404": jsonResponse("Error") }
      },
      delete: {
        tags: ["Bugs"],
        summary: "Delete a bug (Admin/PM only) — records an audit log entry",
        parameters: [idParam],
        responses: { "204": { description: "Deleted" }, "403": jsonResponse("Error"), "404": jsonResponse("Error") }
      }
    },
    "/bugs/{id}/comments": {
      get: {
        tags: ["Bugs"],
        summary: "List a bug's comments, oldest first",
        parameters: [idParam],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BugComment" } } } } }, "403": jsonResponse("Error") }
      },
      post: {
        tags: ["Bugs"],
        summary: "Add a comment",
        parameters: [idParam],
        requestBody: jsonBody({ type: "object", required: ["body"], properties: { body: { type: "string", minLength: 1, maxLength: 2000 } } }),
        responses: { "201": jsonResponse("BugComment"), "403": jsonResponse("Error") }
      }
    },
    "/bugs/{id}/attachments": {
      get: {
        tags: ["Bugs"],
        summary: "List a bug's attachments (metadata only)",
        parameters: [idParam],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BugAttachment" } } } } } }
      },
      post: {
        tags: ["Bugs"],
        summary: "Upload an attachment",
        description: "multipart/form-data, field name `file`. Max 5 MB; image/png, image/jpeg, image/gif, image/webp, or application/pdf only.",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } } }
        },
        responses: { "201": jsonResponse("BugAttachment"), "400": jsonResponse("Error", "Unsupported file type or too large"), "403": jsonResponse("Error") }
      }
    },
    "/bugs/{id}/attachments/{attachmentId}": {
      get: {
        tags: ["Bugs"],
        summary: "Download an attachment's file bytes",
        parameters: [idParam, { name: "attachmentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "File stream" }, "404": jsonResponse("Error") }
      },
      delete: {
        tags: ["Bugs"],
        summary: "Delete an attachment (Admin/PM only)",
        parameters: [idParam, { name: "attachmentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "403": jsonResponse("Error"), "404": jsonResponse("Error") }
      }
    },
    "/developers": {
      get: {
        tags: ["Developers"],
        summary: "List developer profiles (Admin/PM only, paginated)",
        parameters: [pageParam, pageSizeParam],
        responses: { "200": jsonResponse("PagedDevelopers"), "403": jsonResponse("Error") }
      }
    },
    "/developers/me": {
      get: { tags: ["Developers"], summary: "Your own developer profile", responses: { "200": jsonResponse("DeveloperProfile") } },
      patch: {
        tags: ["Developers"],
        summary: "Update your own bio",
        requestBody: jsonBody({ type: "object", properties: { bio: { type: "string", nullable: true } } }),
        responses: { "200": jsonResponse("DeveloperProfile") }
      }
    },
    "/developers/me/skills": {
      post: {
        tags: ["Developers"],
        summary: "Add or update a skill on your own profile",
        requestBody: jsonBody({
          type: "object",
          required: ["skillId"],
          properties: { skillId: { type: "string", format: "uuid" }, proficiency: { $ref: "#/components/schemas/Proficiency" } }
        }),
        responses: { "201": { description: "Added" } }
      }
    },
    "/developers/me/skills/{skillId}": {
      delete: {
        tags: ["Developers"],
        summary: "Remove a skill from your own profile",
        parameters: [{ name: "skillId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Removed" }, "404": jsonResponse("Error") }
      }
    },
    "/developers/{id}": {
      get: { tags: ["Developers"], summary: "A developer's profile (Admin/PM only)", parameters: [idParam], responses: { "200": jsonResponse("DeveloperProfile"), "404": jsonResponse("Error") } },
      patch: {
        tags: ["Developers"],
        summary: "Update seniority, mentor, or bio (Admin/PM only)",
        parameters: [idParam],
        requestBody: jsonBody({
          type: "object",
          properties: {
            bio: { type: "string", nullable: true },
            seniority: { $ref: "#/components/schemas/Seniority" },
            mentorId: { type: "string", format: "uuid", nullable: true }
          }
        }),
        responses: { "200": jsonResponse("DeveloperProfile"), "404": jsonResponse("Error") }
      }
    },
    "/skills": {
      get: { tags: ["Skills"], summary: "List all skills in the catalog", responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Skill" } } } } } } },
      post: {
        tags: ["Skills"],
        summary: "Add a skill to the catalog (Admin/PM only)",
        requestBody: jsonBody({ type: "object", required: ["name"], properties: { name: { type: "string" }, category: { type: "string", nullable: true } } }),
        responses: { "201": jsonResponse("Skill"), "409": jsonResponse("Error", "Skill already exists") }
      }
    },
    "/skills/{id}": {
      patch: { tags: ["Skills"], summary: "Rename/recategorize a skill (Admin/PM only)", parameters: [idParam], responses: { "200": jsonResponse("Skill"), "404": jsonResponse("Error") } },
      delete: { tags: ["Skills"], summary: "Remove a skill from the catalog (Admin/PM only)", parameters: [idParam], responses: { "204": { description: "Removed" }, "404": jsonResponse("Error") } }
    },
    "/analytics/bug-severity": {
      get: { tags: ["Analytics"], summary: "Bug counts and avg. resolution time by severity (Admin/PM only)", responses: { "200": { description: "OK" } } }
    },
    "/analytics/workload": {
      get: { tags: ["Analytics"], summary: "Active assignments and open bugs per developer (Admin/PM only)", responses: { "200": { description: "OK" } } }
    },
    "/analytics/mentorship": {
      get: { tags: ["Analytics"], summary: "Mentors and their mentees' resolved-bug counts (Admin/PM only)", responses: { "200": { description: "OK" } } }
    },
    "/analytics/project-completion": {
      get: { tags: ["Analytics"], summary: "Completion rate by priority and by client (Admin/PM only)", responses: { "200": { description: "OK" } } }
    },
    "/analytics/skill-coverage": {
      get: { tags: ["Analytics"], summary: "How many developers know each catalog skill (Admin/PM only)", responses: { "200": { description: "OK" } } }
    },
    "/analytics/top-performers": {
      get: {
        tags: ["Analytics"],
        summary: "Developers ranked by resolved high/critical bugs (Admin/PM only)",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 5 } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/audit-log": {
      get: {
        tags: ["Audit log"],
        summary: "List audit log entries, most recent first (Admin only, paginated)",
        parameters: [
          pageParam,
          pageSizeParam,
          { name: "entityType", in: "query", schema: { type: "string" }, example: "Project" },
          { name: "entityId", in: "query", schema: { type: "string" } }
        ],
        responses: { "200": jsonResponse("PagedAuditLog"), "403": jsonResponse("Error") }
      }
    }
  }
};
