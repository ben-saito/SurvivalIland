# Design Document

## Overview

「サバイバル島バトル」は、リアルタイム投票システムを核とした配信者向けインタラクティブゲームです。WebSocket ベースの通信により、最大 30 人の視聴者が 10 秒間隔で投票を行い、かわいい動物キャラクターを操作してバトルロワイヤル形式のサバイバルゲームを楽しみます。

### 技術的制約と設計方針

- **1 日開発制約**: MVP に焦点を当て、段階的機能拡張を前提とした設計
- **無料枠活用**: Netlify + Render.com + Supabase の無料枠内での動作
- **モバイルファースト**: スマートフォンでの投票体験を最優先
- **リアルタイム性**: Socket.io による低レイテンシ通信（200-500ms 目標）

## Architecture

### システム全体構成

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   配信者画面    │    │   視聴者モバイル  │    │  外部プラット   │
│  (Game Master)  │    │   (Voting UI)    │    │  フォーム統合   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     WebSocket Server      │
                    │    (Socket.io/Node.js)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Game Engine          │
                    │   (State Management)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Database Layer        │
                    │     (Supabase/PostgreSQL) │
                    └───────────────────────────┘
```

### デプロイメント構成

- **フロントエンド**: Netlify（静的サイトホスティング）
- **バックエンド**: Render.com（Node.js + Express + Socket.io）
- **データベース**: Supabase（PostgreSQL + リアルタイム機能）
- **CDN**: Netlify Edge（グローバル配信）

## Components and Interfaces

### 1. Game Engine Core

#### GameState Manager

```typescript
interface GameState {
  roomId: string;
  phase: "lobby" | "playing" | "voting" | "ended";
  players: Player[];
  island: IslandGrid;
  currentRound: number;
  votingTimer: number;
  events: GameEvent[];
}

interface Player {
  id: string;
  name: string;
  animal: AnimalType;
  position: Position;
  health: number;
  inventory: Item[];
  isAlive: boolean;
  votes: number;
}
```

#### Voting System

```typescript
interface VotingRound {
  playerId: string;
  options: VotingOption[];
  votes: Map<string, VotingOption>;
  duration: 10000; // 10秒固定
  results: VotingResult[];
}

interface VotingOption {
  type: "move" | "collect" | "attack" | "shelter";
  direction?: Direction;
  target?: string;
}
```

### 2. Real-time Communication Layer

#### Socket.io Events

```typescript
// Client → Server
interface ClientEvents {
  "join-room": (roomId: string, playerName: string) => void;
  "cast-vote": (playerId: string, vote: VotingOption) => void;
  "streamer-control": (action: StreamerAction) => void;
}

// Server → Client
interface ServerEvents {
  "game-state": (state: GameState) => void;
  "voting-start": (round: VotingRound) => void;
  "voting-end": (results: VotingResult[]) => void;
  "player-action": (action: PlayerAction) => void;
  "game-event": (event: GameEvent) => void;
}
```

### 3. Island and Physics System

#### Grid-based Island

```typescript
interface IslandGrid {
  width: number; // 初期: 10x10
  height: number;
  cells: Cell[][];
  safeZone: Rectangle;
  shrinkTimer: number;
}

interface Cell {
  type: "land" | "water" | "resource" | "hazard";
  occupants: Player[];
  items: Item[];
  elevation: number; // 物理演算用
}
```

#### Physics Engine (簡易版)

```typescript
interface PhysicsEngine {
  applyMovement(player: Player, direction: Direction): Position;
  checkCollisions(players: Player[]): CollisionEvent[];
  simulateGravity(position: Position): Position;
  calculatePushForce(pusher: Player, target: Player): Vector2D;
}
```

### 4. Mobile-First UI Components

#### Voting Interface

```typescript
interface VotingUI {
  timer: CircularTimer;
  options: VotingButton[];
  feedback: VoteFeedback;
  playerStatus: PlayerStatusCard;
}

interface VotingButton {
  type: VotingOption["type"];
  icon: string;
  label: string;
  disabled: boolean;
  touchTarget: "44px"; // iOS推奨最小サイズ
}
```

#### Streamer Dashboard

```typescript
interface StreamerDashboard {
  gameView: IslandRenderer;
  playerList: PlayerListPanel;
  controls: GameControls;
  qrCode: QRCodeGenerator;
  analytics: RealTimeStats;
}
```

## Data Models

### Database Schema (Supabase)

#### Games Table

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) UNIQUE NOT NULL,
  streamer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'lobby',
  max_players INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  settings JSONB
);
```

