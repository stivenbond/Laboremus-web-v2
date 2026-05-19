import { Context, Effect, Layer } from "effect";

// Define the shape of our User context
export interface UserContext {
  id: string;
  role: "admin" | "editor-in-chief" | "overseer" | "writer" | "editor" | "formatter" | "publisher" | "approver";
}

// Create the Context tag
export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  UserContext
>() {}

// Helper to assert roles
export const requireRole = (allowedRoles: UserContext["role"][]) =>
  Effect.gen(function* (_) {
    const user = yield* _(CurrentUser);
    if (!allowedRoles.includes(user.role)) {
      return yield* _(Effect.fail(new Error("Unauthorized: Insufficient role")));
    }
    return user;
  });

// Layer providing a mock admin (for now, until we wire it up to the API middleware)
export const MockAdminLayer = Layer.succeed(
  CurrentUser,
  CurrentUser.of({ id: "mock-admin-id", role: "admin" })
);
