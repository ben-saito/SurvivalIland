# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "サバイバル島バトル" (Survival Island Battle) - a browser-based interactive battle royale game designed for streamers. The game combines Fall Guys' viral nature, Jackbox Games' accessibility, and Twitch Plays' participatory elements. 10-30 viewers control cute animal characters through real-time voting every 10 seconds on a shrinking island.

## Architecture

### Technology Stack
- **Frontend**: Static site hosted on Netlify with mobile-first design
- **Backend**: Node.js + Express + Socket.io on Render.com
- **Database**: Supabase (PostgreSQL) with real-time features
- **Real-time Communication**: Socket.io WebSockets (target latency: 200-500ms)

### System Architecture
```
Streamer Dashboard  <-->  WebSocket Server  <-->  Mobile Voting UI
                              |
                         Game Engine
                              |
                     Supabase Database
```

### Core Components

#### Game Engine (`GameState` Manager)
- Manages room states: "lobby" | "playing" | "voting" | "ended"
- Tracks players, island grid (10x10 initially), voting rounds
- Handles game logic and physics simulation

#### Real-time Communication Layer
- Socket.io events for join-room, cast-vote, streamer-control
- Broadcasts game-state, voting-start/end, player-action events
- Auto-reconnection with exponential backoff

#### Island and Physics System
- Grid-based island with shrinking safe zones
- Simple physics for character movement and collisions
- Resource collection (food, wood, weapons) and shelter building

#### Mobile-First UI
- 44px minimum touch targets for iOS
- 10-second voting countdown timer
- QR code generation for easy room joining

## Database Schema

### Core Tables
- `games`: Room management with UUID, status, max_players (30)
- `players`: Player state including animal_type, position, health, inventory
- `game_events`: Event logging for analytics and replay

### In-Memory State
- Node.js Map for active game states (no Redis due to free tier constraints)
- Player socket mapping for real-time communication

## Development Constraints

### Free Tier Limitations
- **Netlify**: Static site hosting
- **Render.com**: Server sleeps after 15min inactivity, 30s cold start
- **Supabase**: PostgreSQL with connection limits
- **Target**: 50-100 concurrent viewers support

### 1-Day Development Approach
Implementation is planned in phases:
1. **MVP Core** (3h): Basic grid, animal sprites, movement, QR codes
2. **Voting System** (3h): 10s timer, mobile UI, real-time results
3. **Game Mechanics** (2h): Island shrinking, resource collection, events
4. **Polish & Deploy** (2h): UI/UX, streamer dashboard, production deployment

## Key Design Decisions

### Error Handling
- Auto-reconnection for network resilience
- Graceful degradation for free tier constraints
- Offline voting mode when server unavailable
- Cold start handling for Render.com sleep mode

### Security & Validation
- XSS protection with input sanitization
- Rate limiting for voting actions
- Player name validation (20 char limit)
- Basic anti-griefing measures

### Mobile Optimization
- Touch-first interface design
- Large tap targets (44px+)
- Responsive design for various screen sizes
- Battery consumption optimization

## Testing Strategy

### Performance Testing
- Load testing with 10, 30, 50 concurrent players
- Voting frequency stress tests (10s intervals)
- Memory usage monitoring for free tier compliance
- Mobile browser compatibility (iOS Safari 6+, Android Chrome)

### Integration Testing
- Socket.io communication reliability
- Player disconnection handling
- Game state synchronization across clients
- Database connection pooling

## Platform Integrations

### Streamer Platforms
- **Twitch**: Chat commands (!north, !attack), channel points
- **YouTube Live**: Super Chat integration for special actions
- **Discord**: Automatic game result posting
- Social media sharing with custom thumbnails

### Accessibility Features
- Color-blind friendly UI with shapes and text indicators
- Audio cues for important game events
- Multi-language support (English, Japanese initially)
- Screen reader compatibility

## Deployment Configuration

### Environment Variables
- Database connection strings for Supabase
- Socket.io configuration for Render.com
- Platform API keys for integrations
- Game balance parameters (timers, player limits)

### Monitoring
- Free tier usage tracking
- Real-time connection monitoring
- Game session analytics
- Error logging and alerting

## Future Expansion Considerations

### Monetization Ready
- Cosmetic purchases (animal skins $1-3)
- Premium streamer features ($10/month)
- Platform revenue sharing integration
- Free tier feature limitations

### Scalability Planning
- Modular architecture for feature expansion
- Database schema supports game variants
- Plugin system for custom game modes
- Multi-region deployment preparation

## MCP Integration

This project uses Serena MCP server for intelligent code analysis and editing. The `.mcp.json` configuration enables advanced symbolic code navigation and editing capabilities through Claude Code.