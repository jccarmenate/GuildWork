import { PrismaClient, Proficiency, Seniority, UserRole, Priority, ProjectStatus, Severity, BugStatus } from "@prisma/client";
import { hashPassword } from "../src/auth/hash.js";

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("Password123!");

  const admin = await prisma.user.create({
    data: { email: "admin@guildwork.dev", passwordHash: password, name: "Alex Rivera", role: UserRole.ADMIN }
  });

  const pm1 = await prisma.user.create({
    data: { email: "pm1@guildwork.dev", passwordHash: password, name: "Morgan Lee", role: UserRole.PROJECT_MANAGER }
  });
  const pm2 = await prisma.user.create({
    data: { email: "pm2@guildwork.dev", passwordHash: password, name: "Sam Okafor", role: UserRole.PROJECT_MANAGER }
  });

  const devUsers = await Promise.all(
    [
      { email: "dev1@guildwork.dev", name: "Priya Nair", seniority: Seniority.LEAD },
      { email: "dev2@guildwork.dev", name: "Diego Fernandez", seniority: Seniority.SENIOR },
      { email: "dev3@guildwork.dev", name: "Wei Zhang", seniority: Seniority.MID },
      { email: "dev4@guildwork.dev", name: "Fatima Haidari", seniority: Seniority.JUNIOR },
      { email: "dev5@guildwork.dev", name: "Lucas Silva", seniority: Seniority.MID }
    ].map(({ email, name }) => prisma.user.create({ data: { email, passwordHash: password, name, role: UserRole.DEVELOPER } }))
  );

  const seniorities = [Seniority.LEAD, Seniority.SENIOR, Seniority.MID, Seniority.JUNIOR, Seniority.MID];
  const profiles = [];
  for (let i = 0; i < devUsers.length; i++) {
    const profile = await prisma.developerProfile.create({
      data: { userId: devUsers[i].id, seniority: seniorities[i], bio: `${devUsers[i].name}'s profile.` }
    });
    profiles.push(profile);
  }

  await prisma.developerProfile.update({ where: { id: profiles[1].id }, data: { mentorId: profiles[0].id } });
  await prisma.developerProfile.update({ where: { id: profiles[3].id }, data: { mentorId: profiles[0].id } });
  await prisma.developerProfile.update({ where: { id: profiles[2].id }, data: { mentorId: profiles[1].id } });

  const skillNames = [
    { name: "TypeScript", category: "Language" },
    { name: "React", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Docker", category: "DevOps" },
    { name: "AWS", category: "Cloud" }
  ];
  const skills = await Promise.all(skillNames.map((s) => prisma.skill.create({ data: s })));

  const skillAssignments: [number, number, Proficiency][] = [
    [0, 0, Proficiency.EXPERT],
    [0, 2, Proficiency.ADVANCED],
    [1, 1, Proficiency.EXPERT],
    [1, 0, Proficiency.ADVANCED],
    [2, 2, Proficiency.INTERMEDIATE],
    [2, 3, Proficiency.INTERMEDIATE],
    [3, 1, Proficiency.BEGINNER],
    [4, 4, Proficiency.ADVANCED],
    [4, 5, Proficiency.INTERMEDIATE]
  ];
  for (const [devIdx, skillIdx, proficiency] of skillAssignments) {
    await prisma.developerSkill.create({
      data: { developerId: profiles[devIdx].id, skillId: skills[skillIdx].id, proficiency }
    });
  }

  const client1 = await prisma.client.create({
    data: { name: "Northwind Retail", industry: "E-commerce", contactName: "Jordan Blake", contactEmail: "jordan@northwind.example" }
  });
  const client2 = await prisma.client.create({
    data: { name: "Beacon Health", industry: "Healthcare", contactName: "Casey Wren", contactEmail: "casey@beaconhealth.example" }
  });

  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      name: "Storefront Revamp",
      description: "Rebuild the customer-facing storefront with a new checkout flow.",
      priority: Priority.HIGH,
      status: ProjectStatus.ACTIVE,
      budget: 120000,
      startDate: new Date("2026-05-01"),
      createdByUserId: pm1.id
    }
  });
  const project2 = await prisma.project.create({
    data: {
      clientId: client2.id,
      name: "Patient Portal API",
      description: "Backend services for the patient scheduling portal.",
      priority: Priority.CRITICAL,
      status: ProjectStatus.ACTIVE,
      budget: 200000,
      startDate: new Date("2026-03-15"),
      createdByUserId: pm2.id
    }
  });
  const project3 = await prisma.project.create({
    data: {
      clientId: client1.id,
      name: "Loyalty Program",
      description: "Points-based loyalty program integration.",
      priority: Priority.MEDIUM,
      status: ProjectStatus.COMPLETED,
      budget: 60000,
      startDate: new Date("2025-11-01"),
      endDate: new Date("2026-02-01"),
      createdByUserId: pm1.id
    }
  });

  await prisma.projectSkill.createMany({
    data: [
      { projectId: project1.id, skillId: skills[1].id },
      { projectId: project1.id, skillId: skills[0].id },
      { projectId: project2.id, skillId: skills[2].id },
      { projectId: project2.id, skillId: skills[3].id },
      { projectId: project3.id, skillId: skills[1].id }
    ]
  });

  await prisma.projectAssignment.createMany({
    data: [
      { projectId: project1.id, developerId: profiles[1].id, roleOnProject: "lead", hoursAllocated: 30 },
      { projectId: project1.id, developerId: profiles[3].id, roleOnProject: "contributor", hoursAllocated: 20 },
      { projectId: project2.id, developerId: profiles[0].id, roleOnProject: "lead", hoursAllocated: 25 },
      { projectId: project2.id, developerId: profiles[2].id, roleOnProject: "contributor", hoursAllocated: 25 },
      { projectId: project3.id, developerId: profiles[4].id, roleOnProject: "lead", hoursAllocated: 15 }
    ]
  });

  await prisma.bug.createMany({
    data: [
      {
        projectId: project1.id,
        title: "Checkout button unresponsive on Safari",
        severity: Severity.HIGH,
        status: BugStatus.RESOLVED,
        reportedByUserId: pm1.id,
        assignedToDeveloperId: profiles[1].id,
        createdAt: new Date("2026-06-01"),
        resolvedAt: new Date("2026-06-03")
      },
      {
        projectId: project1.id,
        title: "Cart total rounding error",
        severity: Severity.MEDIUM,
        status: BugStatus.IN_PROGRESS,
        reportedByUserId: pm1.id,
        assignedToDeveloperId: profiles[3].id,
        createdAt: new Date("2026-07-10")
      },
      {
        projectId: project2.id,
        title: "Appointment slot double-booking",
        severity: Severity.CRITICAL,
        status: BugStatus.RESOLVED,
        reportedByUserId: pm2.id,
        assignedToDeveloperId: profiles[0].id,
        createdAt: new Date("2026-04-01"),
        resolvedAt: new Date("2026-04-02")
      },
      {
        projectId: project2.id,
        title: "Rate limiting missing on login",
        severity: Severity.HIGH,
        status: BugStatus.OPEN,
        reportedByUserId: pm2.id,
        assignedToDeveloperId: profiles[2].id,
        createdAt: new Date("2026-08-01")
      },
      {
        projectId: project3.id,
        title: "Points not credited retroactively",
        severity: Severity.LOW,
        status: BugStatus.WONT_FIX,
        reportedByUserId: pm1.id,
        assignedToDeveloperId: profiles[4].id,
        createdAt: new Date("2026-01-15")
      }
    ]
  });

  console.log("Seed complete.");
  console.log({ admin: admin.email, pm1: pm1.email, pm2: pm2.email, password: "Password123!" });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
