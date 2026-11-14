import { intentsProvider } from "../providers/intents";
import { paymentReadiness } from "../providers/near";
import type { PaymentOptions } from "./api";

// Server-only configuration. A credential never enables payments by itself.
export function paymentOptions(settings: Record<string, string | undefined>, liveTestOwnerAuthorized = false, native = false): PaymentOptions {
  const publicPilot = native && settings.PUBLIC_LIVE_PILOT === "true" && settings.STANDALONE_PRIVATE_ACCESS !== "true";
  let ocr: PaymentOptions["ocr"];
  if (settings.OCR_ENABLED === "true") {
    if (settings.OCR_SPACE_API_KEY) ocr = { provider: "ocr-space", key: settings.OCR_SPACE_API_KEY };
    else if (settings.NEAR_AI_API_KEY && settings.NEAR_AI_MODEL)
      ocr = { provider: "near-ai", key: settings.NEAR_AI_API_KEY, model: settings.NEAR_AI_MODEL };
  }
  return {
    publicPilot,
    ocr,
    readiness: paymentReadiness(settings, liveTestOwnerAuthorized || (publicPilot && settings.LIVE_PAYMENT_TESTING === "true")),
    receiptCleanupEnabled: settings.RECEIPT_CLEANUP_ENABLED === "true",
    // Applied only after the API validates the specific share capability.
    payerReadiness: settings.LIVE_PAYMENT_TESTING === "true" && (native ? settings.STANDALONE_PRIVATE_ACCESS === "true" : settings.PRIVATE_LIVE_TEST_HOST === "true") ? paymentReadiness(settings, true) : undefined,
    provider: settings.NEAR_INTENTS_API_KEY ? intentsProvider(settings.NEAR_INTENTS_API_KEY) : undefined,
  };
}
