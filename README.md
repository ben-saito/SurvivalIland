# 🏝️ Survival Island Battle - サバイバル島バトル

[![GitHub Repository](https://img.shields.io/badge/GitHub-ben--saito%2FSurvivalIland-blue?style=flat&logo=github)](https://github.com/ben-saito/SurvivalIland)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7%2B-black?style=flat&logo=socket.io)](https://socket.io/)

10-30人の視聴者がモバイル端末で10秒ごとにリアルタイム投票を行い、縮小する島でかわいい動物キャラクターをコントロールするストリーミング向けバトルロワイヤルゲームです。

🎥 **Twitch、YouTube Live、Discordコミュニティでの配信に最適！**

## 🎮 ゲーム機能

- **リアルタイムマルチプレイ**: 1ゲーム最大30人
- **モバイルファースト投票**: スマートフォン最適化されたタッチインターフェース
- **配信者ダッシュボード**: 配信者向けの完全ゲーム管理機能
- **かわいい動物キャラ**: 10種類の個性豊かな動物キャラクター
- **島サバイバル**: 縮小する安全エリアとリソース管理
- **10秒投票ラウンド**: テンポの良い意思決定システム
- **無料枠最適化**: Netlify、Render.com、Supabaseの無料プランに対応

## 🏗️ アーキテクチャ

- **フロントエンド**: Netlifyでホストされる静的HTML/CSS/JS
- **バックエンド**: Render.com上のNode.js + Express + Socket.io
- **データベース**: Supabase（PostgreSQL）のリアルタイム機能
- **リアルタイム通信**: 自動再接続機能付きWebSocket接続

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm または yarn
- Git

### 1. プロジェクトのクローン

```bash
git clone https://github.com/ben-saito/SurvivalIland.git
cd SurvivalIland
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して、必要な設定を入力：

```env
# データベース設定（オプション - ローカル開発時は不要）
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# サーバー設定
PORT=3000
NODE_ENV=development

# ゲーム設定
MAX_PLAYERS=30
VOTING_DURATION=10000
ISLAND_SIZE=10
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

サーバーが http://localhost:3000 で起動します。

### 5. ゲームテスト

1. **配信者ダッシュボード**: http://localhost:3000/streamer.html
   - 配信者名を入力してルーム作成
   - QRコードとルームIDを確認

2. **モバイル投票画面**: http://localhost:3000/mobile.html
   - ルームIDを入力
   - プレイヤー名を入力して参加

3. **ゲーム開始**
   - 配信者ダッシュボードで「ゲーム開始」をクリック
   - モバイル画面で投票開始

## 🛠️ 本番デプロイ

### Netlify（フロントエンド）

1. Netlifyアカウントにログイン
2. GitHubリポジトリを接続
3. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `public`

### Render.com（バックエンド）

1. Render.comアカウントにログイン
2. GitHubリポジトリから新しいWeb Serviceを作成
3. 設定:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`

### Supabase（データベース）

1. Supabaseプロジェクトを作成
2. `database/setup.sql`のSQLを実行
3. 環境変数にSupabase URLとAPIキーを設定

## 🎯 ゲームプレイ

### 配信者向け

1. **ルーム作成**: 配信者ダッシュボードでルーム作成
2. **QRコード共有**: 視聴者にQRコードまたはルームIDを共有
3. **ゲーム管理**: 開始、一時停止、終了の制御
4. **プレイヤー監視**: リアルタイムプレイヤー状況確認

### 視聴者向け

1. **ルーム参加**: スマートフォンでルームIDを入力
2. **キャラ割当**: 自動で動物キャラクターが割り当て
3. **投票参加**: 10秒ごとの投票で移動・アクションを決定
4. **結果確認**: リアルタイムで投票結果と移動を確認

### アクション種類

- **移動**: ↑（北）、↓（南）、←（西）、→（東）
- **アクション**: 攻撃、収集、建設、休憩

## 📱 モバイル対応

- **44px以上のタッチターゲット**: iOS/Androidに最適化
- **レスポンシブデザイン**: 様々な画面サイズに対応
- **バッテリー最適化**: 効率的な通信で電池消耗を抑制
- **オフライン対応**: ネットワーク切断時の優雅な劣化

## ⚙️ 設定オプション

### ゲームバランス

`server/gameManager.js`で調整可能：

- `votingDuration`: 投票時間（デフォルト: 10秒）
- `maxPlayers`: 最大プレイヤー数（デフォルト: 30人）
- `islandSize`: 島の初期サイズ（デフォルト: 10x10）

### 動物キャラクター

新しいキャラクターを追加する場合：

```javascript
this.animalTypes = [
  'bear', 'fox', 'rabbit', 'deer', 'wolf', 
  'cat', 'dog', 'panda', 'lion', 'tiger'
  // 新しいキャラクターを追加
];
```

## 🎨 カスタマイズ

### UIテーマ

`/public/css/`のCSSファイルを編集してカスタムスタイリング

### イベントシステム

`server/eventSystem.js`でランダムイベントを追加・編集

### 物理エンジン

`server/physicsSystem.js`で衝突・押し合いシステムを調整

## 🐛 トラブルシューティング

### よくある問題

1. **Render.com サーバースリープ**
   - 無料プランでは15分後にスリープ
   - コールドスタート約30秒
   - 配信中はヘルスチェックで維持

2. **モバイル投票の問題**
   - 実機テストを推奨（ブラウザ開発者ツールでは不十分）
   - ネットワーク接続状況を確認
   - 44px以上のタッチターゲットを確保

3. **データベース接続制限**
   - Supabase無料プランには接続制限あり
   - 高トラフィック時はコネクションプーリングを実装
   - Supabaseダッシュボードで使用状況を監視

### デバッグモード

詳細ログを有効にするには：

```bash
NODE_ENV=development npm run dev
```

## 📊 パフォーマンス

### 想定負荷

- **50-100人同時視聴者**: 無料プラン対応
- **レスポンス時間**: 200-500ms目標
- **投票処理**: 10秒間隔で30人まで

### 最適化ポイント

- インメモリゲーム状態管理
- 効率的なSocket.io通信
- モバイルブラウザ最適化
- 無料プラン制限内のリソース使用

## 🎬 配信での活用

### プラットフォーム対応

- **Twitch**: チャットコマンド統合準備済み
- **YouTube Live**: Super Chat連携可能
- **Discord**: コミュニティイベント向け
- **その他**: カスタムサムネイル・ハイライト生成

### バイラル要素

- 予期しない物理現象
- コミカルなキャラクター反応  
- ハイライト自動記録
- ソーシャルメディア共有機能

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更を実装
4. モバイルデバイスで徹底テスト
5. プルリクエストを提出

## 📜 ライセンス

MIT License - 詳細はLICENSEファイルを参照

## 🎬 配信に最適

このゲームは以下の用途に特化して設計されています：

- **Twitchストリーマー** - 高いインタラクティブ性とエンターテイメント性
- **YouTube Live** - モバイルフレンドリーな視聴者参加
- **Discordコミュニティ** - コミュニティイベント用の簡単セットアップ
- **コンテンツクリエイター** - バイラルモーメントとハイライトクリップ

島で混沌を作り出す準備はできましたか？バトル開始！ 🏝️⚔️

## 🔗 リンク

- **GitHubリポジトリ**: [github.com/ben-saito/SurvivalIland](https://github.com/ben-saito/SurvivalIland)
- **Issue・機能リクエスト**: [GitHub Issues](https://github.com/ben-saito/SurvivalIland/issues)
- **リリース**: [GitHub Releases](https://github.com/ben-saito/SurvivalIland/releases)

---

*❤️ [Claude Code](https://claude.ai/code) - AI搭載開発アシスタントによって作成*