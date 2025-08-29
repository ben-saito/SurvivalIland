const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { createGame, getGameByRoomId, updateGameStatus, addPlayer, getPlayers, logGameEvent } = require('./database');
const EventSystem = require('./eventSystem');
const PhysicsSystem = require('./physicsSystem');

class GameManager {
  constructor(io) {
    this.io = io;
    this.games = new Map(); // In-memory game state for real-time operations
    this.playerSocketMap = new Map(); // Map socket IDs to player data
    this.eventSystem = new EventSystem(); // Random event system
    this.physicsSystem = new PhysicsSystem(); // Physics and viral moments
    
    // Animal types available for players
    this.animalTypes = [
      'bear', 'fox', 'rabbit', 'deer', 'wolf', 
      'cat', 'dog', 'panda', 'lion', 'tiger'
    ];
  }

  // Generate a unique 6-character room ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create a new game room
  async createRoom(socket, data) {
    try {
      const { streamerName } = data;
      const roomId = this.generateRoomId();
      
      // Create game in database
      const dbGame = await createGame(roomId, { streamerName });
      
      // Create in-memory game state
      const gameState = {
        id: dbGame?.id || uuidv4(),
        roomId,
        status: 'lobby',
        streamerSocketId: socket.id,
        streamerName: streamerName || 'Anonymous Streamer',
        players: new Map(),
        maxPlayers: 30,
        currentRound: 0,
        island: this.createIslandGrid(10),
        votingInProgress: false,
        lastVoteTime: null,
        settings: {
          votingDuration: 10000,
          islandSize: 10
        }
      };
      
      this.games.set(roomId, gameState);
      this.playerSocketMap.set(socket.id, { roomId, isStreamer: true });
      
      // Join socket to room
      socket.join(roomId);
      
      // Generate QR code for mobile access
      const mobileUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/mobile/${roomId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(mobileUrl);
      
      socket.emit('room-created', {
        roomId,
        qrCode: qrCodeDataUrl,
        mobileUrl,
        gameState: this.getPublicGameState(gameState)
      });
      
      console.log(`Room created: ${roomId} by ${streamerName}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  // Join an existing game room
  async joinRoom(socket, data) {
    try {
      const { roomId, playerName, isStreamer = false } = data;
      
      const gameState = this.games.get(roomId);
      if (!gameState) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      if (gameState.status !== 'lobby') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      
      if (gameState.players.size >= gameState.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }
      
      // Assign random animal type
      const animalType = this.animalTypes[Math.floor(Math.random() * this.animalTypes.length)];
      
      // Create player data
      const player = {
        id: uuidv4(),
        socketId: socket.id,
        playerName: playerName || `Player${gameState.players.size + 1}`,
        animalType,
        position: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) },
        health: 100,
        isAlive: true,
        inventory: {},
        joinedAt: Date.now(),
        isStreamer
      };
      
      // Add to game state
      gameState.players.set(socket.id, player);
      this.playerSocketMap.set(socket.id, { roomId, playerId: player.id });
      
      // Add to database
      if (gameState.id) {
        await addPlayer(gameState.id, {
          socket_id: socket.id,
          player_name: player.playerName,
          animal_type: player.animalType,
          position_x: player.position.x,
          position_y: player.position.y,
          is_streamer: isStreamer
        });
      }
      
      // Join socket to room
      socket.join(roomId);
      
      // Send confirmation to player
      socket.emit('joined-room', {
        playerId: player.id,
        playerData: player,
        gameState: this.getPublicGameState(gameState)
      });
      
      // Broadcast to room about new player
      socket.to(roomId).emit('player-joined', {
        player: this.getPublicPlayerData(player),
        playerCount: gameState.players.size
      });
      
      console.log(`Player ${player.playerName} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  // Leave a game room
  leaveRoom(socket) {
    const playerData = this.playerSocketMap.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const gameState = this.games.get(roomId);
    
    if (gameState) {
      const player = gameState.players.get(socket.id);
      if (player) {
        gameState.players.delete(socket.id);
        
        // Notify other players
        socket.to(roomId).emit('player-left', {
          playerId: player.id,
          playerCount: gameState.players.size
        });
        
        console.log(`Player ${player.playerName} left room ${roomId}`);
      }
      
      // If streamer left, end the game
      if (gameState.streamerSocketId === socket.id) {
        this.endGame(roomId);
      }
      
      // If no players left, clean up room
      if (gameState.players.size === 0) {
        this.games.delete(roomId);
      }
    }
    
    this.playerSocketMap.delete(socket.id);
    socket.leave(roomId);
  }

  // Start a game
  async startGame(socket, data) {
    console.log('StartGame called by socket:', socket.id);
    
    const playerData = this.playerSocketMap.get(socket.id);
    console.log('Player data:', playerData);
    
    if (!playerData) {
      console.log('No player data found for socket:', socket.id);
      socket.emit('error', { message: 'Player not found' });
      return;
    }
    
    const { roomId } = playerData;
    console.log('Room ID:', roomId);
    
    const gameState = this.games.get(roomId);
    console.log('Game state exists:', !!gameState);
    
    if (!gameState) {
      console.log('Room not found:', roomId);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    console.log('Streamer socket check:', gameState.streamerSocketId, 'vs', socket.id);
    if (gameState.streamerSocketId !== socket.id) {
      console.log('Not streamer, access denied');
      socket.emit('error', { message: 'Only streamer can start the game' });
      return;
    }
    
    console.log('Player count:', gameState.players.size);
    if (gameState.players.size < 1) { // Changed from 2 to 1 for testing
      console.log('Not enough players');
      socket.emit('error', { message: 'Need at least 1 player to start' });
      return;
    }
    
    console.log('Starting game in room:', roomId);
    
    // Update game status
    gameState.status = 'playing';
    gameState.currentRound = 1;
    
    await updateGameStatus(gameState.id, 'playing');
    
    // Broadcast game start
    this.io.to(roomId).emit('game-started', {
      gameState: this.getPublicGameState(gameState)
    });
    
    console.log('Game started broadcast sent');
    
    // Start first voting round
    setTimeout(() => {
      console.log('Starting first voting round');
      this.startVotingRound(roomId);
    }, 2000); // 2 second delay for players to prepare
    
    console.log(`Game started in room ${roomId}`);
  }

  // Start a voting round
  startVotingRound(roomId) {
    const gameState = this.games.get(roomId);
    if (!gameState || gameState.status !== 'playing') return;
    
    gameState.status = 'voting';
    gameState.votingInProgress = true;
    gameState.currentVotes = new Map();
    
    const alivePlayers = Array.from(gameState.players.values()).filter(p => p.isAlive);
    
    // Check if random event should occur
    const shouldHaveEvent = this.eventSystem.shouldTriggerEvent(gameState.currentRound, alivePlayers.length);
    
    let votingData;
    if (shouldHaveEvent) {
      // Create event voting round
      const eventData = this.eventSystem.createEventRound(gameState.currentRound, alivePlayers);
      gameState.currentEvent = eventData;
      
      votingData = {
        roundNumber: gameState.currentRound,
        isEvent: true,
        event: this.eventSystem.getEventDescription(eventData),
        options: eventData.options.map(opt => ({
          id: opt.id,
          name: opt.name,
          emoji: opt.emoji
        })),
        duration: gameState.settings.votingDuration,
        players: alivePlayers.map(p => this.getPublicPlayerData(p))
      };
    } else {
      // Normal movement/action voting round
      const votingOptions = ['north', 'south', 'east', 'west', 'collect', 'build'];
      gameState.currentEvent = null;
      
      votingData = {
        roundNumber: gameState.currentRound,
        isEvent: false,
        options: votingOptions,
        duration: gameState.settings.votingDuration,
        players: alivePlayers.map(p => this.getPublicPlayerData(p))
      };
    }
    
    // Broadcast voting start
    this.io.to(roomId).emit('voting-start', votingData);
    
    // Auto-end voting after duration
    setTimeout(() => {
      this.endVotingRound(roomId);
    }, gameState.settings.votingDuration);
  }

  // Handle player vote
  castVote(socket, data) {
    const playerData = this.playerSocketMap.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const gameState = this.games.get(roomId);
    const player = gameState?.players.get(socket.id);
    
    if (!gameState || !player || !gameState.votingInProgress) {
      socket.emit('error', { message: 'Voting not available' });
      return;
    }
    
    const { action } = data;
    
    // Store vote
    gameState.currentVotes.set(socket.id, { action, playerId: player.id });
    
    // Confirm vote to player
    socket.emit('vote-confirmed', { action });
    
    // Broadcast vote count update (without revealing individual votes)
    this.io.to(roomId).emit('vote-update', {
      totalVotes: gameState.currentVotes.size,
      totalPlayers: gameState.players.size
    });
  }

  // End voting round and process results
  endVotingRound(roomId) {
    const gameState = this.games.get(roomId);
    if (!gameState || !gameState.votingInProgress) return;
    
    gameState.votingInProgress = false;
    gameState.status = 'playing';
    
    // Tally votes
    const voteCounts = new Map();
    gameState.currentVotes.forEach(vote => {
      const count = voteCounts.get(vote.action) || 0;
      voteCounts.set(vote.action, count + 1);
    });
    
    // Find winning action (most votes, random if tie)
    let winningAction = null;
    let maxVotes = 0;
    const topActions = [];
    
    voteCounts.forEach((count, action) => {
      if (count > maxVotes) {
        maxVotes = count;
        topActions.length = 0;
        topActions.push(action);
      } else if (count === maxVotes) {
        topActions.push(action);
      }
    });
    
    if (topActions.length > 0) {
      winningAction = topActions[Math.floor(Math.random() * topActions.length)];
    }
    
    let eventResults = null;
    let resultMessages = [];
    
    if (gameState.currentEvent) {
      // Process event voting
      const eventVotes = Array.from(gameState.currentVotes.values()).map(vote => ({
        playerId: vote.playerId,
        choice: vote.action
      }));
      
      eventResults = this.eventSystem.processEventResults(
        gameState.currentEvent,
        eventVotes,
        Array.from(gameState.players.values())
      );
      
      // Apply event effects to players
      this.eventSystem.applyEffectsToPlayers(
        eventResults.effects,
        Array.from(gameState.players.values())
      );
      
      resultMessages = eventResults.messages;
      winningAction = eventResults.winningChoice;
    } else {
      // Apply normal action results
      this.processGameAction(gameState, winningAction, gameState.currentVotes);
    }
    
    // Broadcast results
    this.io.to(roomId).emit('voting-end', {
      winningAction,
      voteCounts: Object.fromEntries(voteCounts),
      isEvent: !!gameState.currentEvent,
      eventResults,
      messages: resultMessages,
      physicsResults: gameState.lastPhysicsResults,
      highlights: gameState.lastHighlights,
      gameState: this.getPublicGameState(gameState)
    });
    
    // Check win conditions
    const alivePlayers = Array.from(gameState.players.values()).filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      this.endGame(roomId, alivePlayers[0] || null);
      return;
    }
    
    // Start next round
    gameState.currentRound++;
    setTimeout(() => {
      this.startVotingRound(roomId);
    }, 3000); // 3 second break between rounds
  }

  // Process the winning action
  processGameAction(gameState, action, votes) {
    const playersWhoVoted = Array.from(votes.values())
      .filter(vote => vote.action === action)
      .map(vote => vote.playerId);
    
    const alivePlayers = Array.from(gameState.players.values()).filter(p => p.isAlive);
    const movingPlayers = alivePlayers.filter(p => playersWhoVoted.includes(p.id));
    
    let physicsResults = null;
    let highlights = [];
    
    // Handle movement actions with physics
    if (['north', 'south', 'east', 'west'].includes(action)) {
      physicsResults = this.physicsSystem.processPlayerMovement(gameState, movingPlayers, action);
      highlights = this.physicsSystem.generateHighlightMoments(physicsResults);
      
      // Add physics visualization to island grid
      this.physicsSystem.addPhysicsVisualization(gameState, physicsResults);
    } else {
      // Handle non-movement actions
      movingPlayers.forEach(player => {
        switch (action) {
          case 'collect':
            // Add random resource
            const resources = ['food', 'wood', 'stone'];
            const resource = resources[Math.floor(Math.random() * resources.length)];
            player.inventory[resource] = (player.inventory[resource] || 0) + 1;
            break;
          case 'build':
            // Build shelter if resources available
            if (player.inventory.wood >= 2) {
              player.inventory.wood -= 2;
              player.inventory.shelter = true;
            }
            break;
        }
      });
    }
    
    // Store physics results in game state for broadcasting
    gameState.lastPhysicsResults = physicsResults;
    gameState.lastHighlights = highlights;
    
    // Island shrinking logic
    if (gameState.currentRound % 3 === 0) {
      this.shrinkIsland(gameState);
    }
    
    // Clean up old hazards
    this.physicsSystem.clearOldHazards(gameState);
  }

  // Shrink the island (damage players outside safe zone)
  shrinkIsland(gameState) {
    const shrinkLevel = Math.floor(gameState.currentRound / 3);
    const safeRadius = Math.max(2, gameState.settings.islandSize / 2 - shrinkLevel);
    const center = gameState.settings.islandSize / 2;
    
    gameState.players.forEach(player => {
      if (!player.isAlive) return;
      
      const distance = Math.sqrt(
        Math.pow(player.position.x - center, 2) + 
        Math.pow(player.position.y - center, 2)
      );
      
      if (distance > safeRadius) {
        player.health -= 25;
        if (player.health <= 0) {
          player.isAlive = false;
          player.health = 0;
        }
      }
    });
  }

  // End the game
  async endGame(roomId, winner = null) {
    const gameState = this.games.get(roomId);
    if (!gameState) return;
    
    gameState.status = 'ended';
    
    await updateGameStatus(gameState.id, 'ended');
    
    // Broadcast game end
    this.io.to(roomId).emit('game-ended', {
      winner: winner ? this.getPublicPlayerData(winner) : null,
      finalState: this.getPublicGameState(gameState)
    });
    
    // Clean up after 5 minutes
    setTimeout(() => {
      this.games.delete(roomId);
    }, 300000);
    
    console.log(`Game ended in room ${roomId}`);
  }

  // Handle streamer controls
  handleStreamerControl(socket, data) {
    const playerData = this.playerSocketMap.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const gameState = this.games.get(roomId);
    
    if (!gameState || gameState.streamerSocketId !== socket.id) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }
    
    const { action, payload } = data;
    
    switch (action) {
      case 'pause':
        // Implement pause functionality
        break;
      case 'skip-round':
        if (gameState.votingInProgress) {
          this.endVotingRound(roomId);
        }
        break;
      case 'change-settings':
        Object.assign(gameState.settings, payload);
        break;
      case 'end-game':
        this.endGame(roomId);
        break;
    }
  }

  // Handle socket disconnection
  handleDisconnection(socket) {
    this.leaveRoom(socket);
  }

  // Create initial island grid
  createIslandGrid(size) {
    const grid = [];
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        row.push({
          x,
          y,
          type: 'grass',
          resources: Math.random() < 0.3 ? ['food', 'wood', 'stone'][Math.floor(Math.random() * 3)] : null
        });
      }
      grid.push(row);
    }
    return grid;
  }

  // Get public game state (safe to send to clients)
  getPublicGameState(gameState) {
    return {
      roomId: gameState.roomId,
      status: gameState.status,
      currentRound: gameState.currentRound,
      playerCount: gameState.players.size,
      maxPlayers: gameState.maxPlayers,
      island: gameState.island,
      votingInProgress: gameState.votingInProgress,
      settings: gameState.settings
    };
  }

  // Get public player data (safe to send to clients)
  getPublicPlayerData(player) {
    return {
      id: player.id,
      playerName: player.playerName,
      animalType: player.animalType,
      position: player.position,
      health: player.health,
      isAlive: player.isAlive,
      inventory: player.inventory
    };
  }
}

module.exports = GameManager;