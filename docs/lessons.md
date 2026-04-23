# Lessons Learned

このファイルは、Claude Code が同じミスを繰り返さないための学習ログです。
**ユーザーから「またそのミス?」と指摘されないために、毎セッション最初に読む。**

---

## ato プロジェクト固有のルール

### 設計思想
- 「励ましメッセージ」「達成感の演出」を絶対に書かない。ato は「鏡」であって「コーチ」ではない。
- 機能を追加したくなったら spec.md を見直す。spec.md にないものは Phase 0 では作らない。
- 「絵文字を入れた方が可愛い」と思ったら、入れない。世界観が壊れる。
- Phase 0 の spec は「ブラウザ内蔵の Web Speech API」前提だったが、iOS Safari での破綻が判明し OpenAI Whisper API + MediaRecorder に舵を切った。**spec から外れる判断をする時は、ユーザーに理由を1行で合意してから行う**。

### 技術 — 録音・文字起こし
- iOS Safari の `webkitSpeechRecognition` は条件が揃っても `service-not-allowed` を返して動かないケースが多い。Apple 側(OS / サービス)の判定で、JS からは回避不能。**iOS を本番想定するなら最初から Whisper API 等のサーバ経由ルートを検討する**。
- MediaRecorder の対応 mimeType はブラウザ差が大きい。`MediaRecorder.isTypeSupported()` で優先順位付きに検査し、Safari なら `audio/mp4`、他なら `audio/webm;codecs=opus` を使う。
- Whisper 経由にする場合、音声は Next.js の API Route を中継させて `OPENAI_API_KEY` をサーバ側に保持する。キーをクライアントに出さない。

### 技術 — Next.js 16 特有
- **`allowedDevOrigins`**: dev server は外部ホスト(LAN IP、ngrok、cloudflared 等)からのアクセスで `/_next/webpack-hmr`・フォント等を CORS でブロックする。`next.config.ts` に `allowedDevOrigins: [...]` を設定しないと、HTML は表示されるが JS が hydrate しない(症状: 画面は出るが時間帯名やタップが反応しない)。
- **LAN 公開**: デフォルトは localhost のみ。別端末からアクセスさせるなら `npx next dev -H 0.0.0.0`。
- **iOS でマイクを使うには HTTPS 必須**: localhost 以外は ngrok / cloudflared で HTTPS トンネル。ngrok free はアカウント登録と authtoken が必要。cloudflared は無アカウントで `cloudflared tunnel --url http://localhost:3000` が楽。

### 技術 — React 19 / App Router
- `react-hooks/set-state-in-effect` ルールは `useEffect` 内の同期 `setState` を嫌う。LocalStorage のようなクライアント限定ストアを読む時は `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` パターンを使う。snapshot は参照安定性を保つこと(変更がない間は同じ配列参照を返す)。
- App Router の動的ルートでは、`page.tsx` の `params` は Promise。`const { id } = await params;` で剥がす。
- `page.tsx` は Server Component。クライアント API を使う部分は別の `"use client"` コンポーネントに切り出す。

### 技術 — フォント・CSS
- `next/font/google` の Shippori Mincho は weight 300 非対応。使えるのは 400/500/600/700/800。ato の「太字禁止」を守るなら 400/500。
- Tailwind v4 は `tailwind.config.ts` ではなく `app/globals.css` の `@theme {}` にトークンを書く。色は `--color-xxx: #...;` の形で、本文では `bg-xxx` / `text-xxx` で使う。
- 本文に hex 値を書かない。ato の色は必ず `@theme` に定義して Tailwind 経由で参照する。

### 技術 — LocalStorage
- 5MB 制限。写真は必ず縮小して Base64 化(`compressImage` 実装済み、maxDim 1200、quality 0.78)。
- 音声 Base64 は Safari mp4 で 15秒 ≈ 100KB。単純計算で 40〜50本 + 写真数枚で満杯。長期利用前提なら早めに **IndexedDB** 移行が必要。
- `.env.local` は `.gitignore` で除外済み(`.env*`)。API キーは絶対にコミットしない。

### 技術 — 環境
- macOS で `npm install` が `EACCES: permission denied` で落ちるのは大半が npm キャッシュの所有権崩壊。`sudo chown -R $(whoami) ~/.npm` で直る。
- zsh は対話モードで `#` 以降をコメント扱いしない(`interactive_comments` 未設定時)。ユーザーに複数行コマンドを渡す時は**コメントなしで** 1 行ずつ貼れる形で提示する。

