# ato — Project Conventions

## What is this
ato は「感性のアーカイブ」アプリ。
15秒の声・1日1枚の写真・1行の言葉で、ユーザーの感性を蓄積する。
詳細は `docs/spec.md` を参照。

## Core Philosophy (絶対に譲らない)
1. **判断しない、ただ気づかせる** — AIは鏡であって友達ではない
2. **最小の入力で最大の蓄積** — 15秒の声、1行の言葉
3. **静かな美しさ** — 急がない、煽らない、評価しない
4. **時間が色になる** — 背景は空のように時間で変化する

このアプリで「励まします」「がんばろう」「達成」などの押し付けがましい言葉は絶対に出さない。

## Tech Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- LocalStorage (Phase 0、Supabase は Phase 1)
- Web Speech API (録音→文字起こし)

## Coding Rules

### File Structure
- `app/` — Next.js App Router のページ
- `components/` — 再利用可能なコンポーネント
- `lib/` — ユーティリティ関数(time-color, storage 等)
- `types/` — TypeScript 型定義
- `docs/` — spec.md, lessons.md などのドキュメント

### Code Style
- 関数コンポーネント、TypeScript必須
- ファイル名は kebab-case (例: time-color.ts)
- コンポーネント名は PascalCase (例: RecordButton)
- CSS変数を Tailwind config で定義し、ハードコードされた色を本文に書かない

### Git
- 1機能完成ごとに commit
- commit message は日本語OK、prefix は feat/fix/style/refactor

## Design System (絶対に守る)

### Colors (Tailwind config に必ず追加)
```js
colors: {
  ink: '#1a1d29',
  night: '#16161f',
  paper: '#ebe6db',
  'paper-warm': '#f0e6d2',
  candle: '#f4d4a3',
  'candle-deep': '#c9904e',
  rouge: '#d4a5a0',
  'rouge-deep': '#9b6b7a',
  indigo: '#5e4a6b',
  mist: '#c5bdb0',
  'mist-deep': '#7d8ca0',
}
```

### Fonts (Google Fonts から読み込み)
- 見出し: `Shippori Mincho` (weight 300-500のみ、太字禁止)
- 欧文: `Cormorant Garamond` italic 300中心
- 手書き: `Klee One` (要所のみ)

### NEVER do
- ❌ 影を強く使う(box-shadow は最小限、ring shadowで代替)
- ❌ 角丸を強く効かせる(rounded-lg まで)
- ❌ 鮮やかな色(青・赤・緑のビビッドな単色)
- ❌ Lucide や絵文字
- ❌ アニメーションが速い(0.5秒未満禁止)
- ❌ ボタンを「ボタンらしく」する(枠線とテキストだけで十分)

### Time-of-day Color (背景色マッピング)
時間帯ごとに背景がグラデーションで変化する。`lib/time-color.ts` で実装:

```typescript
const TIME_PALETTE = [
  { hour: 5, name: '未明', romaji: 'mimei', from: '#1f1f3a', to: '#3a3651', text: '#c5bdb0' },
  { hour: 6.5, name: '薄明', romaji: 'hakumei', from: '#5d4e6b', to: '#c4a4a3', text: '#2a2825' },
  { hour: 8, name: '朝', romaji: 'asa', from: '#e8d4c0', to: '#f0e6d2', text: '#2a2825' },
  { hour: 10, name: '昼', romaji: 'hiru', from: '#ebe6db', to: '#dde0e0', text: '#2a2825' },
  { hour: 14, name: '午後', romaji: 'gogo', from: '#dde0e0', to: '#d4c4a8', text: '#2a2825' },
  { hour: 16, name: '夕方', romaji: 'yuugata', from: '#d4a59a', to: '#c97e5e', text: '#2a2825' },
  { hour: 17.5, name: '黄昏', romaji: 'tasogare', from: '#9b6b7a', to: '#5e4a6b', text: '#f0e6d2' },
  { hour: 18.5, name: '宵', romaji: 'yoi', from: '#3a3651', to: '#252840', text: '#c5bdb0' },
  { hour: 20, name: '夜', romaji: 'yoru', from: '#1a1d29', to: '#1a1a26', text: '#c5bdb0' },
  { hour: 23, name: '深夜', romaji: 'shinya', from: '#0e1018', to: '#16161f', text: '#c5bdb0' },
]
```

現在時刻に応じた色を補間して返す関数を作る。1分ごとに更新。

## Tone of Voice (アプリ内の文言)

### Do
- 「触れて、15秒」(短く、間がある)
- 「今朝は、どんな空気でしたか」(問いかけ)
- 「— ato is not judging.」(囁くような一文)

### Don't
- 「録音する」(無機質)
- 「がんばってください」(励まし)
- 「○○しましょう!」(ビックリマーク禁止)
- 「達成」「目標」「習慣化」(タスク的な言葉禁止)

## When You (Claude Code) Make a Mistake
必ず `docs/lessons.md` に追記。同じミスを繰り返さないためのルールを書く。
ユーザーから「同じミスをした」と指摘されたら、まず lessons.md を読み返す。
