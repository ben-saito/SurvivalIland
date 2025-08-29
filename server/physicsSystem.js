// Physics System for Survival Island Battle
class PhysicsSystem {
  constructor() {
    this.hazards = [
      {
        id: 'banana_peel',
        name: 'Banana Peel',
        emoji: '🍌',
        description: 'Slippery banana peel!',
        effect: 'slip',
        probability: 0.1
      },
      {
        id: 'geyser',
        name: 'Hot Geyser',
        emoji: '💧',
        description: 'Erupting geyser!',
        effect: 'launch',
        probability: 0.08
      },
      {
        id: 'pitfall',
        name: 'Hidden Pitfall',
        emoji: '🕳️',
        description: 'Hidden pit trap!',
        effect: 'fall',
        probability: 0.06
      },
      {
        id: 'bouncy_mushroom',
        name: 'Bouncy Mushroom',
        emoji: '🍄',
        description: 'Super bouncy mushroom!',
        effect: 'bounce',
        probability: 0.12
      }
    ];
  }

  // Check for player collisions and apply physics
  processPlayerMovement(gameState, players, action) {
    const results = {
      movements: [],
      collisions: [],
      hazardEvents: [],
      viralMoments: []
    };

    // Get players who are moving
    const movingPlayers = players.filter(p => p.isAlive);

    // Process movement for each player
    movingPlayers.forEach(player => {
      const oldPosition = { ...player.position };
      const newPosition = this.calculateNewPosition(player.position, action, gameState.settings.islandSize);
      
      // Check for collision with other players
      const collision = this.checkPlayerCollisions(newPosition, movingPlayers, player.id);
      
      if (collision) {
        // Handle collision physics
        const collisionResult = this.handlePlayerCollision(player, collision.otherPlayer, newPosition);
        results.collisions.push(collisionResult);
        
        // Check if this creates a viral moment
        if (this.isViralMoment(collisionResult)) {
          results.viralMoments.push({
            type: 'collision_chain',
            players: [player.id, collision.otherPlayer.id],
            description: `${player.playerName} crashed into ${collision.otherPlayer.playerName}!`,
            timestamp: Date.now()
          });
        }
      } else {
        // No collision, update position
        player.position = newPosition;
      }

      // Check for hazards at new position
      const hazard = this.checkHazards(player.position, gameState);
      if (hazard) {
        const hazardResult = this.applyHazardEffect(player, hazard);
        results.hazardEvents.push(hazardResult);
        
        // Check if hazard creates viral moment
        if (this.isViralHazard(hazardResult)) {
          results.viralMoments.push({
            type: 'hazard_comedy',
            players: [player.id],
            hazard: hazard.id,
            description: hazardResult.description,
            timestamp: Date.now()
          });
        }
      }

      results.movements.push({
        playerId: player.id,
        oldPosition,
        newPosition: player.position,
        moved: oldPosition.x !== player.position.x || oldPosition.y !== player.position.y
      });
    });

    // Check for chain reactions
    this.processChainReactions(results, players, gameState);

    return results;
  }

  // Calculate new position based on action and boundaries
  calculateNewPosition(currentPos, action, islandSize) {
    const newPos = { ...currentPos };
    
    switch (action) {
      case 'north':
        newPos.y = Math.max(0, currentPos.y - 1);
        break;
      case 'south':
        newPos.y = Math.min(islandSize - 1, currentPos.y + 1);
        break;
      case 'east':
        newPos.x = Math.min(islandSize - 1, currentPos.x + 1);
        break;
      case 'west':
        newPos.x = Math.max(0, currentPos.x - 1);
        break;
      default:
        // No movement for other actions
        break;
    }
    
    return newPos;
  }

  // Check for collisions with other players
  checkPlayerCollisions(position, allPlayers, currentPlayerId) {
    for (const player of allPlayers) {
      if (player.id === currentPlayerId || !player.isAlive) continue;
      
      if (player.position.x === position.x && player.position.y === position.y) {
        return { otherPlayer: player };
      }
    }
    return null;
  }