#### Players Table

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  player_name VARCHAR(50) NOT NULL,
  animal_type VARCHAR(20),
  position JSONB,
  health INTEGER DEFAULT 100,
  inventory JSONB DEFAULT '[]',
  is_alive BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW()
);
```

#### Game Events Table

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  event_type VARCHAR(50),
  event_data JSONB,
  round_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### In-Memory State Management

#### Redis Alternative (Node.js Map)

```typescript
class GameStateManager {
  private games: Map<string, GameState> = new Map();
  private playerSockets: Map<string, Socket> = new Map();

  createGame(streamerId: string): string;
  joinGame(roomId: string, socket: Socket): Player;
  updateGameState(roomId: string, updates: Partial<GameState>): void;
  broadcastToRoom(roomId: string, event: string, data: any): void;
}
```

## Error Handling

### Network Resilience

#### Auto-reconnection Strategy

```typescript
class ConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒から開始

  handleDisconnection(): void {
    // 指数バックオフで再接続試行
    setTimeout(() => {
      this.attemptReconnection();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  handleServerSleep(): void {
    // Render.com無料枠のコールドスタート対応
    this.showWakeupMessage();
    this.pingServer();
  }
}
```

#### Graceful Degradation

```typescript
interface FallbackModes {
  offlineVoting: boolean; // サーバー接続失敗時のローカル投票
  reducedFeatures: boolean; // 無料枠制限時の機能縮小
  spectatorMode: boolean; // 満員時の観戦モード
}
```

### Data Validation

#### Input Sanitization

```typescript
class VoteValidator {
  validateVote(
    vote: VotingOption,
    player: Player,
    gameState: GameState
  ): boolean {
    // 投票の有効性チェック
    // - プレイヤーの生存状態
    // - 投票期間内かどうか
    // - 選択肢の妥当性
    return this.isValidVote(vote, player, gameState);
  }

  sanitizePlayerName(name: string): string {
    // XSS対策、文字数制限
    return name.trim().substring(0, 20).replace(/[<>]/g, "");
  }
}
```

## Testing Strategy

### Unit Testing Framework

#### Core Game Logic Tests

```typescript
describe("VotingSystem", () => {
  test("should execute majority vote action", () => {
    const votes = new Map([
      ["player1", { type: "move", direction: "north" }],
      ["player2", { type: "move", direction: "north" }],
      ["player3", { type: "move", direction: "south" }],
    ]);

    const result = votingSystem.resolveVotes(votes);
    expect(result.action.direction).toBe("north");
  });

  test("should handle tie votes with randomization", () => {
    // 同票時のランダム選択テスト
  });
});
```

#### Integration Tests

```typescript
describe("Socket.io Integration", () => {
  test("should broadcast game state to all room members", async () => {
    // WebSocket通信のテスト
  });

  test("should handle player disconnection gracefully", async () => {
    // 切断処理のテスト
  });
});
```

### Performance Testing

#### Load Testing Strategy

```typescript
interface LoadTestScenarios {
  concurrent_players: number; // 10, 30, 50人での同時接続
  voting_frequency: number; // 10秒間隔での投票負荷
  message_throughput: number; // 1秒あたりのメッセージ数
  memory_usage: number; // メモリ使用量の監視
}
```

#### Mobile Performance Testing

- iOS Safari 6+ での動作確認
- Android Chrome での投票レスポンス測定
- 低帯域環境でのゲーム体験テスト
- バッテリー消費量の測定

### Browser Compatibility Testing

#### Target Browsers

- iOS Safari 6+
- Android Chrome 60+
- Desktop Chrome/Firefox/Safari (配信者用)
- WebSocket 対応の確認
- Touch event 処理の検証

## Implementation Phases

### Phase 1: MVP Core (3 時間)

- 基本的な 10x10 島グリッド
- 5-10 体のシンプルな動物スプライト
- 4 方向移動システム
- QR コード生成とルーム作成
- Socket.io 基本統合

### Phase 2: Voting System (3 時間)

- 10 秒投票タイマー
- モバイル投票 UI
- リアルタイム結果表示
- 基本的な勝利条件

### Phase 3: Game Mechanics (2 時間)

- 島縮小システム
- 簡単な資源収集
- 2-3 種類のランダムイベント
- 基本アニメーション

### Phase 4: Polish & Deploy (2 時間)

- UI/UX の最終調整
- サウンド効果
- 配信者コントロールパネル
- 本番デプロイとテスト

この設計により、1 日という制約の中で実装可能でありながら、将来的な拡張性も考慮したスケーラブルなアーキテクチャを実現します。
