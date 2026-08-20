import type { PrismaClient, User } from "@prisma/client";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry, signAccessToken } from "./tokens.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function issueTokenPair(prisma: PrismaClient, user: User): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiry()
    }
  });

  return { accessToken, refreshToken };
}
