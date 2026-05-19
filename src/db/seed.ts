import { Effect, Console } from "effect";
import { db } from "./index";
import { users } from "./schema";

const seedUsers = [
  { id: "admin-1", name: "Alice Admin", email: "admin@laboremus.com", role: "admin" },
  { id: "eic-1", name: "Bob EIC", email: "eic@laboremus.com", role: "editor-in-chief" },
  { id: "overseer-1", name: "Charlie Overseer", email: "overseer@laboremus.com", role: "overseer" },
  { id: "writer-1", name: "Dan Writer", email: "writer@laboremus.com", role: "writer" },
  { id: "editor-1", name: "Eve Editor", email: "editor@laboremus.com", role: "editor" },
  { id: "formatter-1", name: "Frank Formatter", email: "formatter@laboremus.com", role: "formatter" },
  { id: "publisher-1", name: "Grace Publisher", email: "publisher@laboremus.com", role: "publisher" },
  { id: "approver-1", name: "Hank Approver", email: "approver@laboremus.com", role: "approver" },
] as const;

const seedProgram = Effect.gen(function* (_) {
  yield* _(Console.log("Seeding database with default users for each role..."));
  
  for (const user of seedUsers) {
    yield* _(
      Effect.promise(() =>
        db.insert(users).values({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }).onConflictDoUpdate({
          target: users.email,
          set: { role: user.role, name: user.name }
        })
      )
    );
    yield* _(Console.log(`Seeded user: ${user.name} (${user.role})`));
  }

  yield* _(Console.log("Seeding complete."));
});

// Run the Effect program
Effect.runPromise(seedProgram).catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
