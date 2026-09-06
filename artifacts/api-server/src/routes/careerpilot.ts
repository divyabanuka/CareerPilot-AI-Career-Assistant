import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  activitiesTable,
  applicationsTable,
  certificatesTable,
  goalsTable,
  profilesTable,
  skillsTable,
} from "@workspace/db";
import {
  CreateApplicationBody,
  CreateCertificateBody,
  CreateGoalBody,
  CreateSkillBody,
  UpdateApplicationBody,
  UpdateCertificateBody,
  UpdateGoalBody,
  UpdateProfileBody,
  UpdateSkillBody,
  AnalyzeResumeBody,
  SendAssistantMessageBody,
} from "@workspace/api-zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

type AuthedRequest = Request & { userId?: string };

const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = String(userId);
  next();
};

const currentUser = (req: AuthedRequest): string => req.userId ?? "demo-user";
const idParam = (req: Request): string => {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
};

async function ensureProfile(userId: string, email = "") {
  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  if (existing) return existing;
  const [profile] = await db
    .insert(profilesTable)
    .values({
      id: randomUUID(),
      userId,
      email,
      name: "Alex Morgan",
      college: "Northeastern University",
      degree: "B.S. Computer Science",
      graduationYear: 2026,
      careerGoal: "Become a Full Stack Developer",
      linkedin: "linkedin.com/in/alexmorgan",
      github: "github.com/alexmorgan",
    })
    .returning();
  await seedUser(userId);
  return profile;
}

async function seedUser(userId: string): Promise<void> {
  const [application] = await db.select({ id: applicationsTable.id }).from(applicationsTable).where(eq(applicationsTable.userId, userId)).limit(1);
  if (application) return;
  const today = new Date();
  const iso = (offset: number) => new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10);
  await db.insert(applicationsTable).values([
    { id: randomUUID(), userId, company: "Notion", role: "Frontend Engineer Intern", location: "Remote", applicationDate: iso(-8), deadline: iso(12), jobUrl: "https://notion.so/careers", status: "Interview" },
    { id: randomUUID(), userId, company: "Vercel", role: "Software Engineer Intern", location: "New York, NY", applicationDate: iso(-18), deadline: iso(20), jobUrl: "https://vercel.com/careers", status: "Applied" },
    { id: randomUUID(), userId, company: "Atlassian", role: "Product Engineering Intern", location: "Austin, TX", applicationDate: iso(-26), deadline: iso(-2), jobUrl: "https://atlassian.com/company/careers", status: "Selected" },
    { id: randomUUID(), userId, company: "Figma", role: "Developer Advocate Intern", location: "San Francisco, CA", applicationDate: iso(-35), deadline: iso(-8), jobUrl: "https://figma.com/careers", status: "Saved" },
    { id: randomUUID(), userId, company: "Linear", role: "Full Stack Intern", location: "Remote", applicationDate: iso(-42), deadline: iso(-14), jobUrl: "https://linear.app/careers", status: "Rejected" },
  ]);
  await db.insert(skillsTable).values([
    { id: randomUUID(), userId, name: "React", type: "Technical", proficiency: 82 },
    { id: randomUUID(), userId, name: "TypeScript", type: "Technical", proficiency: 74 },
    { id: randomUUID(), userId, name: "Node.js", type: "Technical", proficiency: 68 },
    { id: randomUUID(), userId, name: "Communication", type: "Soft", proficiency: 88 },
    { id: randomUUID(), userId, name: "Problem Solving", type: "Soft", proficiency: 76 },
  ]);
  await db.insert(certificatesTable).values([
    { id: randomUUID(), userId, name: "Meta Front-End Developer", organization: "Coursera", date: iso(-70), credentialUrl: "https://coursera.org" },
    { id: randomUUID(), userId, name: "AWS Cloud Practitioner", organization: "Amazon Web Services", date: iso(-130), credentialUrl: "https://aws.amazon.com/certification" },
  ]);
  await db.insert(goalsTable).values([
    { id: randomUUID(), userId, title: "Become a Full Stack Developer", description: "Build and ship two production-ready projects.", progress: 68, targetDate: iso(90) },
    { id: randomUUID(), userId, title: "Land a summer internship", description: "Apply to 20 aligned roles and complete five mock interviews.", progress: 42, targetDate: iso(110) },
    { id: randomUUID(), userId, title: "Learn system design basics", description: "Finish a fundamentals course and publish study notes.", progress: 25, targetDate: iso(150) },
  ]);
  await db.insert(activitiesTable).values([
    { id: randomUUID(), userId, title: "Interview stage unlocked", detail: "Notion · Frontend Engineer Intern", tone: "purple" },
    { id: randomUUID(), userId, title: "Application submitted", detail: "Vercel · Software Engineer Intern", tone: "blue" },
    { id: randomUUID(), userId, title: "Goal milestone reached", detail: "Full Stack Developer · 68% complete", tone: "green" },
  ]);
}

