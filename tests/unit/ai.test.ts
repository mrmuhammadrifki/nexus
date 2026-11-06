import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aiFailureMessage, getAssessment, getFeedback, modelName, provider } from "../../src/lib/ai";

const KEY = "test-gemini-key-not-real";
const canvas = { problem: "Sampah kantin tercampur 300 kg per hari.", rootCause: "Tidak tahu tempat sampah.", solution: "Aplikasi pemindai sampah.", technology: "PWA dan kamera.", features: "1) Pindai 2) Poin", impact: "Terpilah naik dari 20% ke 60%." };
const geminiOk = (obj: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] }, finishReason: "STOP" }] }), { status: 200 });
const fbJson = { good: "Sudah jelas.", improve: "Tambah data.", rewrite: "Versi baru.", ideas: [] };
const asJson = (n = 5) => ({ indicators: ["problem_clarity", "solution_relevance", "user_need", "collaboration", "sustainability"].slice(0, n).map((key, i) => ({ key, value: 60 + i * 5, why: "alasan", tip: "saran" })) });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", KEY); vi.stubEnv("ANTHROPIC_API_KEY", ""); vi.stubEnv("AI_PROVIDER", ""); vi.stubEnv("GEMINI_MODEL", ""); vi.stubEnv("AI_RETRY_DELAY_MS", "1");
  fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("pemilihan penyedia AI", () => {
  it("GEMINI_API_KEY → gemini; hanya ANTHROPIC → anthropic; tanpa key → heuristik", () => {
    expect(provider()).toBe("gemini"); expect(modelName()).toBe("gemini-3.5-flash@p1");
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("ANTHROPIC_API_KEY", "x"); expect(provider()).toBe("anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", ""); expect(provider()).toBe("heuristic"); expect(modelName()).toBe("heuristic-v1");
  });
  it("AI_PROVIDER memaksa pilihan; GEMINI_MODEL mengganti model", () => {
    vi.stubEnv("AI_PROVIDER", "heuristic"); expect(provider()).toBe("heuristic");
    vi.stubEnv("AI_PROVIDER", "gemini"); vi.stubEnv("GEMINI_MODEL", "gemini-2.5-pro"); expect(modelName()).toBe("gemini-2.5-pro@p1");
    vi.stubEnv("AI_PROVIDER", "anthropic"); expect(provider()).toBe("heuristic"); // dipaksa anthropic tetapi tanpa ANTHROPIC_API_KEY → heuristik
  });
});

