import { Effect, Context, Layer } from "effect";

// Define a generic interface for the external REST API AI tool
export interface AIRecommendation {
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  contextSpan?: [number, number]; // index points
}

export class AIIntegration extends Context.Tag("AIIntegration")<
  AIIntegration,
  {
    analyzeDocument: (content: string) => Effect.Effect<AIRecommendation[], Error>;
  }
>() {}

export const AIIntegrationLive = Layer.succeed(
  AIIntegration,
  AIIntegration.of({
    analyzeDocument: (content) => Effect.gen(function* (_) {
      const apiKey = process.env.AI_API_KEY;
      const model = process.env.AI_MODEL || "gemini-1.5-flash";

      if (!apiKey) {
        // Fallback robust offline rule-based analyzer
        yield* _(Effect.log("No AI_API_KEY configured. Running local fallback analysis..."));
        
        const recommendations: AIRecommendation[] = [];
        const lower = content.toLowerCase();

        if (lower.includes("utilize")) {
          recommendations.push({
            suggestion: "Consider replacing 'utilize' with the simpler word 'use'.",
            severity: "low"
          });
        }

        if (lower.includes("in order to")) {
          recommendations.push({
            suggestion: "Simplify 'in order to' to just 'to'.",
            severity: "low"
          });
        }

        if (content.length > 5000) {
          recommendations.push({
            suggestion: "This article is quite long. Consider breaking it up with headers or H2 tags.",
            severity: "medium"
          });
        }

        return recommendations;
      }

      // Live External REST API Call
      try {
        const response = yield* _(Effect.promise(() =>
          fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze this content and return a JSON array of actionable suggestions. Each item must have:
                         - 'suggestion': string description
                         - 'severity': 'low', 'medium', or 'high'
                         Return ONLY valid JSON. Content to analyze: ${content}`
                }]
              }]
            })
          }).then(res => res.json())
        ));

        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        // Parse result safely
        const parsed: AIRecommendation[] = JSON.parse(text.substring(text.indexOf("["), text.lastIndexOf("]") + 1));
        return parsed;
      } catch {
        return yield* _(Effect.fail(new Error("External AI REST API call failed.")));
      }
    })
  })
);
