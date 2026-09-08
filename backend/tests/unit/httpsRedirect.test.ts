import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { httpsRedirect } from "../../src/middleware/httpsRedirect.js";

function mockReq(overrides: Partial<Request>): Request {
  return { headers: {}, ...overrides } as Request;
}

function mockRes() {
  const res: Partial<Response> = {};
  res.redirect = vi.fn().mockReturnValue(res);
  return res as Response;
}

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe("httpsRedirect", () => {
  it("redirects to https when NODE_ENV=production and the proxy forwarded plain http", () => {
    process.env.NODE_ENV = "production";
    const req = mockReq({
      headers: { "x-forwarded-proto": "http", host: "guildwork.example.com" },
      originalUrl: "/api/health"
    });
    const res = mockRes();
    const next = vi.fn();

    httpsRedirect(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(301, "https://guildwork.example.com/api/health");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next without redirecting when the proxy already forwarded https", () => {
    process.env.NODE_ENV = "production";
    const req = mockReq({ headers: { "x-forwarded-proto": "https" } });
    const res = mockRes();
    const next = vi.fn();

    httpsRedirect(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("calls next when there is no x-forwarded-proto header (not behind a proxy)", () => {
    process.env.NODE_ENV = "production";
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = vi.fn();

    httpsRedirect(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("never redirects outside production, even over plain http", () => {
    process.env.NODE_ENV = "test";
    const req = mockReq({ headers: { "x-forwarded-proto": "http" } });
    const res = mockRes();
    const next = vi.fn();

    httpsRedirect(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
