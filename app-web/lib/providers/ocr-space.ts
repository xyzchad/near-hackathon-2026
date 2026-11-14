import { receiptSuggestion, ReceiptExtractionError } from "./receipt";

const currencyPattern = /\b(AED|USD|EUR|GBP|NGN|CNY|KRW|JPY)\b|[€£₦₩]/gi;
const symbols: Record<string, string> = { "€": "EUR", "£": "GBP", "₦": "NGN", "₩": "KRW" };

// Return only fields supported by clear OCR text; never infer an absent total or currency.
export function parseOcrSpaceText(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim())
    .filter(line => line && !/^\[Note:.*demo key/i.test(line))
    .map(line => line.replace(/^#{1,6}\s*/, ""));
  // Only the first substantive text line can supply the merchant. Scanning
  // past a receipt header could turn an item or payment method into a name.
  const firstTextLine = lines.findIndex(line => /[a-z]{3}/i.test(line));
  const first = lines[firstTextLine];
  const next = lines[firstTextLine + 1];
  const merchant = first && /^(restaurant|cafe|bar|bistro|diner)$/i.test(next) && !first.toLowerCase().includes(next.toLowerCase())
    ? `${first} ${next}` : first;
  if (!merchant || merchant.length > 80 || !/[a-z]/i.test(merchant) ||
    /\b(receipt|invoice|date|time|tel|phone|address|thank|welcome|subtotal|total|tax|cash|change|synthetic|sample|demo|payment|visa|mastercard|www)\b/i.test(merchant) ||
    /\d{2,}/.test(merchant) || /\b(AED|USD|EUR|GBP|NGN|CNY|KRW|JPY)\b|[$€£₦₩¥￥]/i.test(merchant)) return null;
  const totalLines = lines.filter(line => /^(?:grand\s+)?total\b/i.test(line));
  if (totalLines.length !== 1) return null;
  const amounts = [...totalLines[0].matchAll(/(?<![\d.,])(?:\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{1,8}(?:\.\d{1,2})?)(?![\d.,])/g)];
  if (amounts.length !== 1) return null;
  const found = new Set([...text.matchAll(currencyPattern)].map(match => symbols[match[0]] ?? match[0].toUpperCase()));
  let currency = found.size === 1 ? [...found][0] : undefined;
  if ((text.includes("$") && currency !== "USD") || (/[¥￥]/.test(text) && currency !== "JPY" && currency !== "CNY")) currency = undefined;
  const result = receiptSuggestion.safeParse({ merchant, total: amounts[0][0].replaceAll(",", ""), ...(currency ? { currency } : {}) });
  return result.success ? result.data : null;
}

// Server-side only: the caller must keep the key private.
export async function extractReceiptWithOcrSpace(bytes: Uint8Array, mime: string, key: string) {
  if (!key) throw new ReceiptExtractionError("not_configured");
  if (bytes.byteLength > 1_000_000) throw new ReceiptExtractionError("image_too_large");
  if (mime !== "image/png" && mime !== "image/jpeg") throw new ReceiptExtractionError("unsupported_image");
  const filetype = mime === "image/png" ? "PNG" : "JPG";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), `receipt.${filetype.toLowerCase()}`);
  form.append("filetype", filetype);
  form.append("isTable", "true");
  form.append("OCREngine", "3");
  let response: Response;
  try {
    response = await fetch("https://api.ocr.space/parse/image", { method: "POST", headers: { apikey: key }, body: form, signal: AbortSignal.timeout(20_000) });
  } catch { throw new ReceiptExtractionError("upstream_unavailable"); }
  if (!response.ok) throw new ReceiptExtractionError("upstream_http");
  let data: unknown;
  try { data = await response.json(); } catch { throw new ReceiptExtractionError("response_json"); }
  if (!data || typeof data !== "object") throw new ReceiptExtractionError("response_invalid");
  const payload = data as { IsErroredOnProcessing?: unknown; OCRExitCode?: unknown; ParsedResults?: unknown };
  if (payload.IsErroredOnProcessing === true || (typeof payload.OCRExitCode === "number" && payload.OCRExitCode !== 1)) throw new ReceiptExtractionError("upstream_processing");
  if (!Array.isArray(payload.ParsedResults) || payload.ParsedResults.length !== 1 || typeof payload.ParsedResults[0]?.ParsedText !== "string") throw new ReceiptExtractionError("response_invalid");
  return parseOcrSpaceText(payload.ParsedResults[0].ParsedText);
}
