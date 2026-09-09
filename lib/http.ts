export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const expected = process.env.APP_ORIGIN || (process.env.RENDER_EXTERNAL_URL ?? new URL(request.url).origin);
  try { return new URL(origin).origin === new URL(expected).origin; } catch { return false; }
}
export async function boundedJson(request: Request, maximum = 400_000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request.');
  let length = 0;
  const decoder = new TextDecoder();
  let raw = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximum) { await reader.cancel(); throw new Error('Request too large.'); }
    raw += decoder.decode(value, { stream: true });
  }
  return JSON.parse(raw + decoder.decode());
}
