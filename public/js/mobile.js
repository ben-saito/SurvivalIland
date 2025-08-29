// Mobile Interface JavaScript for Survival Island Battle
class MobileInterface {
  constructor() {
    this.socket = io();
    this.playerData = null;
    this.gameState = null;
    this.currentSection = 'join';
    this.votingTimer = null;
    this.selectedVote = null;
    this.setupSocketListeners();
    this.setupUIEventListeners();
    this.getRoomIdFromUrl();
  }

  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.updateConnectionStatus(false);
      this.showSection('error');
      document.getElementById('errorMessage').textContent = 'サーバーとの接続が切断されました';
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to server');
      this.updateConnectionStatus(true);
      if (this.playerData && this.playerData.roomId) {
        // Try to rejoin the room
        this.socket.emit('join-room', {
          roomId: this.playerData.roomId,
          playerName: this.playerData.playerName
        });
      }
    });

    // Room events
    this.socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      this.handleJoinedRoom(data);
    });

    this.socket.on('player-joined', (data) => {
      this.handlePlayerCountUpdate(data.playerCount);
    });

    this.socket.on('player-left', (data) => {
      this.handlePlayerCountUpdate(data.playerCount);
    });

    // Game events
    this.socket.on('game-started', (data) => {
      console.log('Game started:', data);
      this.handleGameStarted(data);
    });

    this.socket.on('voting-start', (data) => {
      console.log('Voting started:', data);
      this.handleVotingStart(data);
    });

    this.socket.on('vote-confirmed', (data) => {
      this.handleVoteConfirmed(data);
    });

    this.socket.on('vote-update', (data) => {
      this.handleVoteUpdate(data);
    });

    this.socket.on('voting-end', (data) => {
      console.log('Voting ended:', data);
      this.handleVotingEnd(data);
    });

    this.socket.on('game-ended', (data) => {
      console.log('Game ended:', data);
      this.handleGameEnded(data);
    });

    // Error events
    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
      this.showError(data.message);
    });
  }

  setupUIEventListeners() {
    // Join game button
    document.getElementById('joinGameBtn').addEventListener('click', () => {
      this.joinGame();
    });

    // Player name input enter key
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinGame();
      }
    });

    // Vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.castVote(action);
      });
    });

    // Play again button
    document.getElementById('playAgainBtn').addEventListener('click', () => {
      this.showSection('join');
      this.resetPlayerData();
    });

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
      if (this.playerData && this.playerData.roomId) {
        this.socket.emit('join-room', {
          roomId: this.playerData.roomId,
          playerName: this.playerData.playerName
        });
      } else {
        this.showSection('join');
      }
    });

    // Prevent zooming on double tap for vote buttons
    this.preventZoomOnDoubleTap();
    
    // Add haptic feedback for mobile devices
    this.addHapticFeedback();
  }

  getRoomIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    this.roomId = pathParts[pathParts.length - 1];
    
    if (this.roomId && this.roomId.length === 6) {
      // Auto-populate if we have a room ID from URL
      console.log('Room ID from URL:', this.roomId);
    }
  }

  joinGame() {
    const roomIdInput = document.getElementById('roomIdInput').value.trim().toUpperCase();
    const playerName = document.getElementById('playerNameInput').value.trim();
    
    if (!roomIdInput) {
      this.showError('ルームIDを入力してください');
      return;
    }
    
    if (roomIdInput.length !== 6) {
      this.showError('ルームIDは6文字で入力してください');
      return;
    }
    
    if (!playerName) {
      this.showError('プレイヤー名を入力してください');
      return;
    }

    if (playerName.length > 20) {
      this.showError('プレイヤー名は20文字以内で入力してください');
      return;
    }

    // Set room ID from input
    this.roomId = roomIdInput;

    // Store player data
    this.playerData = {
      roomId: this.roomId,
      playerName: playerName
    };

    console.log('Joining room:', this.roomId, 'as player:', playerName);

    // Emit join room event
    this.socket.emit('join-room', {
      roomId: this.roomId,
      playerName: playerName,
      isStreamer: false
    });
  }

  castVote(action) {
    if (this.currentSection !== 'voting' || this.selectedVote) {
      return; // Voting not active or already voted
    }

    this.selectedVote = action;
    
    // Update UI to show selected vote
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.disabled = true;
      btn.classList.remove('selected');
    });
    
    const selectedBtn = document.querySelector(`[data-action="${action}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('selected');
    }

    // Emit vote
    this.socket.emit('cast-vote', { action });
  }

  handleJoinedRoom(data) {
    this.playerData = { ...this.playerData, ...data.playerData };
    this.gameState = data.gameState;
    
    // Update player info display
    document.getElementById('animalEmoji').textContent = this.getAnimalEmoji(this.playerData.animalType);
    document.getElementById('playerName').textContent = this.playerData.playerName;
    this.updateHealthBar(this.playerData.health);
    
    // Show player info header
    document.getElementById('playerInfo').style.display = 'flex';
    
    // Show waiting section
    this.showSection('waiting');
    this.handlePlayerCountUpdate(data.gameState.playerCount);
  }

  handlePlayerCountUpdate(count) {
    document.getElementById('waitingPlayerCount').textContent = `プレイヤー数: ${count}`;
  }

  handleGameStarted(data) {
    this.gameState = data.gameState;
    // Game will start with first voting round shortly
    // No immediate UI change needed
  }

  handleVotingStart(data) {
    this.selectedVote = null;
    this.showSection('voting');
    
    // Update total players for vote progress
    document.getElementById('totalPlayers').textContent = data.players.length;
    document.getElementById('voteCount').textContent = '0';
    
    // Hide vote confirmation
    document.getElementById('voteConfirmation').style.display = 'none';
    
    // Check if this is an event round
    if (data.isEvent) {
      this.setupEventVoting(data);
    } else {
      this.setupNormalVoting(data);
    }
    
    // Enable all vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('selected');
    });
    
    // Start timer
    this.startVotingTimer(data.duration);
  }

  handleVoteConfirmed(data) {
    // Show vote confirmation
    document.getElementById('voteConfirmation').style.display = 'block';
    document.getElementById('selectedAction').textContent = this.getActionText(data.action);
  }

  handleVoteUpdate(data) {
    document.getElementById('voteCount').textContent = data.totalVotes;
  }

  handleVotingEnd(data) {
    this.clearVotingTimer();
    this.showSection('results');
    
    // Check if this was an event round
    if (data.isEvent) {
      // Display event results
      document.querySelector('.results-content h2').textContent = 'イベント結果';
      document.getElementById('winningActionDisplay').textContent = this.getActionText(data.winningAction);
      
      // Display event messages if available
      if (data.messages && data.messages.length > 0) {
        const breakdown = document.getElementById('voteBreakdown');
        breakdown.innerHTML = '';
        
        // Create messages display
        data.messages.forEach(message => {
          const messageItem = document.createElement('div');
          messageItem.className = 'event-message-item';
          messageItem.style.padding = '8px 12px';
          messageItem.style.margin = '5px 0';
          messageItem.style.background = 'rgba(255, 255, 255, 0.1)';
          messageItem.style.borderRadius = '6px';
          messageItem.style.fontSize = '0.9rem';
          messageItem.textContent = message;
          breakdown.appendChild(messageItem);
        });
        
        // Add vote breakdown after messages
        const voteTitle = document.createElement('h4');
        voteTitle.textContent = '投票結果:';
        voteTitle.style.marginTop = '15px';
        voteTitle.style.marginBottom = '10px';
        breakdown.appendChild(voteTitle);
      }
    } else {
      // Normal round results - check for physics/viral moments
      document.querySelector('.results-content h2').textContent = 'ラウンド結果';
      document.getElementById('winningActionDisplay').textContent = this.getActionText(data.winningAction);
      
      // Display physics/viral moments if available
      if (data.physicsResults || data.highlights) {
        this.displayPhysicsResults(data);
      }
    }
    
    // Display vote breakdown
    const breakdown = document.getElementById('voteBreakdown');
    if (!data.isEvent || !data.messages || data.messages.length === 0) {
      breakdown.innerHTML = '';
    }
    
    Object.entries(data.voteCounts).forEach(([action, count]) => {
      const item = document.createElement('div');
      item.className = 'vote-breakdown-item';
      item.innerHTML = `
        <span>${this.getActionEmoji(action)} ${this.getActionText(action)}</span>
        <strong>${count} 票</strong>
      `;
      
      if (action === data.winningAction) {
        item.style.background = 'rgba(72, 187, 120, 0.3)';
        item.style.borderLeft = '4px solid #48bb78';
      }
      
      breakdown.appendChild(item);
    });

    // Update player health if available
    if (data.gameState && this.playerData) {
      // In a full implementation, you'd get updated player data here
      this.updateHealthBar(this.playerData.health);
    }
    
    // Automatically return to voting after longer delay for events
    const delay = data.isEvent ? 8000 : 5000;
    setTimeout(() => {
      if (this.currentSection === 'results') {
        this.showSection('waiting'); // Wait for next voting round
      }
    }, delay);
  }

  handleGameEnded(data) {
    this.clearVotingTimer();
    this.showSection('gameEnd');
    
    // Display winner
    const winnerDisplay = document.getElementById('winnerDisplay');
    if (data.winner) {
      winnerDisplay.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 10px;">
          ${this.getAnimalEmoji(data.winner.animalType)}
        </div>
        <div style="font-size: 1.5rem;">
          🏆 勝者: ${data.winner.playerName}
        </div>
      `;
      
      // Check if current player won
      if (data.winner.id === this.playerData.id) {
        winnerDisplay.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4a 100%)';
        winnerDisplay.style.color = '#2d3748';
      }
    } else {
      winnerDisplay.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 10px;">🏝️</div>
        <div style="font-size: 1.5rem;">勝者なし</div>
      `;
    }
    
    // Display final stats
    const finalStats = document.getElementById('finalStats');
    finalStats.innerHTML = `
      <div>参加プレイヤー数: ${data.finalState.playerCount}</div>
      <div>総ラウンド数: ${data.finalState.currentRound}</div>
    `;
  }

  startVotingTimer(duration) {
    let timeLeft = Math.ceil(duration / 1000);
    const timerEl = document.getElementById('votingTimer');
    
    const updateTimer = () => {
      timerEl.textContent = timeLeft;
      
      // Change color as time runs out
      if (timeLeft <= 3) {
        timerEl.style.background = 'rgba(245, 101, 101, 0.9)';
        timerEl.style.borderColor = '#f56565';
      } else if (timeLeft <= 5) {
        timerEl.style.background = 'rgba(237, 137, 54, 0.9)';
        timerEl.style.borderColor = '#ed8936';
      }
      
      timeLeft--;
      
      if (timeLeft >= 0) {
        this.votingTimer = setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  }

  clearVotingTimer() {
    if (this.votingTimer) {
      clearTimeout(this.votingTimer);
      this.votingTimer = null;
    }
  }

  updateHealthBar(health) {
    const healthBar = document.getElementById('healthBar');
    const healthText = document.getElementById('healthText');
    const maxHealth = 100;
    
    const percentage = Math.max(0, (health / maxHealth) * 100);
    healthBar.style.width = `${percentage}%`;
    healthText.textContent = `${health}/${maxHealth}`;
    
    // Change color based on health level
    if (percentage > 60) {
      healthBar.style.background = 'linear-gradient(90deg, #48bb78 0%, #38a169 100%)';
    } else if (percentage > 30) {
      healthBar.style.background = 'linear-gradient(90deg, #ed8936 0%, #dd6b20 100%)';
    } else {
      healthBar.style.background = 'linear-gradient(90deg, #f56565 0%, #e53e3e 100%)';
    }
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
      targetSection.style.display = 'flex';
      this.currentSection = sectionName;
    }
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    this.showSection('error');
  }

  updateConnectionStatus(connected) {
    if (!connected && this.currentSection !== 'error') {
      this.showError('サーバーとの接続が失われました');
    }
  }

  resetPlayerData() {
    this.playerData = null;
    this.gameState = null;
    this.selectedVote = null;
    this.clearVotingTimer();
    document.getElementById('playerInfo').style.display = 'none';
    document.getElementById('playerNameInput').value = '';
  }

  getAnimalEmoji(animalType) {
    const animalMap = {
      'bear': '🐻',
      'fox': '🦊',
      'rabbit': '🐰',
      'deer': '🦌',
      'wolf': '🐺',
      'cat': '🐱',
      'dog': '🐶',
      'panda': '🐼',
      'lion': '🦁',
      'tiger': '🐯'
    };
    return animalMap[animalType] || '🐻';
  }

  getActionEmoji(action) {
    const emojiMap = {
      'north': '⬆️',
      'south': '⬇️',
      'east': '➡️',
      'west': '⬅️',
      'collect': '🥕',
      'build': '🏠'
    };
    return emojiMap[action] || '❓';
  }

  getActionText(action) {
    const textMap = {
      'north': '北',
      'south': '南',
      'east': '東',
      'west': '西',
      'collect': '収集',
      'build': '建設'
    };
    return textMap[action] || action;
  }

  preventZoomOnDoubleTap() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  setupEventVoting(data) {
    // Update header for event
    const votingHeader = document.querySelector('.voting-header h2');
    if (data.event) {
      votingHeader.textContent = `${data.event.title}`;
      
      // Add event description
      let descElement = document.getElementById('eventDescription');
      if (!descElement) {
        descElement = document.createElement('p');
        descElement.id = 'eventDescription';
        descElement.style.textAlign = 'center';
        descElement.style.margin = '10px 0';
        descElement.style.fontSize = '1rem';
        descElement.style.background = 'rgba(255, 255, 255, 0.2)';
        descElement.style.padding = '10px';
        descElement.style.borderRadius = '10px';
        votingHeader.after(descElement);
      }
      descElement.textContent = data.event.description;
    }
    
    // Hide normal movement controls
    document.querySelector('.movement-grid').style.display = 'none';
    
    // Show event options in action buttons area
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = '';
    
    data.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'vote-btn action-btn';
      btn.dataset.action = option.id;
      btn.innerHTML = `${option.emoji}<br>${option.name}`;
      actionButtons.appendChild(btn);
      
      // Add event listener
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.castVote(action);
      });
    });
  }

  setupNormalVoting(data) {
    // Reset to normal voting interface
    const votingHeader = document.querySelector('.voting-header h2');
    votingHeader.textContent = '投票してください！';
    
    // Remove event description if it exists
    const descElement = document.getElementById('eventDescription');
    if (descElement) {
      descElement.remove();
    }
    
    // Show normal movement controls
    document.querySelector('.movement-grid').style.display = 'block';
    
    // Reset action buttons to normal
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = `
      <button class="vote-btn action-btn" data-action="collect">
        🥕<br>収集
      </button>
      <button class="vote-btn action-btn" data-action="build">
        🏠<br>建設
      </button>
    `;
    
    // Re-add event listeners for action buttons
    actionButtons.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.castVote(action);
      });
    });
  }

  displayPhysicsResults(data) {
    const breakdown = document.getElementById('voteBreakdown');
    
    // Clear existing content
    breakdown.innerHTML = '';
    
    // Display viral moments first
    if (data.highlights && data.highlights.length > 0) {
      const highlightTitle = document.createElement('h4');
      highlightTitle.textContent = '🎬 ハイライト:';
      highlightTitle.style.marginBottom = '10px';
      highlightTitle.style.color = '#ffd700';
      breakdown.appendChild(highlightTitle);
      
      data.highlights.forEach(highlight => {
        const highlightItem = document.createElement('div');
        highlightItem.className = 'highlight-item';
        highlightItem.style.padding = '8px 12px';
        highlightItem.style.margin = '5px 0';
        highlightItem.style.background = 'rgba(255, 215, 0, 0.2)';
        highlightItem.style.borderLeft = '4px solid #ffd700';
        highlightItem.style.borderRadius = '6px';
        highlightItem.style.fontSize = '0.9rem';
        
        let emoji = '🎉';
        if (highlight.type === 'mass_collision') emoji = '💥';
        else if (highlight.type === 'chain_reaction') emoji = '⚡';
        else if (highlight.type === 'comedy_moment') emoji = '😂';
        
        highlightItem.innerHTML = `${emoji} ${highlight.description}`;
        breakdown.appendChild(highlightItem);
      });
    }
    
    // Display physics results
    if (data.physicsResults) {
      const physicsTitle = document.createElement('h4');
      physicsTitle.textContent = '⚡ 物理効果:';
      physicsTitle.style.marginTop = '15px';
      physicsTitle.style.marginBottom = '10px';
      breakdown.appendChild(physicsTitle);
      
      // Display collisions
      if (data.physicsResults.collisions && data.physicsResults.collisions.length > 0) {
        data.physicsResults.collisions.forEach(collision => {
          const collisionItem = document.createElement('div');
          collisionItem.className = 'physics-item';
          collisionItem.style.padding = '6px 10px';
          collisionItem.style.margin = '3px 0';
          collisionItem.style.background = 'rgba(255, 255, 255, 0.1)';
          collisionItem.style.borderRadius = '4px';
          collisionItem.style.fontSize = '0.85rem';
          collisionItem.innerHTML = `💥 ${collision.description}`;
          breakdown.appendChild(collisionItem);
        });
      }
      
      // Display hazard events
      if (data.physicsResults.hazardEvents && data.physicsResults.hazardEvents.length > 0) {
        data.physicsResults.hazardEvents.forEach(hazard => {
          const hazardItem = document.createElement('div');
          hazardItem.className = 'physics-item';
          hazardItem.style.padding = '6px 10px';
          hazardItem.style.margin = '3px 0';
          hazardItem.style.background = 'rgba(255, 255, 255, 0.1)';
          hazardItem.style.borderRadius = '4px';
          hazardItem.style.fontSize = '0.85rem';
          
          let emoji = '⚠️';
          if (hazard.hazardType === 'slip') emoji = '🍌';
          else if (hazard.hazardType === 'launch') emoji = '💧';
          else if (hazard.hazardType === 'fall') emoji = '🕳️';
          else if (hazard.hazardType === 'bounce') emoji = '🍄';
          
          hazardItem.innerHTML = `${emoji} ${hazard.description}`;
          breakdown.appendChild(hazardItem);
        });
      }
    }
  }

  addHapticFeedback() {
    // Add haptic feedback for mobile devices if available
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('touchstart', () => {
        if (navigator.vibrate) {
          navigator.vibrate(50); // 50ms vibration
        }
      });
    });
  }
}

// Initialize mobile interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MobileInterface();
});