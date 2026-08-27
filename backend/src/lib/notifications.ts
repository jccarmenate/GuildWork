import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";

export async function notifyBugAssigned(params: {
  developerId: string;
  bugTitle: string;
  bugSeverity: string;
}): Promise<void> {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: params.developerId },
    include: { user: { select: { email: true, name: true } } }
  });
  if (!developer) return;

  await sendEmail({
    to: developer.user.email,
    subject: `New bug assigned: ${params.bugTitle}`,
    text: `You've been assigned "${params.bugTitle}" (severity: ${params.bugSeverity}).`
  });
}

export async function notifyBugResolved(params: { reporterUserId: string; bugTitle: string }): Promise<void> {
  const reporter = await prisma.user.findUnique({
    where: { id: params.reporterUserId },
    select: { email: true, name: true }
  });
  if (!reporter) return;

  await sendEmail({
    to: reporter.email,
    subject: `Bug resolved: ${params.bugTitle}`,
    text: `"${params.bugTitle}", which you reported, has been marked resolved.`
  });
}
