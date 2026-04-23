export type PaletteEntry = {
  hour: number;
  name: string;
  romaji: string;
  from: string;
  to: string;
  text: string;
};

export const TIME_PALETTE: PaletteEntry[] = [
  { hour: 5, name: "未明", romaji: "mimei", from: "#1f1f3a", to: "#3a3651", text: "#c5bdb0" },
  { hour: 6.5, name: "薄明", romaji: "hakumei", from: "#5d4e6b", to: "#c4a4a3", text: "#2a2825" },
  { hour: 8, name: "朝", romaji: "asa", from: "#e8d4c0", to: "#f0e6d2", text: "#2a2825" },
  { hour: 10, name: "昼", romaji: "hiru", from: "#ebe6db", to: "#dde0e0", text: "#2a2825" },
  { hour: 14, name: "午後", romaji: "gogo", from: "#dde0e0", to: "#d4c4a8", text: "#2a2825" },
  { hour: 16, name: "夕方", romaji: "yuugata", from: "#d4a59a", to: "#c97e5e", text: "#2a2825" },
  { hour: 17.5, name: "黄昏", romaji: "tasogare", from: "#9b6b7a", to: "#5e4a6b", text: "#f0e6d2" },
  { hour: 18.5, name: "宵", romaji: "yoi", from: "#3a3651", to: "#252840", text: "#c5bdb0" },
  { hour: 20, name: "夜", romaji: "yoru", from: "#1a1d29", to: "#1a1a26", text: "#c5bdb0" },
  { hour: 23, name: "深夜", romaji: "shinya", from: "#0e1018", to: "#16161f", text: "#c5bdb0" },
];

export type TimeColor = {
  from: string;
  to: string;
  text: string;
  name: string;
  romaji: string;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColor = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
};

const hourFromDate = (d: Date) => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

export const getTimeColor = (date: Date = new Date()): TimeColor => {
  const h = hourFromDate(date);
  const palette = TIME_PALETTE;
  const n = palette.length;

  let prevIdx = -1;
  for (let i = 0; i < n; i++) {
    if (palette[i].hour <= h) prevIdx = i;
  }

  let prev: PaletteEntry;
  let next: PaletteEntry;
  let prevHour: number;
  let nextHour: number;

  if (prevIdx === -1) {
    prev = palette[n - 1];
    next = palette[0];
    prevHour = prev.hour - 24;
    nextHour = next.hour;
  } else if (prevIdx === n - 1) {
    prev = palette[n - 1];
    next = palette[0];
    prevHour = prev.hour;
    nextHour = next.hour + 24;
  } else {
    prev = palette[prevIdx];
    next = palette[prevIdx + 1];
    prevHour = prev.hour;
    nextHour = next.hour;
  }

  const span = nextHour - prevHour;
  const t = span === 0 ? 0 : (h - prevHour) / span;

  return {
    from: lerpColor(prev.from, next.from, t),
    to: lerpColor(prev.to, next.to, t),
    text: lerpColor(prev.text, next.text, t),
    name: prev.name,
    romaji: prev.romaji,
  };
};