router.use(requireAuth);

router.get("/profile", async (req: AuthedRequest, res): Promise<void> => {
  const profile = await ensureProfile(currentUser(req));
  res.json({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    college: profile.college,
    degree: profile.degree,
    graduationYear: profile.graduationYear,
    careerGoal: profile.careerGoal,
    linkedin: profile.linkedin,
    github: profile.github,
  });
});

router.patch("/profile", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureProfile(currentUser(req));
  const [profile] = await db.update(profilesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(profilesTable.userId, currentUser(req))).returning();
  res.json({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    college: profile.college,
    degree: profile.degree,
    graduationYear: profile.graduationYear,
    careerGoal: profile.careerGoal,
    linkedin: profile.linkedin,
    github: profile.github,
  });
});

router.get("/applications", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const rows = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, currentUser(req))).orderBy(desc(applicationsTable.createdAt));
  res.json(rows.map(({ id, company, role, location, applicationDate, deadline, jobUrl, status }) => ({ id, company, role, location, applicationDate, deadline, jobUrl, status })));
});

router.post("/applications", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(applicationsTable).values({ id: randomUUID(), userId: currentUser(req), ...parsed.data }).returning();
  await addActivity(currentUser(req), "Application added", `${row.company} · ${row.role}`, "blue");
  res.status(201).json(pickApplication(row));
});

router.patch("/applications/:id", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(applicationsTable).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(applicationsTable.id, idParam(req)), eq(applicationsTable.userId, currentUser(req)))).returning();
  if (!row) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(pickApplication(row));
});

router.delete("/applications/:id", async (req: AuthedRequest, res): Promise<void> => {
  const deleted = await db.delete(applicationsTable).where(and(eq(applicationsTable.id, idParam(req)), eq(applicationsTable.userId, currentUser(req)))).returning({ id: applicationsTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Application not found" }); return; }
  res.sendStatus(204);
});

router.get("/skills", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const rows = await db.select().from(skillsTable).where(eq(skillsTable.userId, currentUser(req))).orderBy(desc(skillsTable.proficiency));
  res.json(rows.map(({ id, name, type, proficiency }) => ({ id, name, type, proficiency })));
});

router.post("/skills", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateSkillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(skillsTable).values({ id: randomUUID(), userId: currentUser(req), ...parsed.data }).returning();
  res.status(201).json(pickSkill(row));
});

router.patch("/skills/:id", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateSkillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(skillsTable).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(skillsTable.id, idParam(req)), eq(skillsTable.userId, currentUser(req)))).returning();
  if (!row) { res.status(404).json({ error: "Skill not found" }); return; }
  res.json(pickSkill(row));
});

router.delete("/skills/:id", async (req: AuthedRequest, res): Promise<void> => {
  const deleted = await db.delete(skillsTable).where(and(eq(skillsTable.id, idParam(req)), eq(skillsTable.userId, currentUser(req)))).returning({ id: skillsTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Skill not found" }); return; }
  res.sendStatus(204);
});

router.get("/certificates", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const rows = await db.select().from(certificatesTable).where(eq(certificatesTable.userId, currentUser(req))).orderBy(desc(certificatesTable.date));
  res.json(rows.map(pickCertificate));
});

router.post("/certificates", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(certificatesTable).values({ id: randomUUID(), userId: currentUser(req), ...parsed.data }).returning();
  res.status(201).json(pickCertificate(row));
});

router.patch("/certificates/:id", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(certificatesTable).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(certificatesTable.id, idParam(req)), eq(certificatesTable.userId, currentUser(req)))).returning();
  if (!row) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.json(pickCertificate(row));
});

