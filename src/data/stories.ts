export interface Frame {
  n: string;
  lbl: string;
  angle: number;
  tone: "dark" | "mid" | "light";
  star?: boolean;
  src?: string;
}

export interface Story {
  id: string;
  slug: string;
  cat: string;
  title: string;
  loc: string;
  year: number;
  cover: { angle: number; tone: string; src?: string };
  blurb: string;
  frames: Frame[];
}

export const STORIES: Story[] = [
  {
    id: "LMP",
    slug: "lampedusa",
    cat: "REPORTAGE",
    title: "Il molo prima dell'alba",
    loc: "Lampedusa, IT",
    year: 2024,
    cover: { angle: 15, tone: "dark", src: "/photos/lampedusa_molo_dawn_1776460589179.png" },
    blurb: "Tre settimane al porto vecchio, dove le pescherecce rientrano mentre arrivano i primi sbarchi. Quello che resta sul molo quando la luce si alza.",
    frames: [
      { n: "01A", lbl: "molo — corde bagnate", angle: 15, tone: "dark", star: true, src: "/photos/lampedusa_molo_dawn_1776460589179.png" },
      { n: "02A", lbl: "silhouette — tre uomini", angle: 45, tone: "dark", src: "/photos/lampedusa_molo_dawn_1776460589179.png" },
      { n: "03A", lbl: "mani — rete di nylon", angle: 70, tone: "mid", src: "/photos/lampedusa_molo_dawn_1776460589179.png" },
      { n: "04A", lbl: "barca — poppa illuminata", angle: 30, tone: "dark", star: true, src: "/photos/lampedusa_molo_dawn_1776460589179.png" },
    ],
  },
  {
    id: "PLR",
    slug: "palermo",
    cat: "RITRATTO",
    title: "Le Nonne della Vucciria",
    loc: "Palermo, IT",
    year: 2025,
    cover: { angle: 60, tone: "dark", src: "/photos/palermo_nonna_window_1776460630947.png" },
    blurb: "Dodici ritratti di donne che abitano sopra il mercato da sempre. Ciascuna ha scelto il proprio angolo di casa.",
    frames: [
      { n: "01P", lbl: "Ignazia, 94 — finestra", angle: 60, tone: "dark", star: true, src: "/photos/palermo_nonna_window_1776460630947.png" },
      { n: "02P", lbl: "Rosa, 81 — tenda di cotone", angle: 15, tone: "dark", src: "/photos/palermo_nonna_window_1776460630947.png" },
      { n: "03P", lbl: "mani — anelli", angle: 100, tone: "mid", src: "/photos/palermo_nonna_window_1776460630947.png" },
    ],
  },
  {
    id: "HYO",
    slug: "huancayo",
    cat: "VIAGGIO",
    title: "Mercato domenicale",
    loc: "Huancayo, PE",
    year: 2022,
    cover: { angle: 30, tone: "dark", src: "/photos/huancayo_mercato_peru_1776460650270.png" },
    blurb: "Il mercato di Huancayo si estende per un chilometro. Cinque albe di seguito fra banchi di carne, tessuti e frutta d'altopiano.",
    frames: [
      { n: "01H", lbl: "venditore — cappello nero", angle: 30, tone: "dark", star: true, src: "/photos/huancayo_mercato_peru_1776460650270.png" },
      { n: "02H", lbl: "fumo — griglia", angle: 75, tone: "mid", src: "/photos/huancayo_mercato_peru_1776460650270.png" },
    ],
  },
];

// Combine all frames into a 24-slot contact sheet
export const SHEET = (() => {
  const out: (Frame & { storyId: string; storyCat: string; storySlug: string })[] = [];
  STORIES.forEach((s) => {
    s.frames.forEach((f) => {
      out.push({ ...f, storyId: s.id, storyCat: s.cat, storySlug: s.slug });
    });
  });
  
  // Pad to 24
  let i = 0;
  while (out.length < 24) {
    const original = out[i % out.length];
    out.push({ ...original, n: `—` });
    i++;
  }
  return out.slice(0, 24);
})();
