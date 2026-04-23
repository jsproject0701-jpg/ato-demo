# ato MVP — Claude Code への指示書

このフォルダは、**ato アプリ Phase 0 (MVP)** を Claude Code で開発するための指示書一式です。

## ファイル構成

```
ato-mvp-instructions/
├── README.md           ← このファイル(最初に読む)
├── CLAUDE.md           ← プロジェクトルール(リポジトリ直下に置く)
├── spec.md             ← MVP仕様書(docs/に置く)
├── lessons.md          ← 学習ログ初期テンプレ(docs/に置く)
└── setup.md            ← 環境セットアップ手順(あなた用)
```

---

## 開発の進め方(必ずこの順番で)

### Step 1: 環境セットアップ
`setup.md` を見て、Node.js / Claude Max / リポジトリを準備する。

### Step 2: プロジェクト初期化
ターミナルで:

```bash
mkdir ato && cd ato
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

質問に答えるときは:
- ESLint: Yes
- App Router: Yes
- Turbopack: Yes
- import alias: Yes (@/*)

### Step 3: 指示書ファイルを配置

```bash
mkdir docs
# このフォルダの CLAUDE.md をリポジトリ直下にコピー
# spec.md, lessons.md を docs/ にコピー
```

### Step 4: Claude Code を起動

```bash
claude
```

### Step 5: 最初のプロンプト(コピペ用)

Claude Code に最初に投げる指示:

```
@CLAUDE.md と @docs/spec.md を読んでください。
ato アプリのMVP実装を開始します。

まず Plan モードで以下の3点を出してください:
1. ファイル構成(どのファイルをどの順序で作るか)
2. 実装順序(どの機能から作るか、依存関係を考慮)  
3. 1日で完成させるための優先順位の判断(削るべきもの)

実装はまだしないでください。
私が Plan を確認してOKを出してから着手してください。
```

### Step 6: Plan の確認・調整
Claude Code の Plan を読んで、違和感があれば指摘する。
このとき重要なのは「やらないこと」を明確にすること。

### Step 7: 実装スタート
Plan に合意したら:

```
Plan に同意します。実装をスタートしてください。
1機能ずつ実装し、各機能完成のタイミングで動作確認をしてもらいます。
```

---

## 開発中の運用ルール

### Claude Code が間違えたら必ず lessons.md に書かせる
```
今のミスを @docs/lessons.md に追記してください。同じミスを繰り返さないように、未来のあなたへのルールとして書いてください。
```

### セッションが長くなったらクリア
1機能完成したら `/clear` でセッションをクリアする(コンテキスト溢れ防止)。

### 動かなくなったら戻る
git commit を頻繁に。動いていた状態に戻れるようにする。

```bash
git add . && git commit -m "feat: 録音機能の実装"
```

---

## 1日のゴール

夜になる頃、以下が動いていればMVP成功:

- [ ] ブラウザで開くと、その時間帯の空の色が背景に出る
- [ ] 録音ボタンを押すと15秒録音できる
- [ ] 録音は自動で文字起こしされる(Web Speech API)
- [ ] 写真を1枚アップロードできる
- [ ] 1日1問が表示され、1行で答えられる
- [ ] その日の記録が画面下に並ぶ
- [ ] ブラウザを閉じても記録が消えない(LocalStorage)

これだけで、ato の核心体験は完成します。

---

## つまずいたら

### Claude Code が暴走したら
`Esc` で停止。`/compact` でコンテキスト整理。それでもダメなら `/clear` で仕切り直し。

### コードが意味不明になったら
git の動作していたコミットに戻る。プライドより前進を優先。

### 機能を追加したくなったら
**追加しない**。spec.md にない機能は Phase 1 に回す。
今日のゴールは「動くMVP」であって「完璧なアプリ」ではない。

### 私(Claude)に相談したくなったら
このチャットに戻ってきて、状況を共有してください。
スクリーンショットや、Claude Code の出力をそのまま貼ってOK。