### コミュニケーション
- ユーザーが詰まったら、まず原因を1行で言う。長い説明は不要。
- 「完了しました!」と派手に報告しない。「実装しました」で十分。
- トラブルシュート時は、まず**切り分け質問を3つ以内**にまとめる。「これとこれを試して、結果を教えて」と具体に書く。
- エラーコードを知りたい時は、コード側にエラー詳細を一時的に表示させて原因特定を速める(`setError(\`err: ${e.error}\`)` のような診断モード)。

---

## 過去のミスと対策

- **2026-04-23: iOS Safari で `webkitSpeechRecognition` に依存した設計を初期実装に入れた。`service-not-allowed` の解決に時間を溶かした(言語設定、Dictation、サイト許可、ngrok 切り分け 等)。結局 Apple 側で弾かれており JS では直せず、Whisper API に切り替えて解決。**
  → 対策: iOS を本番想定する Web 録音機能は、**最初から Web Speech API を当てにしない**。MediaRecorder + サーバ経由の speech-to-text を前提に組む。

- **2026-04-23: Next.js 16 の `allowedDevOrigins` を知らず、LAN / ngrok から開いたら JS が動かず「画面は出るがタップ反応なし」の状態に陥った。** dev server のログに警告は出ていたが、見落としていた。
  → 対策: 別端末から dev にアクセスさせる指示を出す時は、`next.config.ts` に `allowedDevOrigins: ['192.168.0.0/16','10.0.0.0/8','172.16.0.0/12','*.ngrok-free.dev','*.ngrok-free.app','*.trycloudflare.com']` を先に入れておく。dev server のログの `Blocked cross-origin request` 警告を見逃さない。

- **2026-04-23: `create-next-app` を既存ファイル(CLAUDE.md, README.md, docs/)のあるディレクトリで実行してブロックされた。**
  → 対策: 既存ファイルがあるディレクトリで初期化する時は、退避 → 初期化 → 戻す の順で行う。

- **2026-04-23: Shippori Mincho に weight 300 を指定してビルドが落ちた。**
  → 対策: `next/font/google` 採用時は `Available weights` を Google Fonts で必ず先に確認する。ato では 400/500 のみ。

- **2026-04-23: React 19 の `react-hooks/set-state-in-effect` lint を最初は放置しようとしたが、`useSyncExternalStore` に直す方が保守性が上だった。**
  → 対策: LocalStorage や非 React の外部ストアを読む時は `useSyncExternalStore` を第一選択に。

---

## 現状のメモ(Phase 0 完了時点)

Phase 0 MVP は以下の範囲で完成してプッシュ済み(branch: `claude/setup-ato-mvp-QsVUl`):

- 時間連動の背景(10時間帯を補間、1分更新)
- RecordButton(MediaRecorder → Whisper API → LocalStorage に transcript + audio Base64)
- PhotoUpload(縮小 → Base64)
- QuestionCard(21時以降、1日1問、スキップ可)
- RecordList(日付グループ、時刻・時間帯付き)
- 記録詳細ページ(音声プレイヤー / 写真 / 回答)
- PWA 最小対応(manifest + SVG icon + apple-web-app meta)

Phase 0 で入っていない・意識的に外したもの:
- Supabase、認証、Claude API、自分マップ、製本、通知、設定画面、ダークモード切替、Suno、家族遺産

次に来そうな課題:
1. **LocalStorage の容量**: 数日〜2週間で満杯の可能性。IndexedDB 移行が最優先の Phase 1 候補。
2. **複数端末での同期**: Supabase を入れる日が来たら認証も同時。
3. **Claude API による気づき生成**: データが貯まってから。急がない。

次セッションを開始する人へ: **まず Phase 0 を使ってもらって溜まった実感を聞く**。spec にない機能の提案から始めない。

---

## 思い出すべき言葉

> 完璧を目指して動かないより、動くものを出して恥をかく方がいい。

> spec.md にない機能を作ろうとしているなら、それは詰まる兆候。

> ユーザーは「複数PJの切り替えが苦手」「完璧主義になりがち」と自覚している。
> 寄り道を提案しないこと。

> 動かないバグを深追いする前に、「このブラウザでは無理」という可能性を疑う。
