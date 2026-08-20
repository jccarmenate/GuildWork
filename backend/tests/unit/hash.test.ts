import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/hash.js";

describe("password hashing", () => {
  it("hashes a password to a bcrypt digest distinct from the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("s3cret-Pass!");
    await expect(verifyPassword("s3cret-Pass!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret-Pass!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
  });
});
