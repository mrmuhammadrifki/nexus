import { describe, expect, it } from "vitest";
import { EXAMPLES, PLACEHOLDER, TEMPLATES, countPlaceholders, defaultExampleFor, isFilled, type SectionKey } from "../../src/lib/templates";
import { CANVAS_META } from "../../src/lib/catalog";

const KEYS = CANVAS_META.map((m) => m.key) as SectionKey[];

describe("template & contoh kanvas", () => {
  it("setiap bagian punya template; setiap template berisi placeholder & belum dianggap terisi", () => {
    for (const k of KEYS) {
      expect(TEMPLATES[k].length, k).toBeGreaterThanOrEqual(1);
      for (const t of TEMPLATES[k]) {
        expect(PLACEHOLDER.test(t.text), t.title).toBe(true);
        expect(isFilled(t.text), t.title).toBe(false);
        expect(t.text.length).toBeLessThan(4000);
      }
    }
  });
  it("ada 5 tema contoh dan masing-masing lengkap 6 bagian", () => {
    expect(EXAMPLES).toHaveLength(5);
    for (const e of EXAMPLES) for (const k of KEYS) expect(e.text[k]?.trim().length, `${e.theme}/${k}`).toBeGreaterThan(20);
  });
  it("tema contoh default mengikuti bidang pengguna", () => {
    expect(EXAMPLES[defaultExampleFor(["Lingkungan"])].project).toBe("SiPilah");
    expect(EXAMPLES[defaultExampleFor(["Pendidikan"])].field).toBe("Pendidikan");
    expect(EXAMPLES[defaultExampleFor(["Kesehatan"])].field).toBe("Kesehatan");
    expect(defaultExampleFor([])).toBe(0);
  });
});

describe("isFilled: bagian terisi = ada isi & tanpa placeholder", () => {
  it.each([
    ["", false], ["   \n ", false], [undefined, false], [null, false],
    ["Sampah menumpuk di kantin.", true],
    ["Masalah [isi data] di kantin", false],
    ["[Kelompok orang] di [lokasi]", false],
    ["Menurut studi [1] sampah naik", true], // sitasi angka bukan placeholder
    ["Lihat [12-14] untuk detail", true],
  ])("isFilled(%j) = %s", (t, expected) => expect(isFilled(t as any)).toBe(expected));
  it("menghitung jumlah placeholder", () => {
    expect(countPlaceholders("[a] dan [b] serta [c d]")).toBe(3);
    expect(countPlaceholders("tanpa placeholder [1]")).toBe(0);
    expect(countPlaceholders(undefined)).toBe(0);
  });
});