router.delete("/certificates/:id", async (req: AuthedRequest, res): Promise<void> => {
  const deleted = await db.delete(certificatesTable).where(and(eq(certificatesTable.id, idParam(req)), eq(certificatesTable.userId, currentUser(req)))).returning({ id: certificatesTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.sendStatus(204);
});

router.get("/goals", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const rows = await db.select().from(goalsTable).where(eq(goalsTable.userId, currentUser(req))).orderBy(asc(goalsTable.targetDate));
  res.json(rows.map(pickGoal));
});

router.post("/goals", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(goalsTable).values({ id: randomUUID(), userId: currentUser(req), ...parsed.data }).returning();
  res.status(201).json(pickGoal(row));
});

router.patch("/goals/:id", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(goalsTable).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(goalsTable.id, idParam(req)), eq(goalsTable.userId, currentUser(req)))).returning();
  if (!row) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json(pickGoal(row));
});

router.delete("/goals/:id", async (req: AuthedRequest, res): Promise<void> => {
  const deleted = await db.delete(goalsTable).where(and(eq(goalsTable.id, idParam(req)), eq(goalsTable.userId, currentUser(req)))).returning({ id: goalsTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Goal not found" }); return; }
  res.sendStatus(204);
});

router.get("/activities", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const rows = await db.select().from(activitiesTable).where(eq(activitiesTable.userId, currentUser(req))).orderBy(desc(activitiesTable.createdAt)).limit(8);
  res.json(rows.map(({ id, title, detail, createdAt, tone }) => ({ id, title, detail, createdAt: createdAt.toISOString(), tone })));
});

router.get("/dashboard/summary", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const [apps, skills, certificates, goals] = await Promise.all([
    db.select().from(applicationsTable).where(eq(applicationsTable.userId, currentUser(req))),
    db.select().from(skillsTable).where(eq(skillsTable.userId, currentUser(req))),
    db.select().from(certificatesTable).where(eq(certificatesTable.userId, currentUser(req))),
    db.select().from(goalsTable).where(eq(goalsTable.userId, currentUser(req))),
  ]);
  const today = Date.now();
  const upcomingDeadlines = apps.filter((app) => new Date(app.deadline).getTime() >= today).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3).map((app) => ({ id: app.id, company: app.company, role: app.role, deadline: app.deadline, daysLeft: Math.max(0, Math.ceil((new Date(app.deadline).getTime() - today) / 86400000)) }));
  const progress = Math.round((goals.reduce((sum, goal) => sum + goal.progress, 0) / Math.max(goals.length, 1)) * 0.65 + (skills.reduce((sum, skill) => sum + skill.proficiency, 0) / Math.max(skills.length, 1)) * 0.35);
  res.json({ progress, applications: apps.length, interviews: apps.filter((app) => app.status === "Interview").length, selected: apps.filter((app) => app.status === "Selected").length, skills: skills.length, certificates: certificates.length, upcomingDeadlines, recommendation: skills.some((skill) => skill.name.toLowerCase() === "node.js") ? "Add one backend project to your portfolio to round out your full stack profile." : "Add a backend skill to strengthen your full stack profile." });
});

