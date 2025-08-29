# Requirements Document

## Introduction

「サバイバル島バトル」は、配信者向けのブラウザベースのインタラクティブバトルロワイヤルゲームです。Fall Guys のバイラル性、Jackbox Games のアクセシビリティ、Twitch Plays の参加型要素を組み合わせ、10-30 人の視聴者がかわいい動物キャラクターを操作して縮小する島でサバイバルバトルを行います。視聴者は 10 秒ごとに移動とアクションを投票で決定し、配信者はナレーターとして機能します。

## Requirements

### Requirement 1

**User Story:** 配信者として、視聴者が簡単に参加できるゲームセッションを作成したいので、QR コードまたはリンクを共有するだけでゲームを開始できるようにしたい

#### Acceptance Criteria

1. WHEN 配信者がゲームセッションを作成する THEN システムは一意のルーム ID と QR コードを生成する SHALL
2. WHEN QR コードが生成される THEN 配信者の画面に表示され、視聴者がスキャンできる SHALL
3. WHEN 視聴者が QR コードをスキャンまたはリンクをクリックする THEN 自動的にゲームルームに参加し、動物キャラクターが割り当てられる SHALL
4. IF ゲームセッションが満員（30 人）の場合 THEN 新しい参加者は観戦者として参加できる SHALL

### Requirement 2

**User Story:** 視聴者として、スマートフォンから簡単に投票に参加したいので、シンプルなタッチインターフェースで移動やアクションを選択できるようにしたい

#### Acceptance Criteria

1. WHEN 投票期間が開始される THEN 視聴者のモバイル画面に 4 つの移動方向（北/南/東/西）とアクションオプションが表示される SHALL
2. WHEN 視聴者が選択肢をタップする THEN 投票が即座に送信され、視覚的フィードバックが提供される SHALL
3. WHEN 投票期間が終了する THEN 各キャラクターの最多得票アクションが実行される SHALL
4. IF 投票が同数の場合 THEN ランダムに選択される SHALL
5. WHEN 投票期間中 THEN 残り時間が明確に表示される SHALL

### Requirement 3

**User Story:** プレイヤーとして、サバイバル要素を楽しみたいので、資源収集、天候イベント、野生動物との遭遇などの戦略的要素があるようにしたい

#### Acceptance Criteria

1. WHEN プレイヤーが島を移動する THEN 食料、木材、武器などの資源を発見し収集できる SHALL
2. WHEN ランダムな天候イベントが発生する THEN プレイヤーはシェルター建設または避難の投票を行う SHALL
3. WHEN 野生動物と遭遇する THEN コミュニティは戦闘または逃走を投票で決定する SHALL
4. WHEN 島が縮小する THEN プレイヤーは安全エリアに移動する必要がある SHALL
5. IF プレイヤーが安全エリア外にいる THEN 徐々にダメージを受ける SHALL

### Requirement 4

**User Story:** 配信者として、バイラルなクリップを生成したいので、予測不可能で面白い瞬間が自然に発生するゲームメカニクスが欲しい

#### Acceptance Criteria

1. WHEN キャラクター同士が接触する THEN 物理ベースの相互作用（押し合い、崖からの落下など）が発生する SHALL
2. WHEN 限られたリソース（シェルタースペース等）がある THEN プレイヤー間で協力 vs 競争の判断が必要になる SHALL
3. WHEN ランダムイベント（流星群、間欠泉、バナナの皮等）が発生する THEN 予測不可能な「クリップに値する」瞬間が創出される SHALL
4. WHEN 重要な瞬間が発生する THEN 自動的にハイライトとして記録される SHALL

### Requirement 5

**User Story:** 配信者として、既存の配信プラットフォームと統合したいので、Twitch、YouTube Live、Discord などのプラットフォーム固有機能を活用できるようにしたい

#### Acceptance Criteria

1. WHEN Twitch で配信する THEN チャンネルポイント統合とチャットコマンドショートカット（!north、!attack 等）が利用できる SHALL
2. WHEN YouTube Live で配信する THEN スーパーチャット統合による特別アクションが可能である SHALL
3. WHEN Discord と連携する THEN ゲーム結果がコミュニティ Discord サーバーに自動投稿される SHALL
4. WHEN ハイライトが生成される THEN カスタムサムネイル付きでワンクリック共有できる SHALL

### Requirement 6

**User Story:** 開発者として、1 日で実装可能なシステムを構築したいので、無料のクラウドサービスを活用した技術スタックで動作するようにしたい

#### Acceptance Criteria

1. WHEN システムをデプロイする THEN Netlify（フロントエンド）、Render.com（バックエンド）、Supabase（データベース）の無料枠内で動作する SHALL
2. WHEN 同時接続が発生する THEN 最大 50-100 人の同時視聴者をサポートする SHALL
3. WHEN 15 分間非アクティブになる THEN サーバーがスリープし、次回接続時に 30 秒以内で復帰する SHALL
4. WHEN モバイルデバイスからアクセスする THEN iOS Safari 6+、全 Android ブラウザで動作する SHALL
5. WHEN リアルタイム通信が必要な場合 THEN 投票アップデートで 200-500ms 以内のレイテンシを維持する SHALL

### Requirement 7

**User Story:** プレイヤーとして、アクセシブルなゲーム体験を得たいので、色覚障害対応や多言語サポートなどの配慮がされているようにしたい

#### Acceptance Criteria

1. WHEN UI 要素が表示される THEN 色覚障害に対応した形状とテキストインジケーターが使用される SHALL
2. WHEN モバイルでタッチ操作する THEN 大きなタッチターゲットでワンタップ投票が可能である SHALL
3. WHEN 重要なイベントが発生する THEN 音声キューが提供される SHALL
4. WHEN 国際的な配信コミュニティが参加する THEN 多言語サポートが利用できる SHALL

### Requirement 8

**User Story:** 配信者として、収益化の機会を得たいので、オプションのコスメティック購入やサブスクリプションモデルが利用できるようにしたい

#### Acceptance Criteria

1. WHEN プレイヤーがカスタマイズを希望する THEN 1-3 ドルの動物スキンを購入できる SHALL
2. WHEN 配信者が高度な機能を求める THEN 月 10 ドルでカスタムゲームモード、プライベートサーバーにアクセスできる SHALL
3. WHEN プラットフォーム収益が発生する THEN Twitch Bits、YouTube スーパーチャットとの統合で収益分配される SHALL
4. IF 基本機能を利用する場合 THEN 完全無料でアクセスできる SHALL
