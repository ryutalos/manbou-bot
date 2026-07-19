# ミチノリ

旅の計画を、時間からデザインする。— 出発時刻・滞在・移動を積み上げて旅程の時刻を自動計算する、モバイル向けの旅のしおりアプリ。

React + TypeScript + Vite の PWA。データは端末内(IndexedDB)に保存し、サーバーは持たない。

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm run build      # 本番ビルド (dist/)
npm run preview    # ビルド結果をローカル確認
npm run typecheck  # 型チェックのみ
```

## 構成

- `src/App.tsx` — アプリ本体(ホーム/編集/当日の3画面)
- `src/lib/storage.ts` — IndexedDB による永続化(`window.storage` として注入)
- `src/main.tsx` — エントリ。storage を注入してマウント
- `src/assets/` — ロゴ(マーク / ロゴタイプ)
- `public/` — PWA アイコン・favicon・manifest 用アセット
- `vite.config.ts` — Vite + PWA(`vite-plugin-pwa`)設定

## データの保存とバックアップ

旅程は端末内の IndexedDB に保存される。アプリ内の「書き出し / 読み込み」で
全旅程を JSON テキストとして退避・復元できる(端末の乗り換え・バックアップ用)。

## 機能

- 複数旅程の作成 / 複製 / 削除
- スポットの追加・並び替え(長押しドラッグ)・メモ・写真(端末内で圧縮保存)
- 出発時刻＋滞在＋移動から到着時刻を自動カスケード計算、到着時刻の固定も可能
- 経由(滞在なし)スポット、Google マップ経路リンク
- 編集モード(作る)/ 当日モード(現在時刻ライン付きで見る)の切り替え
- PWA: ホーム画面に追加してオフライン起動

## 今後の課題(MVP からの発展)

- `App.tsx` はモックからの移植で型注釈が薄いため、段階的に TypeScript を厳格化する
  (`tsconfig.app.json` の `strict` を有効化)
- 移動時間の自動取得(経路 API 連携)はサーバーが必要なため未対応
