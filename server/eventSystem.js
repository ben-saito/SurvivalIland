// Random Event System for Survival Island Battle
class EventSystem {
  constructor() {
    this.eventTypes = [
      {
        id: 'storm',
        name: 'Storm',
        emoji: '⛈️',
        description: 'A fierce storm approaches!',
        probability: 0.3,
        options: [
          { id: 'shelter', name: '避難', emoji: '🏠', effect: 'protection' },
          { id: 'brave', name: '立ち向かう', emoji: '💪', effect: 'risk' }
        ]
      },
      {
        id: 'wildlife',
        name: 'Wild Animal',
        emoji: '🐻',
        description: 'A wild bear blocks the path!',
        probability: 0.25,
        options: [
          { id: 'fight', name: '戦う', emoji: '⚔️', effect: 'combat' },
          { id: 'flee', name: '逃げる', emoji: '💨', effect: 'escape' }
        ]
      },
      {
        id: 'treasure',
        name: 'Treasure Discovery',
        emoji: '💎',
        description: 'Mysterious treasure appears!',
        probability: 0.2,
        options: [
          { id: 'take', name: '取る', emoji: '✋', effect: 'reward' },
          { id: 'ignore', name: '無視', emoji: '🚶', effect: 'safe' }
        ]
      },
      {
        id: 'quicksand',
        name: 'Quicksand Trap',
        emoji: '🕳️',
        description: 'Players are stuck in quicksand!',
        probability: 0.15,
        options: [
          { id: 'help', name: '助ける', emoji: '🤝', effect: 'teamwork' },
          { id: 'abandon', name: '見捨てる', emoji: '👋', effect: 'selfish' }
        ]
      },
      {
        id: 'geyser',
        name: 'Hot Geyser',
        emoji: '💧',
        description: 'A hot geyser erupts nearby!',
        probability: 0.1,
        options: [
          { id: 'dodge', name: '避ける', emoji: '🏃', effect: 'agility' },
          { id: 'endure', name: '耐える', emoji: '🛡️', effect: 'endurance' }
        ]
      }
    ];
  }

  // Check if an event should occur this round
  shouldTriggerEvent(roundNumber, playerCount) {
    // Events become more frequent as game progresses
    const baseChance = 0.15 + (roundNumber * 0.02);
    const playerFactor = Math.min(playerCount / 10, 1.5); // More players = more chaos
    
    return Math.random() < (baseChance * playerFactor);
  }

  // Select a random event
  selectRandomEvent() {
    // Weight events by probability
    const weightedEvents = [];
    this.eventTypes.forEach(event => {
      const weight = Math.floor(event.probability * 100);
      for (let i = 0; i < weight; i++) {
        weightedEvents.push(event);
      }
    });
    
    return weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
  }

  // Create event data for the round
  createEventRound(roundNumber, players) {
    const event = this.selectRandomEvent();
    
    return {
      eventId: `${event.id}_${roundNumber}_${Date.now()}`,
      eventType: event.id,
      name: event.name,
      emoji: event.emoji,
      description: event.description,
      options: event.options,
      roundNumber,
      affectedPlayers: this.selectAffectedPlayers(players, event),
      createdAt: Date.now()
    };
  }

  // Select which players are affected by the event
  selectAffectedPlayers(players, event) {
    const alivePlayers = players.filter(p => p.isAlive);
    
    switch (event.id) {
      case 'storm':
        // Storm affects everyone
        return alivePlayers.map(p => p.id);
        
      case 'wildlife':
        // Wildlife encounters affect 1-3 random players
        const encounterCount = Math.min(3, Math.max(1, Math.floor(alivePlayers.length / 4)));
        return this.shuffleArray(alivePlayers.slice()).slice(0, encounterCount).map(p => p.id);
        
      case 'treasure':
        // Treasure can be found by 1-2 players
        const treasureCount = Math.min(2, Math.max(1, Math.floor(alivePlayers.length / 8)));
        return this.shuffleArray(alivePlayers.slice()).slice(0, treasureCount).map(p => p.id);
        
      case 'quicksand':
        // Quicksand affects players in the same area
        const trapCount = Math.min(4, Math.max(1, Math.floor(alivePlayers.length / 6)));
        return this.shuffleArray(alivePlayers.slice()).slice(0, trapCount).map(p => p.id);
        
      case 'geyser':
        // Geyser affects nearby players
        const geyserCount = Math.min(3, Math.max(1, Math.floor(alivePlayers.length / 7)));
        return this.shuffleArray(alivePlayers.slice()).slice(0, geyserCount).map(p => p.id);
        
      default:
        return [alivePlayers[Math.floor(Math.random() * alivePlayers.length)]?.id].filter(Boolean);
    }
  }

  // Process event results based on votes
  processEventResults(eventData, votes, players) {
    const results = {
      eventId: eventData.eventId,
      winningChoice: null,
      effects: [],
      messages: []
    };

    // Tally votes
    const voteCounts = {};
    eventData.options.forEach(option => {
      voteCounts[option.id] = 0;
    });

    votes.forEach(vote => {
      if (voteCounts.hasOwnProperty(vote.choice)) {
        voteCounts[vote.choice]++;
      }
    });

    // Find winning choice
    let maxVotes = 0;
    let winningChoices = [];
    
    Object.entries(voteCounts).forEach(([choice, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningChoices = [choice];
      } else if (count === maxVotes) {
        winningChoices.push(choice);
      }
    });

    // Random selection if tie
    results.winningChoice = winningChoices[Math.floor(Math.random() * winningChoices.length)];

    // Apply effects based on winning choice and event type
    const effects = this.calculateEventEffects(eventData, results.winningChoice, players);
    results.effects = effects.effects;
    results.messages = effects.messages;

    return results;
  }