  // Handle collision between two players
  handlePlayerCollision(player1, player2, attemptedPosition) {
    const collisionType = this.determineCollisionType();
    
    let result = {
      type: collisionType,
      players: [player1.id, player2.id],
      description: '',
      effects: []
    };

    switch (collisionType) {
      case 'push':
        // Player 1 pushes player 2
        const pushDirection = this.calculatePushDirection(player1.position, player2.position);
        const pushedPosition = this.applyPush(player2.position, pushDirection);
        
        player2.position = pushedPosition;
        player1.position = attemptedPosition;
        
        result.description = `${player1.playerName} pushed ${player2.playerName}!`;
        result.effects = [
          { playerId: player2.id, type: 'position', value: pushedPosition }
        ];
        break;
        
      case 'bounce':
        // Both players bounce back
        result.description = `${player1.playerName} and ${player2.playerName} bounced off each other!`;
        result.effects = [
          { playerId: player1.id, type: 'health', value: -2 },
          { playerId: player2.id, type: 'health', value: -2 }
        ];
        break;
        
      case 'stumble':
        // Both players stumble and take minor damage
        player1.health = Math.max(0, player1.health - 5);
        player2.health = Math.max(0, player2.health - 5);
        
        result.description = `${player1.playerName} and ${player2.playerName} stumbled into each other!`;
        result.effects = [
          { playerId: player1.id, type: 'health', value: -5 },
          { playerId: player2.id, type: 'health', value: -5 }
        ];
        break;
        
      default:
        // Block movement
        result.description = `${player1.playerName} bumped into ${player2.playerName}!`;
        break;
    }

    return result;
  }

  // Determine type of collision randomly
  determineCollisionType() {
    const types = ['push', 'bounce', 'stumble', 'block'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // Push most common, block least
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }
    
    return 'block';
  }

