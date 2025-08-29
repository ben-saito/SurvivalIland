-- Supabase Database Setup for Survival Island Battle
-- Run these commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'lobby',
  max_players INTEGER NOT NULL DEFAULT 30,
  current_players INTEGER DEFAULT 0,
  island_size INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  game_settings JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  socket_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(20) NOT NULL,
  animal_type VARCHAR(20) NOT NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  health INTEGER DEFAULT 100,
  is_alive BOOLEAN DEFAULT true,
  inventory JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_streamer BOOLEAN DEFAULT false
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_socket_id ON players(socket_id);
CREATE INDEX IF NOT EXISTS idx_players_is_alive ON players(is_alive);

-- Game events table for analytics and replay
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  round_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON game_events(created_at);

-- Voting rounds table
CREATE TABLE IF NOT EXISTS voting_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  voting_type VARCHAR(20) NOT NULL,
  options JSONB NOT NULL,
  votes JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_ms INTEGER DEFAULT 10000
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_voting_rounds_game_id ON voting_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_voting_rounds_started_at ON voting_rounds(started_at);

-- Island state table (for persistence across server restarts)
CREATE TABLE IF NOT EXISTS island_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  grid_data JSONB NOT NULL,
  safe_zone_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_island_states_game_id ON island_states(game_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_island_states_updated_at 
    BEFORE UPDATE ON island_states 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE island_states ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (in production, you'd want more restrictive policies)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_events" ON game_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on voting_rounds" ON voting_rounds FOR ALL USING (true);
CREATE POLICY "Allow all operations on island_states" ON island_states FOR ALL USING (true);

-- Insert some sample data for testing (optional)
-- INSERT INTO games (room_id, status, game_settings) VALUES 
-- ('SAMPLE', 'lobby', '{"streamerName": "TestStreamer"}');

-- View for active games
CREATE OR REPLACE VIEW active_games AS
SELECT 
  g.*,
  COUNT(p.id) as actual_player_count
FROM games g
LEFT JOIN players p ON g.id = p.game_id AND p.is_alive = true
WHERE g.status IN ('lobby', 'playing', 'voting')
GROUP BY g.id, g.room_id, g.status, g.max_players, g.current_players, 
         g.island_size, g.created_at, g.updated_at, g.game_settings;

-- View for game statistics
CREATE OR REPLACE VIEW game_statistics AS
SELECT 
  g.room_id,
  g.status,
  COUNT(p.id) as total_players,
  COUNT(CASE WHEN p.is_alive THEN 1 END) as alive_players,
  COUNT(CASE WHEN p.is_streamer THEN 1 END) as streamers,
  g.created_at,
  EXTRACT(EPOCH FROM (NOW() - g.created_at))/60 as duration_minutes
FROM games g
LEFT JOIN players p ON g.id = p.game_id
GROUP BY g.id, g.room_id, g.status, g.created_at;