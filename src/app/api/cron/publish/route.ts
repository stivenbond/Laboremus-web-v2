import { runtime } from "@/lib/effect-runtime";
import { PublishingEngine } from "@/lib/publishing-engine";
import { Effect } from "effect";
import { NextRequest, NextResponse } from "next/server";

// This route is called by Docker cron / Vercel cron to trigger scheduled publishing
export async function GET(req: NextRequest) {
  // Basic secret protection — set CRON_SECRET in .env
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const published = await runtime.runPromise(
      Effect.gen(function* (_) {
        const engine = yield* _(PublishingEngine);
        return yield* _(engine.runOnce);
      })
    );
    return NextResponse.json({ published });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
