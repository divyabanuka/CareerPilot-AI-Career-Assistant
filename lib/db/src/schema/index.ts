import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const profilesTable = pgTable("careerpilot_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull().default("Alex Morgan"),
  email: text("email").notNull().default(""),
  college: text("college").notNull().default(""),
  degree: text("degree").notNull().default(""),
  graduationYear: integer("graduation_year").notNull().default(2026),
  careerGoal: text("career_goal").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  github: text("github").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationsTable = pgTable("careerpilot_applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  applicationDate: text("application_date").notNull(),
  deadline: text("deadline").notNull(),
  jobUrl: text("job_url").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillsTable = pgTable("careerpilot_skills", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  proficiency: integer("proficiency").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificatesTable = pgTable("careerpilot_certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  date: text("date").notNull(),
  credentialUrl: text("credential_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goalsTable = pgTable("careerpilot_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  progress: integer("progress").notNull(),
  targetDate: text("target_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activitiesTable = pgTable("careerpilot_activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  tone: text("tone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});