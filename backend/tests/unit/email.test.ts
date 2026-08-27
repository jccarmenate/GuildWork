import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "../../src/lib/email.js";

const originalApiKey = process.env.RESEND_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
});

describe("sendEmail", () => {
  it("does not call fetch when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail({ to: "dev@example.com", subject: "Hi", text: "Hello" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the Resend API when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail({ to: "dev@example.com", subject: "Reset your password", text: "Click here" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer re_test_key" })
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual(
      expect.objectContaining({ to: "dev@example.com", subject: "Reset your password", text: "Click here" })
    );
  });

  it("throws when the Resend API responds with an error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })));

    await expect(sendEmail({ to: "dev@example.com", subject: "Hi", text: "Hello" })).rejects.toThrow();
  });
});
