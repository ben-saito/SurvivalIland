const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // ローカル開発環境では無効にする
  if (process.env.NODE_ENV === 'development' && supabaseUrl === 'https://dummy-project.supabase.co') {
    console.log('ローカル開発モード: データベース無効、メモリベースで動作');
    return null;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not provided. Database functionality will be limited.');
    return null;
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase initialized');
  return supabase;
};

const getSupabase = () => {
  return supabase;
};

// Database table schemas (for reference and setup)
const createTablesSQL = `
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

-- Game events table
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  round_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

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
`;

// Helper functions for database operations
const createGame = async (roomId, settings = {}) => {
  if (!supabase) {
    console.log('Database not available - running in memory-only mode');
    return { id: require('uuid').v4(), room_id: roomId, status: 'lobby' };
  }
  
  try {
    const { data, error } = await supabase
      .from('games')
      .insert({
        room_id: roomId,
        game_settings: settings
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating game:', error.message);
    // Return a local mock object for development
    return { id: require('uuid').v4(), room_id: roomId, status: 'lobby' };
  }
};

const getGameByRoomId = async (roomId) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('room_id', roomId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting game:', error);
    return null;
  }
};

const updateGameStatus = async (gameId, status) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ status, updated_at: new Date() })
      .eq('id', gameId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating game status:', error);
    return null;
  }
};

const addPlayer = async (gameId, playerData) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('players')
      .insert({
        game_id: gameId,
        ...playerData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding player:', error);
    return null;
  }
};

const getPlayers = async (gameId) => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_alive', true);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
};

const logGameEvent = async (gameId, eventType, eventData, roundNumber = null) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('game_events')
      .insert({
        game_id: gameId,
        event_type: eventType,
        event_data: eventData,
        round_number: roundNumber
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging game event:', error);
    return null;
  }
};

module.exports = {
  initializeSupabase,
  getSupabase,
  createTablesSQL,
  createGame,
  getGameByRoomId,
  updateGameStatus,
  addPlayer,
  getPlayers,
  logGameEvent
};