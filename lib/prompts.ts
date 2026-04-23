const PROMPTS: Record<string, string> = {
  mimei: "夜の終わりに、何を聴いていますか",
  hakumei: "薄明かりのなか、最初に浮かぶ言葉は",
  asa: "今朝は、どんな空気でしたか",
  hiru: "今、目の前にある光を一言で",
  gogo: "午後の手のひらに、何が残っていますか",
  yuugata: "夕方の空気は、どんな匂いですか",
  tasogare: "黄昏に、何を見送りますか",
  yoi: "宵の口、心の温度を",
  yoru: "今日のことを、すこしだけ",
  shinya: "夜のなかで、まだ起きている言葉は",
};

export const promptFor = (romaji: string): string =>
  PROMPTS[romaji] ?? "今、心に触れているものを";