  // Calculate effects of event outcome
  calculateEventEffects(eventData, winningChoice, players) {
    const effects = [];
    const messages = [];
    const affectedPlayers = players.filter(p => eventData.affectedPlayers.includes(p.id));

    switch (eventData.eventType) {
      case 'storm':
        if (winningChoice === 'shelter') {
          // Players with shelter are protected
          affectedPlayers.forEach(player => {
            if (player.inventory.shelter) {
              effects.push({ playerId: player.id, type: 'health', value: 0 });
              messages.push(`${player.playerName} はシェルターで嵐をやり過ごした`);
            } else {
              effects.push({ playerId: player.id, type: 'health', value: -15 });
              messages.push(`${player.playerName} は嵐でダメージを受けた`);
            }
          });
        } else { // brave
          // Brave players take damage but might find resources
          affectedPlayers.forEach(player => {
            effects.push({ playerId: player.id, type: 'health', value: -10 });
            if (Math.random() < 0.3) {
              const resource = ['food', 'wood'][Math.floor(Math.random() * 2)];
              effects.push({ playerId: player.id, type: 'resource', resource, value: 2 });
              messages.push(`${player.playerName} は嵐の中で${resource}を発見した`);
            } else {
              messages.push(`${player.playerName} は嵐に立ち向かったがダメージを受けた`);
            }
          });
        }
        break;

      case 'wildlife':
        if (winningChoice === 'fight') {
          affectedPlayers.forEach(player => {
            if (player.inventory.weapon) {
              effects.push({ playerId: player.id, type: 'health', value: -5 });
              effects.push({ playerId: player.id, type: 'resource', resource: 'food', value: 3 });
              messages.push(`${player.playerName} は武器で野生動物を倒し、食料を得た`);
            } else {
              effects.push({ playerId: player.id, type: 'health', value: -25 });
              messages.push(`${player.playerName} は素手で戦い大ダメージを受けた`);
            }
          });
        } else { // flee
          affectedPlayers.forEach(player => {
            effects.push({ playerId: player.id, type: 'health', value: -5 });
            // Move player to random safe position
            effects.push({ playerId: player.id, type: 'move', x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) });
            messages.push(`${player.playerName} は逃げて安全な場所に移動した`);
          });
        }
        break;

      case 'treasure':
        if (winningChoice === 'take') {
          affectedPlayers.forEach(player => {
            if (Math.random() < 0.7) {
              const treasures = ['weapon', 'food', 'wood'];
              const treasure = treasures[Math.floor(Math.random() * treasures.length)];
              effects.push({ playerId: player.id, type: 'resource', resource: treasure, value: 2 });
              messages.push(`${player.playerName} は${treasure}を発見した！`);
            } else {
              effects.push({ playerId: player.id, type: 'health', value: -10 });
              messages.push(`${player.playerName} は罠にかかってダメージを受けた`);
            }
          });
        } else { // ignore
          messages.push('プレイヤーたちは宝物を無視して安全を選んだ');
        }
        break;

      case 'quicksand':
        if (winningChoice === 'help') {
          // All affected players are saved, teamwork bonus
          affectedPlayers.forEach(player => {
            effects.push({ playerId: player.id, type: 'health', value: 5 });
            messages.push(`${player.playerName} はチームワークで救出された`);
          });
        } else { // abandon
          // Some players escape, others take damage
          affectedPlayers.forEach(player => {
            if (Math.random() < 0.5) {
              effects.push({ playerId: player.id, type: 'health', value: -20 });
              messages.push(`${player.playerName} は見捨てられダメージを受けた`);
            } else {
              messages.push(`${player.playerName} は自力で脱出した`);
            }
          });
        }
        break;

      case 'geyser':
        if (winningChoice === 'dodge') {
          affectedPlayers.forEach(player => {
            if (Math.random() < 0.8) {
              messages.push(`${player.playerName} は巧みに間欠泉を避けた`);
            } else {
              effects.push({ playerId: player.id, type: 'health', value: -10 });
              messages.push(`${player.playerName} は避けきれずダメージを受けた`);
            }
          });
        } else { // endure
          affectedPlayers.forEach(player => {
            effects.push({ playerId: player.id, type: 'health', value: -15 });
            effects.push({ playerId: player.id, type: 'health_regen', value: 2 }); // Temporary boost next round
            messages.push(`${player.playerName} は耐え抜き、精神力が向上した`);
          });
        }
        break;
    }

    return { effects, messages };
  }

  // Apply effects to players
  applyEffectsToPlayers(effects, players) {
    const playerMap = new Map(players.map(p => [p.id, p]));
    
    effects.forEach(effect => {
      const player = playerMap.get(effect.playerId);
      if (!player) return;

      switch (effect.type) {
        case 'health':
          player.health = Math.max(0, Math.min(100, player.health + effect.value));
          if (player.health <= 0) {
            player.isAlive = false;
          }
          break;
          
        case 'resource':
          if (!player.inventory[effect.resource]) {
            player.inventory[effect.resource] = 0;
          }
          player.inventory[effect.resource] += effect.value;
          break;
          
        case 'move':
          player.position.x = effect.x;
          player.position.y = effect.y;
          break;
          
        case 'health_regen':
          player.tempBonus = player.tempBonus || {};
          player.tempBonus.healthRegen = effect.value;
          break;
      }
    });
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Get event description for UI
  getEventDescription(eventData) {
    return {
      title: `${eventData.emoji} ${eventData.name}`,
      description: eventData.description,
      affectedCount: eventData.affectedPlayers.length
    };
  }
}

module.exports = EventSystem;