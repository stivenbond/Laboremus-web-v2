import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import { Effect, Layer } from 'effect';

describe('End-to-End Editorial Workflow', () => {
  let container: any;
  let dbClient: any;
  let db: any;

  // Environment variables and roles setup
  let EicLayer: any;
  let OverseerLayer: any;
  let WriterLayer: any;
  let EditorLayer: any;
  let PublisherLayer: any;
  let ApproverLayer: any;
  let MainLayer: any;

  beforeAll(async () => {
    // 1. Spin up a fresh PostgreSql testcontainer
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const connectionUri = container.getConnectionUri();
    
    // Override the process.env so our @/db module connects here
    process.env.DATABASE_URL = connectionUri;

    // Connect to the DB
    dbClient = postgres(connectionUri);
    db = drizzle(dbClient);

    // 2. Programmatically apply Drizzle migrations
    await migrate(db, { migrationsFolder: path.resolve(__dirname, 'migrations') });

    // 3. Dynamically import modules to ensure they read the new environment variable
    const { users } = await import('./schema');
    const { CurrentUser } = await import('../lib/auth-context');
    const { NotificationEngineLive } = await import('../lib/notifications');
    const { NotificationDbWriterLive } = await import('../lib/notifications-db');
    const { DocumentEngineLive } = await import('../lib/document-engine');
    const { BriefEngineLive } = await import('../lib/brief-engine');
    const { AIIntegrationLive } = await import('../lib/ai-integration');
    const { PublishingEngine } = await import('../lib/publishing-engine');

    // 4. Seed the database with users
    await db.insert(users).values([
      { id: "eic-1", name: "Bob EIC", email: "eic@laboremus.com", role: "editor-in-chief" },
      { id: "overseer-1", name: "Charlie Overseer", email: "overseer@laboremus.com", role: "overseer" },
      { id: "writer-1", name: "Dan Writer", email: "writer@laboremus.com", role: "writer" },
      { id: "editor-1", name: "Eve Editor", email: "editor@laboremus.com", role: "editor" },
      { id: "formatter-1", name: "Frank Formatter", email: "formatter@laboremus.com", role: "formatter" },
      { id: "publisher-1", name: "Grace Publisher", email: "publisher@laboremus.com", role: "publisher" },
      { id: "approver-1", name: "Hank Approver", email: "approver@laboremus.com", role: "approver" },
    ]);

    // 5. Construct layers for roles
    EicLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "eic-1", role: "editor-in-chief" }));
    OverseerLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "overseer-1", role: "overseer" }));
    WriterLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "writer-1", role: "writer" }));
    EditorLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "editor-1", role: "editor" }));
    PublisherLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "publisher-1", role: "publisher" }));
    ApproverLayer = Layer.succeed(CurrentUser, CurrentUser.of({ id: "approver-1", role: "approver" }));

    // 6. Build the live app domain dependency layer
    const NotificationLive = NotificationDbWriterLive.pipe(Layer.provide(NotificationEngineLive));
    const DocumentLive = DocumentEngineLive.pipe(Layer.provide(NotificationLive));
    const BriefLive = BriefEngineLive.pipe(
      Layer.provide(DocumentLive),
      Layer.provide(NotificationLive)
    );

    MainLayer = Layer.mergeAll(
      NotificationLive,
      DocumentLive,
      BriefLive,
      AIIntegrationLive,
      PublishingEngine.Default
    );
  }, 60000);

  afterAll(async () => {
    if (dbClient) await dbClient.end();
    if (container) await container.stop();
  });

  // Runner helper
  const runAs = (effect: any, userLayer: any) => {
    const runnable = effect.pipe(
      Effect.provide(MainLayer),
      Effect.provide(userLayer)
    );
    return Effect.runPromise(runnable);
  };

  it('should run the complete collaborative publishing workflow successfully', async () => {
    const { BriefEngine } = await import('../lib/brief-engine');
    const { DocumentEngine } = await import('../lib/document-engine');
    const { AIIntegration } = await import('../lib/ai-integration');
    const { PublishingEngine } = await import('../lib/publishing-engine');
    const { documents, documentDrafts, documentVersions, notifications, documentComments } = await import('./schema');
    const { eq } = await import('drizzle-orm');

    // --- STEP 1: Editor-in-Chief creates and assigns a brief ---
    const briefAssignment = {
      title: "AI Revolution",
      instructions: "Explain why simple words like utilize in order to are bad.",
      writerId: "writer-1",
      editorId: "editor-1",
    };

    const createBriefResult = await runAs(
      Effect.gen(function* (_) {
        const briefEngine = yield* _(BriefEngine);
        return yield* _(briefEngine.createBriefs([briefAssignment]));
      }),
      EicLayer
    );

    expect(createBriefResult.success).toBe(true);
    expect(createBriefResult.createdBriefs.length).toBe(1);
    const documentId = createBriefResult.createdBriefs[0].id;
    expect(documentId).toBeDefined();

    // Verify document was created in DB
    const dbDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(dbDocs.length).toBe(1);
    expect(dbDocs[0].title).toBe("AI Revolution");
    expect(dbDocs[0].status).toBe("draft"); // Initially a draft brief

    // Verify assignment notification was written to DB
    const dbNotifications = await db.select().from(notifications).where(eq(notifications.userId, "writer-1"));
    expect(dbNotifications.length).toBe(1);
    expect(dbNotifications[0].type).toBe("ASSIGNMENT");
    expect(dbNotifications[0].message).toContain("AI Revolution");

    // --- STEP 2: Overseer approves the Brief ---
    const approveBriefResult = await runAs(
      Effect.gen(function* (_) {
        const briefEngine = yield* _(BriefEngine);
        return yield* _(briefEngine.approveBrief(documentId));
      }),
      OverseerLayer
    );

    expect(approveBriefResult.success).toBe(true);

    // Verify status remains 'draft' (meaning approved & ready for writer drafting)
    const approvedDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(approvedDocs[0].status).toBe("draft");

    // Verify approval notification was sent to writer
    const writerNotifications = await db.select().from(notifications).where(eq(notifications.userId, "writer-1"));
    expect(writerNotifications.length).toBe(2); // Assignment + Approval
    expect(writerNotifications[1].type).toBe("APPROVAL");

    // --- STEP 3: Writer saves a draft and runs AI suggestions ---
    const articleContent = "We must utilize simple words in order to write good documentation.";
    
    // Save draft
    const saveDraftResult = await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.saveDraft(documentId, articleContent));
      }),
      WriterLayer
    );
    expect(saveDraftResult.success).toBe(true);

    const savedDrafts = await db.select().from(documentDrafts).where(eq(documentDrafts.documentId, documentId));
    expect(savedDrafts.length).toBe(1);
    expect(savedDrafts[0].content).toBe(articleContent);

    // Run local fallback AI Recommendations on this draft
    const aiRecommendations = await runAs(
      Effect.gen(function* (_) {
        const ai = yield* _(AIIntegration);
        return yield* _(ai.analyzeDocument(articleContent));
      }),
      WriterLayer
    );
    // Offline fallback analyzer should flag "utilize" and "in order to"
    expect(aiRecommendations.length).toBeGreaterThanOrEqual(2);
    expect(aiRecommendations[0].suggestion).toContain("utilize");
    expect(aiRecommendations[1].suggestion).toContain("in order to");

    // Commit a version
    const commitResult = await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.commitVersion(documentId, "Initial Version Draft"));
      }),
      WriterLayer
    );
    expect(commitResult.success).toBe(true);

    const versions = await db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId));
    expect(versions.length).toBe(1);
    expect(versions[0].content).toBe(articleContent);
    expect(versions[0].commitMessage).toBe("Initial Version Draft");

    // --- STEP 4: Writer submits for Review ---
    const submitResult = await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.submitForReview(documentId));
      }),
      WriterLayer
    );
    expect(submitResult.success).toBe(true);

    const submittedDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(submittedDocs[0].status).toBe("in_review");

    // --- STEP 5: Editor reviews and rejects it (simulating rework cycle) ---
    const rejectReviewResult = await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.reviewDocument(documentId, false, "Please resolve AI suggestions to use simpler words."));
      }),
      EditorLayer
    );
    expect(rejectReviewResult.success).toBe(true);

    // Verify document was marked as rejected in DB
    const rejectedDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(rejectedDocs[0].status).toBe("rejected");

    // Verify rejection notification was sent to writer
    const writerAfterRejectNotifications = await db.select().from(notifications).where(eq(notifications.userId, "writer-1"));
    expect(writerAfterRejectNotifications.some(n => n.type === "REJECTION")).toBe(true);

    // Verify comment was logged under the version
    const versionComments = await db.select().from(documentComments).where(eq(documentComments.versionId, versions[0].id));
    expect(versionComments.length).toBe(1);
    expect(versionComments[0].content).toBe("Please resolve AI suggestions to use simpler words.");

    // --- STEP 6: Writer resolves and submits again ---
    const resolvedContent = "We must use simple words to write good documentation.";
    
    // Save draft
    await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.saveDraft(documentId, resolvedContent));
      }),
      WriterLayer
    );
    // Commit version
    await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.commitVersion(documentId, "Resolved word usage issues"));
      }),
      WriterLayer
    );
    // Submit for review
    await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.submitForReview(documentId));
      }),
      WriterLayer
    );

    // --- STEP 7: Editor reviews and Approves ---
    const approveReviewResult = await runAs(
      Effect.gen(function* (_) {
        const docEngine = yield* _(DocumentEngine);
        return yield* _(docEngine.reviewDocument(documentId, true, "Perfect! Much simpler."));
      }),
      EditorLayer
    );
    expect(approveReviewResult.success).toBe(true);

    const approvedArticleDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(approvedArticleDocs[0].status).toBe("approved");

    // --- STEP 8: Scheduling and Auto-Publishing ---
    // Schedule publication date in the past to trigger automated immediate publishing
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.update(documents).set({
      status: "scheduled",
      scheduledPublishAt: yesterday,
      updatedAt: new Date()
    }).where(eq(documents.id, documentId));

    // Run the Publishing Engine automated cron processor
    const publishedCount = await runAs(
      Effect.gen(function* (_) {
        const publishing = yield* _(PublishingEngine);
        return yield* _(publishing.runOnce);
      }),
      PublisherLayer
    );

    expect(publishedCount).toBe(1);

    // Verify document status is now 'published'
    const finalDocs = await db.select().from(documents).where(eq(documents.id, documentId));
    expect(finalDocs[0].status).toBe("published");
    expect(finalDocs[0].publishedAt).toBeDefined();
  });
});
