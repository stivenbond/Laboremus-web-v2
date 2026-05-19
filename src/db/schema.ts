import { boolean, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', [
  'admin', 
  'editor-in-chief', 
  'overseer', 
  'writer', 
  'editor', 
  'formatter', 
  'publisher', 
  'approver'
]);

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("writer"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => users.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => users.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password")
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const documentStatusEnum = pgEnum('document_status', [
  'draft', 'in_review', 'approved', 'formatting', 'formatting_review', 'scheduled', 'published', 'rejected'
]);

export const documents = pgTable("document", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("draft"),
  assignedWriterId: text("assignedWriterId").references(() => users.id),
  assignedEditorId: text("assignedEditorId").references(() => users.id),
  // Scheduling
  scheduledPublishAt: timestamp("scheduledPublishAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const documentDrafts = pgTable("document_draft", {
  id: text("id").primaryKey(),
  documentId: text("documentId").notNull().references(() => documents.id),
  content: text("content").notNull(), // Tiptap JSON or Markdown
  authorId: text("authorId").notNull().references(() => users.id),
  lastSavedAt: timestamp("lastSavedAt").notNull().defaultNow(),
}, (t) => [
  unique().on(t.documentId, t.authorId)
]);

export const documentVersions = pgTable("document_version", {
  id: text("id").primaryKey(),
  documentId: text("documentId").notNull().references(() => documents.id),
  versionNumber: serial("versionNumber").notNull(),
  content: text("content").notNull(),
  commitMessage: text("commitMessage"),
  authorId: text("authorId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const documentComments = pgTable("document_comment", {
  id: text("id").primaryKey(),
  versionId: text("versionId").notNull().references(() => documentVersions.id),
  authorId: text("authorId").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum('notification_type', [
  'ASSIGNMENT', 'APPROVAL', 'REJECTION', 'REVIEW_REQUEST', 'PUBLISH', 'SYSTEM'
]);

export const notifications = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  documentId: text("documentId").references(() => documents.id),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
