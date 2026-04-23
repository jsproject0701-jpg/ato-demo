# 環境セットアップ手順 (saya 用)

ato MVP を開発するための環境構築手順。
**所要時間: 30分〜1時間**(初めてなら)

---

## Step 1: Claude Max を契約 (まだなら)

https://claude.ai/upgrade

- **Pro ($20/月) ではなく Max ($200/月) を強く推奨**
- 理由: Claude Code でアプリ開発するとProでは即座に上限に達する
- Mシリーズ収入があるうちに先行投資する価値あり

---

## Step 2: Node.js のインストール

ターミナル(Mac の場合)で確認:

```bash
node --version
```

`v20.x.x` 以上が出ればOK。
出ない or 古い場合:

### Mac の場合
```bash
# Homebrew が入っていない場合は先に
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js インストール
brew install node
```

確認:
```bash
node --version  # v20以上
npm --version   # 10以上
```

---

## Step 3: Claude Code のインストール

```bash
npm install -g @anthropic-ai/claude-code
```

確認:
```bash
claude --version
```

最初の起動で Claude Max のログインを求められる。ブラウザでログイン。

---

## Step 4: Git の確認 (Mac は標準で入っているはず)

```bash
git --version
```

入っていなければ Xcode Command Line Tools をインストール:
```bash
xcode-select --install
```

---

## Step 5: GitHub アカウント (Phase 0 では任意だが推奨)

https://github.com/ で無料アカウント作成。

リポジトリは Phase 1 まで作らなくてOK。
Phase 0 はローカルだけで開発できる。

---

## Step 6: コードエディタ (任意)

Claude Code はターミナルで動くが、コードを目視確認するためにエディタがあると便利。

**推奨: Cursor** (https://cursor.sh/)
- 無料プランあり
- AI機能つきだが、メイン作業は Claude Code でやる
- コード閲覧と微修正に使う

VSCode でもOK。

---

## Step 7: プロジェクト作成

```bash
# 任意の場所に作業フォルダを作る
mkdir ~/projects
cd ~/projects

# Next.js プロジェクト作成
npx create-next-app@latest ato --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

質問への回答:
- ESLint? → **Yes**
- Turbopack? → **Yes**

完了したら:

```bash
cd ato
ls
```

`app/`, `package.json` などが見えればOK。

---

## Step 8: 指示書ファイルの配置

このフォルダ(`ato-mvp-instructions/`)から、以下をコピー:

```bash
# CLAUDE.md は ato/ の直下に置く
cp ~/Downloads/ato-mvp-instructions/CLAUDE.md ./CLAUDE.md

# docs/ フォルダを作って spec.md と lessons.md を置く
mkdir docs
cp ~/Downloads/ato-mvp-instructions/spec.md ./docs/
cp ~/Downloads/ato-mvp-instructions/lessons.md ./docs/
```

確認:
```bash
ls
# 出力に CLAUDE.md, docs/ がある

ls docs/
# spec.md, lessons.md が見える
```

---

## Step 9: Git 初期化

```bash
git init
git add .
git commit -m "init: ato MVP プロジェクト開始"
```

---

## Step 10: Claude Code を起動

```bash
claude
```

起動したら、`README.md` の Step 5 のプロンプトをコピペ。

---

## トラブルシューティング

### `npx create-next-app` が遅い・止まる
ネットワークが遅い時間帯を避ける。深夜や早朝は試さない。

### `claude` コマンドが見つからない
パスが通っていない可能性。一度ターミナルを再起動するか:
```bash
which claude
# 何も出なければ再インストール
npm install -g @anthropic-ai/claude-code
```

### Permission denied エラー
```bash
sudo npm install -g @anthropic-ai/claude-code
```
パスワード入力。

### Mac で 「開発元を確認できない」エラー
システム設定 → プライバシーとセキュリティ → 「このまま開く」をクリック。

---

## 開発中によく使うコマンド

### 開発サーバー起動
```bash
npm run dev
```
ブラウザで http://localhost:3000 を開く。

### iPhone で確認(同じ Wi-Fi 内)
```bash
# Mac の IP を確認
ifconfig | grep "inet " | grep -v 127.0.0.1
# 例: 192.168.1.10

# iPhone Safari で http://192.168.1.10:3000 を開く
```

### コミット
```bash
git add .
git commit -m "feat: 録音機能を実装"
```

### Claude Code セッションをクリア
Claude Code 内で:
```
/clear
```

---

## 準備完了チェック

以下が全部 OK なら、開発スタートできる:

- [ ] `node --version` が v20 以上
- [ ] `claude --version` で Claude Code が起動できる
- [ ] `~/projects/ato/` に Next.js プロジェクトがある
- [ ] `ato/CLAUDE.md` が配置済み
- [ ] `ato/docs/spec.md`, `ato/docs/lessons.md` が配置済み
- [ ] `npm run dev` でブラウザに何か表示される
- [ ] git の初期コミットが完了している

すべて OK なら、`README.md` の Step 5 へ進む。
