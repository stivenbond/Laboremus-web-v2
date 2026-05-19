import { Layer, ManagedRuntime } from "effect";
import { layerEmpty as NodeSdkLive } from "@effect/opentelemetry/NodeSdk";

import { NotificationEngineLive } from "./notifications";
import { DocumentEngineLive } from "./document-engine";
import { BriefEngineLive } from "./brief-engine";
import { AIIntegrationLive } from "./ai-integration";
import { MockAdminLayer } from "./auth-context";
import { PublishingEngine } from "./publishing-engine";

const NotificationLive = NotificationEngineLive;
const DocumentLive = DocumentEngineLive.pipe(Layer.provide(NotificationLive));
const BriefLive = BriefEngineLive.pipe(
  Layer.provide(DocumentLive),
  Layer.provide(NotificationLive)
);

// Combine our domain layers
const DomainLayer = Layer.mergeAll(
  NotificationLive,
  DocumentLive,
  BriefLive,
  AIIntegrationLive,
  PublishingEngine.Default
).pipe(Layer.provide(MockAdminLayer)); // provide auth context

// Define a basic effect runtime for the app merging OTel and Domain
const MainLayer = Layer.merge(NodeSdkLive, DomainLayer);

export const runtime = ManagedRuntime.make(MainLayer);
