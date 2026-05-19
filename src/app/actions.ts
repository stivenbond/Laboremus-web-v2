'use server'

import { Effect, Layer } from "effect";
import { runtime } from "@/lib/effect-runtime";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CurrentUser, requireRole } from "@/lib/auth-context";
import { DocumentEngine } from "@/lib/document-engine";
import { BriefEngine, BriefAssignment } from "@/lib/brief-engine";
import { AIIntegration } from "@/lib/ai-integration";
import { NotificationEngine } from "@/lib/notifications";
import { db } from "@/db";
import { users, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Generic runner that injects the auth session into the Effect fiber
async function runWithAuth<A, E>(effect: Effect.Effect<A, E, CurrentUser | DocumentEngine | BriefEngine | AIIntegration | NotificationEngine>) {
  // Extract better-auth session from the request headers
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders
  });

  if (!session?.user) {
    throw new Error("Unauthorized: No active session found.");
  }

  // Map better-auth user to our internal Effect Context
  const AuthLayer = Layer.succeed(
    CurrentUser,
    CurrentUser.of({
      id: session.user.id,
      role: (session.user as { role?: "admin" | "editor-in-chief" | "overseer" | "writer" | "editor" | "formatter" | "publisher" | "approver" }).role || "writer"
    })
  );

  // Provide the auth layer and run using our managed runtime
  const runnable = Effect.provide(effect, AuthLayer);
  
  try {
    return await runtime.runPromise(runnable);
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    // Return serializable error for Next.js
    return { success: false, error: message };
  }
}

// Exposed Server Actions

export async function fetchUsersByRoleAction(role: string) {
  return runWithAuth(Effect.gen(function* (_) {
    // Basic Drizzle query wrapped inside Effect
    const results = yield* _(Effect.promise(() => 
      db.select().from(users).where(eq(users.role, role as 'admin' | 'editor-in-chief' | 'overseer' | 'writer' | 'editor' | 'formatter' | 'publisher' | 'approver'))
    ));
    return results;
  }));
}

export async function createBriefAction(assignments: BriefAssignment[]) {
  return runWithAuth(Effect.gen(function* (_) {
    const briefEngine = yield* _(BriefEngine);
    return yield* _(briefEngine.createBriefs(assignments));
  }));
}

export async function getPendingBriefsAction() {
  return runWithAuth(Effect.gen(function* (_) {
    const results = yield* _(Effect.promise(() => 
      db.select().from(documents).where(eq(documents.status, "draft"))
    ));
    return results;
  }));
}

export async function approveBriefAction(documentId: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const briefEngine = yield* _(BriefEngine);
    return yield* _(briefEngine.approveBrief(documentId));
  }));
}

export async function saveDraftAction(documentId: string, content: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const engine = yield* _(DocumentEngine);
    return yield* _(engine.saveDraft(documentId, content));
  }));
}

export async function commitVersionAction(documentId: string, message: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const engine = yield* _(DocumentEngine);
    return yield* _(engine.commitVersion(documentId, message));
  }));
}

export async function submitForReviewAction(documentId: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const engine = yield* _(DocumentEngine);
    return yield* _(engine.submitForReview(documentId));
  }));
}

export async function reviewDocumentAction(documentId: string, approve: boolean, comment?: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const engine = yield* _(DocumentEngine);
    return yield* _(engine.reviewDocument(documentId, approve, comment));
  }));
}

// --- Publishing Pipeline Actions ---

export async function schedulePublishingAction(documentId: string, publishDate: Date) {
  return runWithAuth(Effect.gen(function* (_) {
    yield* _(requireRole(["publisher", "overseer"]));
    yield* _(Effect.promise(() =>
      db.update(documents).set({
        status: "scheduled",
        scheduledPublishAt: publishDate,
        updatedAt: new Date(),
      }).where(eq(documents.id, documentId))
    ));
    return { success: true };
  }));
}

export async function approveForPublishingAction(documentId: string) {
  return runWithAuth(Effect.gen(function* (_) {
    yield* _(requireRole(["approver"]));
    const now = new Date();
    // Check if scheduled date is in the past — publish immediately if so
    const docs = yield* _(Effect.promise(() =>
      db.select().from(documents).where(eq(documents.id, documentId))
    ));
    const doc = docs[0];
    if (!doc) return yield* _(Effect.fail(new Error("Document not found")));

    const publishImmediately = !doc.scheduledPublishAt || doc.scheduledPublishAt <= now;
    yield* _(Effect.promise(() =>
      db.update(documents).set({
        status: publishImmediately ? "published" : "scheduled",
        publishedAt: publishImmediately ? now : undefined,
        updatedAt: now,
      }).where(eq(documents.id, documentId))
    ));
    return { success: true, publishedImmediately: publishImmediately };
  }));
}

export async function rejectPublishedAction(documentId: string, _comment: string) {
  return runWithAuth(Effect.gen(function* (_) {
    yield* _(requireRole(["approver", "overseer"]));
    yield* _(Effect.promise(() =>
      db.update(documents).set({
        status: "in_review",
        updatedAt: new Date(),
      }).where(eq(documents.id, documentId))
    ));
    // Comment is saved separately by caller if needed via reviewDocumentAction
    void _comment;
    return { success: true };
  }));
}

// --- EIC Reassignment (preserves authorship trail in document_versions) ---

export async function reassignDocumentAction(
  documentId: string,
  newWriterId: string | null,
  newEditorId: string | null
) {
  return runWithAuth(Effect.gen(function* (_) {
    yield* _(requireRole(["editor-in-chief", "overseer"]));
    yield* _(Effect.promise(() =>
      db.update(documents).set({
        assignedWriterId: newWriterId ?? undefined,
        assignedEditorId: newEditorId ?? undefined,
        updatedAt: new Date(),
      }).where(eq(documents.id, documentId))
    ));
    // Authorship is preserved: document_versions retain original authorId
    return { success: true };
  }));
}

export async function analyzeDocumentAction(content: string) {
  return runWithAuth(Effect.gen(function* (_) {
    const ai = yield* _(AIIntegration);
    return yield* _(ai.analyzeDocument(content));
  }));
}