  // Calculate push direction
  calculatePushDirection(pusherPos, pushedPos) {
    const dx = pushedPos.x - pusherPos.x;
    const dy = pushedPos.y - pusherPos.y;
    
    // Normalize and return primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'east' : 'west';
    } else {
      return dy > 0 ? 'south' : 'north';
    }
  }

  // Apply push effect to position
  applyPush(position, direction) {
    const newPos = { ...position };
    
    switch (direction) {
      case 'north':
        newPos.y = Math.max(0, position.y - 1);
        break;
      case 'south':
        newPos.y = Math.min(9, position.y + 1); // Assuming 10x10 grid
        break;
      case 'east':
        newPos.x = Math.min(9, position.x + 1);
        break;
      case 'west':
        newPos.x = Math.max(0, position.x - 1);
        break;
    }
    
    return newPos;
  }

  // Check for hazards at position
  checkHazards(position, gameState) {
    // Check island grid for hazards
    if (gameState.island && gameState.island[position.y] && gameState.island[position.y][position.x]) {
      const cell = gameState.island[position.y][position.x];
      if (cell.hazard) {
        return cell.hazard;
      }
    }
    
    // Random hazard spawn chance
    if (Math.random() < 0.1) { // 10% chance per move
      const hazard = this.spawnRandomHazard(position);
      // Add hazard to game state
      if (gameState.island && gameState.island[position.y] && gameState.island[position.y][position.x]) {
        gameState.island[position.y][position.x].hazard = hazard;
      }
      return hazard;
    }
    
    return null;
  }

  // Spawn random hazard
  spawnRandomHazard(position) {
    const totalProbability = this.hazards.reduce((sum, h) => sum + h.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const hazard of this.hazards) {
      random -= hazard.probability;
      if (random <= 0) {
        return {
          ...hazard,
          position: position,
          id: `${hazard.id}_${Date.now()}`
        };
      }
    }
    
    return this.hazards[0]; // Fallback
  }

  // Apply hazard effect to player
  applyHazardEffect(player, hazard) {
    const result = {
      hazardId: hazard.id,
      playerId: player.id,
      hazardType: hazard.effect,
      description: '',
      effects: []
    };

    switch (hazard.effect) {
      case 'slip':
        // Slide in random direction
        const slipDirection = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
        const slipPosition = this.applyPush(player.position, slipDirection);
        player.position = slipPosition;
        player.health = Math.max(0, player.health - 3);
        
        result.description = `${player.playerName} slipped on a banana peel and slid ${slipDirection}!`;
        result.effects = [
          { type: 'position', value: slipPosition },
          { type: 'health', value: -3 }
        ];
        break;
        
      case 'launch':
        // Launch player to random position
        const launchPos = {
          x: Math.floor(Math.random() * 10),
          y: Math.floor(Math.random() * 10)
        };
        player.position = launchPos;
        player.health = Math.max(0, player.health - 8);
        
        result.description = `${player.playerName} was launched by a geyser!`;
        result.effects = [
          { type: 'position', value: launchPos },
          { type: 'health', value: -8 }
        ];
        break;
        
      case 'fall':
        // Fall into pit, health damage
        player.health = Math.max(0, player.health - 15);
        
        result.description = `${player.playerName} fell into a hidden pit!`;
        result.effects = [
          { type: 'health', value: -15 }
        ];
        break;
        
      case 'bounce':
        // Bounce to adjacent cell
        const bounceDirections = ['north', 'south', 'east', 'west'];
        const bounceDirection = bounceDirections[Math.floor(Math.random() * bounceDirections.length)];
        const bouncePosition = this.applyPush(player.position, bounceDirection);
        player.position = bouncePosition;
        
        result.description = `${player.playerName} bounced off a super mushroom!`;
        result.effects = [
          { type: 'position', value: bouncePosition },
          { type: 'health', value: 2 } // Small health bonus
        ];
        break;
    }

    return result;
  }

  // Check if collision creates a viral moment
  isViralMoment(collisionResult) {
    // Viral moments: chain reactions, funny combinations
    if (collisionResult.type === 'push' && collisionResult.effects.length > 0) {
      return true;
    }
    if (collisionResult.type === 'bounce') {
      return true;
    }
    return false;
  }

  // Check if hazard creates viral moment
  isViralHazard(hazardResult) {
    // Hazards that cause unexpected movement are viral
    return ['slip', 'launch', 'bounce'].includes(hazardResult.hazardType);
  }

  // Process chain reactions
  processChainReactions(results, players, gameState) {
    // Look for players pushed into hazards or other players
    results.collisions.forEach(collision => {
      collision.effects.forEach(effect => {
        if (effect.type === 'position') {
          // Check if pushed player hits something else
          const player = players.find(p => p.id === effect.playerId);
          if (player) {
            const hazard = this.checkHazards(effect.value, gameState);
            if (hazard) {
              const chainHazard = this.applyHazardEffect(player, hazard);
              results.hazardEvents.push(chainHazard);
              
              results.viralMoments.push({
                type: 'chain_reaction',
                players: [effect.playerId],
                description: `Chain reaction! ${chainHazard.description}`,
                timestamp: Date.now()
              });
            }
          }
        }
      });
    });
  }

  // Generate highlight moments for streamers
  generateHighlightMoments(physicsResults) {
    const highlights = [];
    
    // Multi-collision moments
    if (physicsResults.collisions.length >= 2) {
      highlights.push({
        type: 'mass_collision',
        priority: 'high',
        description: 'Multiple players collided simultaneously!',
        timestamp: Date.now()
      });
    }
    
    // Chain reaction moments
    physicsResults.viralMoments.forEach(moment => {
      if (moment.type === 'chain_reaction') {
        highlights.push({
          type: 'chain_reaction',
          priority: 'medium',
          description: moment.description,
          timestamp: moment.timestamp
        });
      }
    });
    
    // Comedy hazard moments
    const comedyHazards = physicsResults.hazardEvents.filter(h => 
      ['slip', 'bounce'].includes(h.hazardType)
    );
    
    if (comedyHazards.length > 0) {
      highlights.push({
        type: 'comedy_moment',
        priority: 'medium',
        description: 'Hilarious hazard encounters!',
        timestamp: Date.now(),
        events: comedyHazards
      });
    }
    
    return highlights;
  }

  // Clear old hazards from the grid
  clearOldHazards(gameState, maxAge = 5) {
    if (!gameState.island) return;
    
    const currentTime = Date.now();
    
    gameState.island.forEach(row => {
      row.forEach(cell => {
        if (cell.hazard && (currentTime - cell.hazard.spawnTime) > maxAge * 1000) {
          delete cell.hazard;
        }
      });
    });
  }

  // Add physics data to island grid for visualization
  addPhysicsVisualization(gameState, physicsResults) {
    // Add collision markers
    physicsResults.collisions.forEach(collision => {
      collision.effects.forEach(effect => {
        if (effect.type === 'position') {
          const pos = effect.value;
          if (gameState.island && gameState.island[pos.y] && gameState.island[pos.y][pos.x]) {
            gameState.island[pos.y][pos.x].physicsEffect = {
              type: 'collision',
              timestamp: Date.now()
            };
          }
        }
      });
    });
    
    // Add hazard effect markers
    physicsResults.hazardEvents.forEach(hazardEvent => {
      hazardEvent.effects.forEach(effect => {
        if (effect.type === 'position') {
          const pos = effect.value;
          if (gameState.island && gameState.island[pos.y] && gameState.island[pos.y][pos.x]) {
            gameState.island[pos.y][pos.x].physicsEffect = {
              type: 'hazard',
              hazardType: hazardEvent.hazardType,
              timestamp: Date.now()
            };
          }
        }
      });
    });
  }
}

module.exports = PhysicsSystem;