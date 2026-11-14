import { afterEach, expect, test, vi } from "vitest";
import { createHandler, PUBLIC_HOURLY_BUDGETS } from "../lib/server/api";
import type { Store } from "../lib/server/store";

afterEach(() => vi.unstubAllGlobals());
test("OCR requires opt-in, is bounded, and preserves uploads on failure", async () => {
  const counts = new Map<string, number>();
  const saveReceipt = vi.fn(async () => {});
  const store = { saveReceipt, incrementLimit: async (key: string) => {
    const n = (counts.get(key) ?? 0) + 1; counts.set(key, n); return n;
  } } as unknown as Store;
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ merchant: "Cafe", total: "12.50", currency: "USD" }) } }] }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const handle = createHandler(store, undefined, { ocr: { key: "secret", model: "model" } });
  const upload = (optIn: boolean) => handle(new Request("https://split.test/api/receipts", {
    method: "POST", headers: { Origin: "https://split.test", Cookie: `sdb_session=${"a".repeat(64)}`, "X-Receipt-Ocr": String(optIn) }, body: new Uint8Array([255, 216, 255, 0]),
  }));
  expect(((await (await upload(false)).json()) as { extracted: unknown }).extracted).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(((await (await upload(true)).json()) as { extracted: unknown }).extracted).toEqual({ merchant: "Cafe", total: "12.50", currency: "USD" });
  fetchMock.mockImplementationOnce(async () => new Response("unavailable", { status: 503 }));
  expect(((await (await upload(true)).json()) as { extracted: unknown }).extracted).toBeNull();
  await upload(true);
  expect(((await (await upload(true)).json()) as { extracted: unknown }).extracted).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(saveReceipt).toHaveBeenCalledTimes(5);
  expect(PUBLIC_HOURLY_BUDGETS.ocr).toBeLessThan(PUBLIC_HOURLY_BUDGETS.upload);
});
