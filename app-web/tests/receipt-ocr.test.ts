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
  const handle = createHandler(store, undefined, { ocr: { provider: "near-ai", key: "secret", model: "model" } });
  const upload = (optIn: boolean) => handle(new Request("https://split.test/api/receipts", {
    method: "POST", headers: { Origin: "https://split.test", Cookie: `sdb_session=${"a".repeat(64)}`, "X-Receipt-Ocr": String(optIn), "X-Receipt-Ocr-Provider": "near-ai" }, body: new Uint8Array([255, 216, 255, 0]),
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

test("OCR.space consent is bound to its provider and large images keep manual entry", async () => {
  const saveReceipt = vi.fn(async () => {});
  const store = { saveReceipt, incrementLimit: async () => 1 } as unknown as Store;
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    OCRExitCode: 1,
    IsErroredOnProcessing: false,
    ParsedResults: [{ ParsedText: "THE GREEN TABLE\nTOTAL £200.00 GBP" }],
  })));
  vi.stubGlobal("fetch", fetchMock);
  const handle = createHandler(store, undefined, { ocr: { provider: "ocr-space", key: "secret" } });
  const config = await (await handle(new Request("https://split.test/api/config"))).json();
  expect(config).toMatchObject({ ocr: true, ocrProvider: "ocr-space" });
  expect(JSON.stringify(config)).not.toContain("secret");
  const upload = async (provider: string | null, size = 4) => {
    const bytes = new Uint8Array(size);
    bytes.set([255, 216, 255]);
    const headers: Record<string, string> = {
      Origin: "https://split.test",
      Cookie: `sdb_session=${"b".repeat(64)}`,
      "X-Receipt-Ocr": "true",
    };
    if (provider) headers["X-Receipt-Ocr-Provider"] = provider;
    return (await (await handle(new Request("https://split.test/api/receipts", { method: "POST", headers, body: bytes }))).json()) as {
      extracted: { merchant: string; total: string; currency: string } | null;
      message: string;
    };
  };
  expect((await upload("near-ai")).extracted).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  expect((await upload("ocr-space")).extracted).toEqual({ merchant: "THE GREEN TABLE", total: "200.00", currency: "GBP" });
  const large = await upload("ocr-space", 1_000_001);
  expect(large.extracted).toBeNull();
  expect(large.message).toContain("1 MB");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(saveReceipt).toHaveBeenCalledTimes(3);
});
