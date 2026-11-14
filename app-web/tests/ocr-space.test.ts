import { afterEach, describe, expect, it, vi } from "vitest";
import { extractReceiptWithOcrSpace, parseOcrSpaceText } from "../lib/providers/ocr-space";
afterEach(() => vi.unstubAllGlobals());
describe("OCR.space parsing", () => {
  it("prefers explicit total over items and subtotal", () => {
    expect(parseOcrSpaceText("CAFE DE SEOUL\nSynthetic receipt\nDate 2026-01-01\nCoffee KRW 5000\nSubtotal KRW 5000\nTotal KRW 5500")).toEqual({ merchant: "CAFE DE SEOUL", total: "5500", currency: "KRW" });
  });
  it.each(["AED", "USD", "EUR", "GBP", "NGN", "CNY", "KRW", "JPY"])("accepts %s", currency => {
    expect(parseOcrSpaceText(`Cafe\nTotal ${currency} 12.50`)).toEqual({ merchant: "Cafe", total: "12.50", currency });
  });
  it("accepts unambiguous grouped amounts and currency-qualified symbols", () => {
    expect(parseOcrSpaceText("Cafe\nTotal USD $1,200.00")).toEqual({ merchant: "Cafe", total: "1200.00", currency: "USD" });
    expect(parseOcrSpaceText("Cafe\nTotal JPY ¥1200")).toEqual({ merchant: "Cafe", total: "1200", currency: "JPY" });
  });
  it("suggests merchant and amount while leaving an ambiguous dollar currency blank", () => {
    expect(parseOcrSpaceText("Cafe\nTotal $12.00")).toEqual({ merchant: "Cafe", total: "12.00" });
    expect(parseOcrSpaceText("Cafe\nTotal USD 12.00 EUR")).toEqual({ merchant: "Cafe", total: "12.00" });
  });
  it("reads the supplied noisy restaurant example without guessing its currency", () => {
    const text = "[Note: the 'helloworld' demo key is for testing only]\n# 49\n## DINEFINE\n## RESTAURANT\n123 CULINARY AVENUE\nSUBTOTAL: $47.50\nTAX: $3.80\nTOTAL: $51.30";
    expect(parseOcrSpaceText(text)).toEqual({ merchant: "DINEFINE RESTAURANT", total: "51.30" });
  });
  it.each(["Cafe\nSubtotal USD 12.00", "Cafe\nTotal USD 12.00\nTotal USD 13.00", "Cafe\nTotal USD 12.00 13.00", "Receipt\nCoffee\nTotal USD 12.00", "VISA\nTotal USD 12.00", "CARD PAYMENT\nTotal USD 12.00", "Receipt\nDate 2026-01-01\nTotal USD 12.00", "Cafe\nTotal USD 0"])("rejects ambiguous or missing fields: %s", text => expect(parseOcrSpaceText(text)).toBeNull());
});
describe("OCR.space transport", () => {
  it("sends the required multipart request", async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ OCRExitCode: 1, IsErroredOnProcessing: false, ParsedResults: [{ ParsedText: "Cafe\nTotal USD 12.00" }] })));
    vi.stubGlobal("fetch", mock);
    expect(await extractReceiptWithOcrSpace(new Uint8Array([1, 2]), "image/png", "secret")).toEqual({ merchant: "Cafe", total: "12.00", currency: "USD" });
    const [url, request] = mock.mock.calls[0];
    expect(url).toBe("https://api.ocr.space/parse/image"); expect(request.method).toBe("POST"); expect(request.headers).toEqual({ apikey: "secret" });
    expect(request.body.get("file")).toBeInstanceOf(Blob); expect(request.body.get("file").name).toBe("receipt.png"); expect(request.body.get("filetype")).toBe("PNG"); expect(request.body.get("isTable")).toBe("true"); expect(request.body.get("OCREngine")).toBe("3"); expect(request.signal).toBeInstanceOf(AbortSignal);
  });
  it("rejects oversized images before a request", async () => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    await expect(extractReceiptWithOcrSpace(new Uint8Array(1_000_001), "image/png", "key")).rejects.toMatchObject({ code: "image_too_large" }); expect(mock).not.toHaveBeenCalled();
  });
  it("does not send unsupported WebP images", async () => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    await expect(extractReceiptWithOcrSpace(new Uint8Array([1, 2]), "image/webp", "key")).rejects.toMatchObject({ code: "unsupported_image" });
    expect(mock).not.toHaveBeenCalled();
  });
  it.each([[new Response("secret", { status: 403 }), "upstream_http"], [new Response("invalid"), "response_json"], [new Response(JSON.stringify({ IsErroredOnProcessing: true, ErrorMessage: ["secret"] })), "upstream_processing"], [new Response(JSON.stringify({ ParsedResults: [] })), "response_invalid"]])("uses safe error category", async (response, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(extractReceiptWithOcrSpace(new Uint8Array([1]), "image/png", "secret")).rejects.toMatchObject({ code, message: "Receipt reading failed" });
  });
  it("categorizes network errors safely", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret")));
    await expect(extractReceiptWithOcrSpace(new Uint8Array([1]), "image/png", "secret")).rejects.toMatchObject({ code: "upstream_unavailable", message: "Receipt reading failed" });
  });
});
