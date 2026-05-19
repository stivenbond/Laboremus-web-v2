import { Layer, ManagedRuntime } from "effect";
import { NodeSdkLive } from "@effect/opentelemetry/NodeSdk";

// Define a basic effect runtime for the app
const MainLayer = NodeSdkLive; // You can expand this with more services (e.g., db)
export const runtime = ManagedRuntime.make(MainLayer);
