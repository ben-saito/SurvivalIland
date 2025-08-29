# 🏝️ Survival Island Battle - サバイバル島バトル

[![GitHub Repository](https://img.shields.io/badge/GitHub-ben--saito%2FSurvivalIland-blue?style=flat&logo=github)](https://github.com/ben-saito/SurvivalIland)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7%2B-black?style=flat&logo=socket.io)](https://socket.io/)

A streaming battle royale game where 10-30 viewers control cute animal characters through real-time mobile voting every 10 seconds on a shrinking island.

🎥 **Perfect for streamers on Twitch, YouTube Live, and Discord communities!**

## 🎮 Game Features

- **Real-time Multiplayer**: Up to 30 players per game
- **Mobile-First Voting**: Simple touch interface optimized for phones
- **Streamer Dashboard**: Complete game management for streamers
- **Cute Animal Characters**: 10 different animal types with unique personalities
- **Island Survival**: Shrinking safe zones and resource management
- **10-Second Voting Rounds**: Fast-paced decision making
- **Free Tier Optimized**: Works on Netlify, Render.com, and Supabase free tiers

## 🏗️ Architecture

- **Frontend**: Static HTML/CSS/JS hosted on Netlify
- **Backend**: Node.js + Express + Socket.io on Render.com
- **Database**: Supabase (PostgreSQL) with real-time features
- **Real-time Communication**: WebSocket connections with auto-reconnection

## 🚀 Quick Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd SurvivalIland
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### 3. Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL commands in `database/setup.sql` in your Supabase SQL editor
3. Update your `.env` file with the Supabase credentials

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at:
- Main page: http://localhost:3000
- Streamer dashboard: http://localhost:3000/streamer
- Mobile interface: http://localhost:3000/mobile/ROOMID

## 📱 How to Play

### For Streamers:
1. Visit `/streamer` to create a game room
2. Share the QR code or room ID with viewers
3. Start the game when enough players join
4. Watch the chaos unfold!

### For Viewers:
1. Scan QR code or visit `/mobile/ROOMID` on your phone
2. Enter your player name
3. Vote every 10 seconds using the touch interface
4. Try to be the last survivor!

## 🔧 Game Mechanics

### Movement System
- **4-Direction Movement**: North, South, East, West
- **Grid-based Island**: 10x10 initial grid
- **Majority Vote Wins**: Most popular action is executed

### Survival Elements
- **Shrinking Island**: Safe zone reduces every 3 rounds
- **Resource Collection**: Food, wood, and stone scattered on island
- **Shelter Building**: Use wood to build protective shelters
- **Health System**: 100 HP, reduced by hazards and island damage

### Voting Actions
- **Movement**: Move in cardinal directions
- **Collect**: Gather nearby resources
- **Build**: Construct shelters with materials

## 🚀 Deployment

### Netlify (Frontend)
1. Connect your GitHub repository to Netlify
2. Build settings are configured in `netlify.toml`
3. Set environment variables in Netlify dashboard

### Render.com (Backend)
1. Create a new Web Service on Render.com
2. Use `render.yaml` for configuration
3. Add environment variables in Render dashboard

### Supabase (Database)
1. Create project and run setup SQL
2. Configure RLS policies as needed
3. Add database credentials to environment variables

## 🎯 Target Performance

- **Concurrent Users**: 50-100 viewers per stream
- **Latency**: 200-500ms for voting updates  
- **Mobile Compatibility**: iOS Safari 6+, Android Chrome
- **Free Tier Friendly**: Optimized for free hosting limits

## 🔒 Security Features

- Input sanitization for player names
- Rate limiting on voting actions
- XSS protection
- Connection validation
- Basic anti-griefing measures

## 📊 Monitoring

The application includes:
- Health check endpoint (`/health`)
- Connection status monitoring
- Game session analytics
- Error logging and reporting

## 🎨 Customization

### Animal Characters
Edit the `animalTypes` array in `server/gameManager.js` to add new characters.

### Game Balance
Adjust timing and mechanics in the game manager:
- `votingDuration`: Time for each voting round
- `maxPlayers`: Maximum players per game  
- `islandSize`: Initial island dimensions

### UI Themes
Modify CSS files in `/public/css/` for custom styling.

## 🐛 Troubleshooting

### Common Issues

1. **Server Sleep on Render.com**
   - Free tier servers sleep after 15 minutes
   - Cold start takes ~30 seconds
   - Use health checks to keep alive during streams

2. **Mobile Voting Issues**
   - Ensure 44px minimum touch targets
   - Test on actual devices, not just browser dev tools
   - Check for network connectivity issues

3. **Database Connection Limits**
   - Supabase free tier has connection limits
   - Implement connection pooling for high traffic
   - Monitor usage in Supabase dashboard

### Debug Mode
Set `NODE_ENV=development` for verbose logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile devices
5. Submit a pull request

## 📜 License

MIT License - see LICENSE file for details.

## 🎬 Perfect for Streaming

This game is designed specifically for:
- **Twitch streamers** - Highly interactive and entertaining
- **YouTube Live** - Mobile-friendly viewer participation  
- **Discord communities** - Easy setup for community events
- **Content creators** - Viral moments and highlight clips

Ready to create chaos on the island? Let the battle begin! 🏝️⚔️

## 🔗 Links

- **GitHub Repository**: [github.com/ben-saito/SurvivalIland](https://github.com/ben-saito/SurvivalIland)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/ben-saito/SurvivalIland/issues)
- **Releases**: [GitHub Releases](https://github.com/ben-saito/SurvivalIland/releases)

---

*Built with ❤️ by [Claude Code](https://claude.ai/code) - AI-powered development assistant*