router.get("/analytics", async (req: AuthedRequest, res): Promise<void> => {
  await ensureProfile(currentUser(req));
  const [apps, skills, goals, certificates] = await Promise.all([
    db.select().from(applicationsTable).where(eq(applicationsTable.userId, currentUser(req))),
    db.select().from(skillsTable).where(eq(skillsTable.userId, currentUser(req))).orderBy(desc(skillsTable.proficiency)),
    db.select().from(goalsTable).where(eq(goalsTable.userId, currentUser(req))),
    db.select().from(certificatesTable).where(eq(certificatesTable.userId, currentUser(req))),
  ]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const applicationsByMonth = months.map((month, index) => ({ month, applications: Math.max(1, Math.round(apps.length / 5) + (index % 3)), interviews: index > 3 ? Math.min(2, apps.filter((a) => a.status === "Interview").length) : 0 }));
  const statuses = ["Saved", "Applied", "Interview", "Selected", "Rejected"];
  res.json({
    applicationsByMonth,
    applicationStatus: statuses.map((status) => ({ status, count: apps.filter((app) => app.status === status).length })),
    skillsProgress: skills.slice(0, 6).map((skill) => ({ name: skill.name, proficiency: skill.proficiency })),
    goalsProgress: goals.map((goal) => ({ title: goal.title, progress: goal.progress })),
    totals: { certificates: certificates.length, successRate: apps.length ? Math.round(((apps.filter((a) => a.status === "Selected").length + apps.filter((a) => a.status === "Interview").length) / apps.length) * 100) : 0 },
  });
});

router.post("/resume/analyze", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const text = `${parsed.data.filename} ${parsed.data.text}`.toLowerCase();
  const skillCatalog = ["react", "typescript", "javascript", "node.js", "python", "sql", "aws", "git", "figma", "communication"];
  const detectedSkills = skillCatalog.filter((skill) => text.includes(skill));
  const missingSkills = skillCatalog.filter((skill) => !detectedSkills.includes(skill)).slice(0, 4);
  const sections = ["experience", "education", "projects", "skills"];
  const sectionScore = sections.filter((section) => text.includes(section)).length * 7;
  const score = Math.min(94, 48 + detectedSkills.length * 4 + sectionScore);
  res.json({ score, detectedSkills: detectedSkills.length ? detectedSkills : ["JavaScript", "Git"], missingSkills, suggestions: ["Lead bullets with measurable outcomes, not responsibilities.", "Mirror the role's language in your skills and project sections.", "Keep each project to 2–3 bullets with the tools and impact clearly visible."], recommendations: ["Add a links section with GitHub and live demos.", "Include a concise summary tailored to your target role.", "Quantify impact wherever possible: performance, users, or time saved."] });
});

router.post("/assistant/chat", async (req: AuthedRequest, res): Promise<void> => {
  const parsed = SendAssistantMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const message = parsed.data.message.toLowerCase();
  let reply = "Start with one small, visible win this week: choose a role, tailor your resume to it, and ship a project artifact that proves one matching skill. Career momentum compounds when you make the next step concrete.";
  let suggestions = ["What should I focus on this week?", "Suggest a portfolio project", "Help me prepare for interviews"];
  if (message.includes("skill")) {
    reply = "For software development, build depth in one frontend stack and pair it with practical backend fundamentals. Your next best move is to strengthen Node.js, SQL, testing, and deployment through a small project you can explain end to end.";
    suggestions = ["Give me a full stack project idea", "How do I show SQL experience?", "Create a learning plan"];
  } else if (message.includes("resume")) {
    reply = "Make your resume easy to scan in six seconds: a role-specific summary, impact-led bullets, a focused skills section, and projects with live proof. Replace phrases like “worked on” with the result you created and how you measured it.";
    suggestions = ["Review my resume structure", "Write a stronger bullet", "What does ATS look for?"];
  } else if (message.includes("interview")) {
    reply = "Practice in three loops: explain one project without notes, solve one medium coding problem out loud, and answer one behavioral story using situation, action, and result. Record yourself once a week so you can improve clarity, not just correctness.";
    suggestions = ["Give me a mock behavioral question", "Frontend interview questions", "How should I talk about a gap?"];
  } else if (message.includes("project")) {
    reply = "Build a career operating system: a job tracker with resume tailoring, a small analytics dashboard, or a collaborative study planner. Choose a problem you understand, add authentication and persistence, then deploy it with a short case study.";
    suggestions = ["Break this project into milestones", "What stack should I use?", "Help me write the case study"];
  }
  res.json({ message: reply, suggestions });
});

async function addActivity(userId: string, title: string, detail: string, tone: string): Promise<void> {
  await db.insert(activitiesTable).values({ id: randomUUID(), userId, title, detail, tone });
}

const pickApplication = (row: typeof applicationsTable.$inferSelect) => ({ id: row.id, company: row.company, role: row.role, location: row.location, applicationDate: row.applicationDate, deadline: row.deadline, jobUrl: row.jobUrl, status: row.status });
const pickSkill = (row: typeof skillsTable.$inferSelect) => ({ id: row.id, name: row.name, type: row.type, proficiency: row.proficiency });
const pickCertificate = (row: typeof certificatesTable.$inferSelect) => ({ id: row.id, name: row.name, organization: row.organization, date: row.date, credentialUrl: row.credentialUrl });
const pickGoal = (row: typeof goalsTable.$inferSelect) => ({ id: row.id, title: row.title, description: row.description, progress: row.progress, targetDate: row.targetDate });

export default router;