describe("panggilan Gemini", () => {
  it("memakai endpoint model, key hanya di header (tidak di URL), JSON mode, dan instruksi sistem", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk(fbJson));
    await getFeedback(0, canvas);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent");
    expect(String(url)).not.toContain(KEY);
    expect(init.headers["x-goog-api-key"]).toBe(KEY);
    const body = JSON.parse(init.body);
    expect(body.generationConfig).toMatchObject({ responseMimeType: "application/json", temperature: 0.2 });
    expect(body.systemInstruction.parts[0].text).toMatch(/jangan mengarang|DATA dari pengguna/i); // aturan anti-halusinasi & anti-injeksi
    expect(JSON.stringify(body)).not.toContain(KEY);
  });
  it("hanya isi kanvas yang dikirim (tanpa nama/email/kampus)", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk(fbJson));
    await getFeedback(0, canvas);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text as string;
    expect(sent).toContain("Sampah kantin tercampur");
    expect(sent).not.toMatch(/@|email|kampus:/i);
  });
  it("hanya bagian sampai yang diminta yang dirujuk (bagian sesudahnya tidak dikirim)", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk(fbJson));
    await getFeedback(1, canvas); // Akar Masalah
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text as string;
    expect(sent).toContain("Tidak tahu tempat sampah"); expect(sent).not.toContain("Terpilah naik");
  });
  it("hasil divalidasi Zod dan dikembalikan", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk(fbJson));
    expect(await getFeedback(0, canvas)).toEqual({ good: "Sudah jelas.", improve: "Tambah data.", rewrite: "Versi baru.", ideas: [], model: "gemini-3.5-flash@p1" });
  });
  it("JSON dibungkus teks/markdown tetap terbaca", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "```json\n" + JSON.stringify(fbJson) + "\n```" }] } }] }), { status: 200 }));
    expect((await getFeedback(0, canvas)).improve).toBe("Tambah data.");
  });
  it("keluaran tidak valid → coba ulang sekali (tanpa thinkingConfig) lalu berhasil", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk({ improve: 123 })).mockResolvedValueOnce(geminiOk(fbJson));
    expect((await getFeedback(0, canvas)).improve).toBe("Tambah data.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).generationConfig.thinkingConfig).toBeUndefined();
  });
  it("gagal dua kali → melempar (route menjawab 'AI lagi sibuk')", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    await expect(getFeedback(0, canvas)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("429 (batas laju): menunggu jeda lalu mencoba sekali lagi dan berhasil", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash"); vi.stubEnv("AI_RETRY_DELAY_MS", "60");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 })).mockResolvedValueOnce(geminiOk(fbJson));
    const t = Date.now(); await getFeedback(0, canvas);
    expect(Date.now() - t).toBeGreaterThanOrEqual(55); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("respons diblokir/kosong → gagal", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 }));
    await expect(getFeedback(0, canvas)).rejects.toThrow();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ candidates: [{ finishReason: "MAX_TOKENS" }] }), { status: 200 }));
    await expect(getFeedback(0, canvas)).rejects.toThrow();
  });
  it("dibatalkan pengguna (AbortSignal) → tidak mencoba ulang", async () => {
    const ac = new AbortController(); fetchMock.mockImplementation(async () => { ac.abort(); throw new DOMException("aborted", "AbortError"); });
    await expect(getFeedback(0, canvas, ac.signal)).rejects.toThrow(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("aturan yang ditegakkan di kode, bukan diserahkan ke LLM", () => {
  it("bagian yang masih berisi [placeholder] dijawab tanpa memanggil Gemini", async () => {
    const r = await getFeedback(2, { ...canvas, solution: "[Nama solusi] adalah [jenis] untuk [siapa]." });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.improve).toMatch(/belum kamu isi/); expect(r.rewrite).toBe("");
  });
});

describe("rantai model cadangan (GEMINI_MODEL=a,b)", () => {
  const modelOf = (call: number) => String(fetchMock.mock.calls[call][0]).match(/models\/([^:]+):/)![1];
  it("model pertama 503 → percobaan kedua langsung pindah ke model cadangan dan dicatat sebagai model pemberi jawaban", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash, gemini-2.5-flash"); vi.stubEnv("AI_RETRY_DELAY_MS", "5000");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 503 })).mockResolvedValueOnce(geminiOk(fbJson));
    const t = Date.now(); const r = await getFeedback(0, canvas);
    expect(Date.now() - t).toBeLessThan(1500); // tanpa jeda 5 dtk karena modelnya berbeda
    expect([modelOf(0), modelOf(1)]).toEqual(["gemini-3.5-flash", "gemini-2.5-flash"]);
    expect(r.model).toBe("gemini-2.5-flash@p1");
    expect(modelName()).toBe("gemini-3.5-flash@p1"); // nama utama tetap model pertama (dipakai untuk kunci cache)
  });
  it("429 kuota habis di model pertama → cadangan menjawab", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash,gemini-2.5-flash");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 })).mockResolvedValueOnce(geminiOk(asJson()));
    expect((await getAssessment(canvas, [])).model).toBe("gemini-2.5-flash@p1");
  });
  it("model pertama sukses → cadangan tidak dipanggil", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash,gemini-2.5-flash");
    fetchMock.mockResolvedValueOnce(geminiOk(fbJson));
    await getFeedback(0, canvas); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("kedua model gagal → melempar", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash,gemini-2.5-flash");
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
    await expect(getFeedback(0, canvas)).rejects.toThrow(); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("hanya satu model → mencoba model yang sama setelah jeda", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash"); vi.stubEnv("AI_RETRY_DELAY_MS", "50");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 503 })).mockResolvedValueOnce(geminiOk(fbJson));
    const t = Date.now(); await getFeedback(0, canvas);
    expect(Date.now() - t).toBeGreaterThanOrEqual(45); expect([modelOf(0), modelOf(1)]).toEqual(["gemini-3.5-flash", "gemini-3.5-flash"]);
  });
});

describe("bagian kosong", () => {
  it("good & rewrite dikosongkan walau LLM menulisnya; ide dibatasi 4", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk({ good: "Bagus sekali!", improve: "Ini ide:", rewrite: "tulis ulang", ideas: ["a", "b", "c", "d"] }));
    const r = await getFeedback(3, { ...canvas, technology: "" });
    expect(r).toEqual({ good: "", improve: "Ini ide:", rewrite: "", ideas: ["a", "b", "c", "d"], model: "gemini-3.5-flash@p1" });
  });
});

describe("penilaian IMPACT lewat Gemini", () => {
  it("memetakan 5 indikator berurutan sesuai kunci, nilai dibatasi 0–100", async () => {
    const j = asJson(); j.indicators[0].value = 140; j.indicators[1].value = -5;
    fetchMock.mockResolvedValueOnce(geminiOk({ indicators: [...j.indicators].reverse() })); // urutan acak dari LLM
    const { indicators: r, model } = await getAssessment(canvas, ["Data", "UI/UX"]);
    expect(model).toBe("gemini-3.5-flash@p1");
    expect(r.map((x) => x.key)).toEqual(["problem_clarity", "solution_relevance", "user_need", "collaboration", "sustainability"]);
    expect(r[0].value).toBe(100); expect(r[1].value).toBe(0);
  });
  it("indikator kurang dari 5 → ditolak (setelah coba ulang)", async () => {
    fetchMock.mockResolvedValue(geminiOk(asJson(4)));
    await expect(getAssessment(canvas, [])).rejects.toThrow();
  });
  it("hanya peran anggota + kanvas yang dikirim", async () => {
    fetchMock.mockResolvedValueOnce(geminiOk(asJson()));
    await getAssessment(canvas, ["Data Analyst"]);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text as string;
    expect(sent).toContain("Peran anggota tim: Data Analyst"); expect(sent).toContain("problem_clarity");
  });
});

describe("pesan kegagalan untuk pengguna", () => {
  it("429 → pesan kuota; lainnya → 'AI lagi sibuk'", () => {
    expect(aiFailureMessage(Object.assign(new Error("x"), { status: 429 }))).toMatch(/Kuota AI/);
    expect(aiFailureMessage(Object.assign(new Error("x"), { status: 503 }))).toBe("AI lagi sibuk, coba lagi");
    expect(aiFailureMessage(new Error("timeout"))).toBe("AI lagi sibuk, coba lagi");
  });
});
