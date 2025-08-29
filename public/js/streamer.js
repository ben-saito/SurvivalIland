// Streamer Dashboard JavaScript
class StreamerDashboard {
  constructor() {
    this.socket = io();
    this.gameState = null;
    this.isConnected = false;
    this.setupSocketListeners();
    this.setupUIEventListeners();
  }

  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    // Room events
    this.socket.on('room-created', (data) => {
      console.log('Room created:', data);
      this.handleRoomCreated(data);
    });

    this.socket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      this.handlePlayerJoined(data);
    });

    this.socket.on('player-left', (data) => {
      console.log('Player left:', data);
      this.handlePlayerLeft(data);
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
    // Create room button
    document.getElementById('createRoomBtn').addEventListener('click', () => {
      this.createRoom();
    });

    // Game control buttons
    document.getElementById('startGameBtn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('pauseGameBtn').addEventListener('click', () => {
      this.pauseGame();
    });

    document.getElementById('skipRoundBtn').addEventListener('click', () => {
      this.skipRound();
    });

    document.getElementById('endGameBtn').addEventListener('click', () => {
      this.endGame();
    });

    // Enter key support for streamer name
    document.getElementById('streamerName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.createRoom();
      }
    });
  }

  createRoom() {
    const streamerName = document.getElementById('streamerName').value.trim();
    
    if (!streamerName) {
      this.showError('配信者名を入力してください');
      return;
    }

    if (!this.isConnected) {
      this.showError('サーバーに接続できません');
      return;
    }

    this.socket.emit('create-room', { streamerName });
  }

  startGame() {
    if (!this.gameState || this.gameState.status !== 'lobby') {
      this.showError('ゲームを開始できません');
      return;
    }

    this.socket.emit('start-game', {});
  }

  pauseGame() {
    this.socket.emit('streamer-control', { action: 'pause' });
  }

  skipRound() {
    this.socket.emit('streamer-control', { action: 'skip-round' });
  }

  endGame() {
    if (confirm('本当にゲームを終了しますか？')) {
      this.socket.emit('streamer-control', { action: 'end-game' });
    }
  }

  handleRoomCreated(data) {
    this.gameState = data.gameState;
    
    // Update UI
    document.getElementById('createRoomSection').style.display = 'none';
    document.getElementById('gameControlSection').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('roomInfo').style.display = 'flex';
    
    // Display room information
    document.getElementById('roomIdDisplay').textContent = `ルームID: ${data.roomId}`;
    document.getElementById('maxPlayers').textContent = this.gameState.maxPlayers;
    
    // Display QR code
    if (data.qrCode) {
      document.getElementById('qrCodeContainer').innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
    }
    
    // Display mobile URL
    document.getElementById('mobileUrl').textContent = data.mobileUrl;
    
    this.updateGameStateDisplay();
    this.addGameLog('ゲームルームが作成されました');
  }

  handlePlayerJoined(data) {
    document.getElementById('playerCount').textContent = data.playerCount;
    this.addGameLog(`${data.player.playerName} が参加しました (${data.player.animalType})`);
    this.updatePlayerList();
    
    // Enable start button if we have enough players
    if (data.playerCount >= 2) {
      document.getElementById('startGameBtn').disabled = false;
    }
  }

  handlePlayerLeft(data) {
    document.getElementById('playerCount').textContent = data.playerCount;
    this.addGameLog(`プレイヤーが退出しました`);
    this.updatePlayerList();
    
    // Disable start button if not enough players
    if (data.playerCount < 2) {
      document.getElementById('startGameBtn').disabled = true;
    }
  }

  handleGameStarted(data) {
    this.gameState = data.gameState;
    
    // Update control buttons
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('pauseGameBtn').style.display = 'inline-block';
    document.getElementById('skipRoundBtn').style.display = 'inline-block';
    document.getElementById('endGameBtn').style.display = 'inline-block';
    
    this.updateGameStateDisplay();
    this.addGameLog('ゲームが開始されました！');
  }

  handleVotingStart(data) {
    this.gameState.status = 'voting';
    this.gameState.currentRound = data.roundNumber;
    
    document.getElementById('votingSection').style.display = 'block';
    
    // Start countdown timer
    this.startVotingCountdown(data.duration);
    
    // Clear previous voting results
    document.getElementById('votingResults').innerHTML = '';
    
    // Initialize vote counts for each option
    const votingResults = document.getElementById('votingResults');
    data.options.forEach(option => {
      const resultItem = document.createElement('div');
      resultItem.className = 'vote-result-item';
      resultItem.innerHTML = `
        <span>${this.getActionEmoji(option)} ${option}</span>
        <div class="vote-bar">
          <div class="vote-fill" style="width: 0%" data-option="${option}"></div>
        </div>
        <span class="vote-count">0</span>
      `;
      votingResults.appendChild(resultItem);
    });
    
    this.updateGameStateDisplay();
    this.updateIslandDisplay(data.players);
    this.addGameLog(`ラウンド ${data.roundNumber} の投票が開始されました`);
  }

  handleVoteUpdate(data) {
    const totalVotes = data.totalVotes;
    const totalPlayers = data.totalPlayers;
    
    // This is a simple update - in a full implementation, you'd get vote breakdown
    this.addGameLog(`投票状況: ${totalVotes}/${totalPlayers} 人が投票済み`);
  }

  handleVotingEnd(data) {
    this.gameState = data.gameState;
    
    document.getElementById('votingSection').style.display = 'none';
    
    // Update vote results display
    const voteCounts = data.voteCounts;
    Object.entries(voteCounts).forEach(([action, count]) => {
      const voteFill = document.querySelector(`[data-option="${action}"]`);
      const voteCountSpan = voteFill?.parentElement.nextElementSibling;
      
      if (voteFill && voteCountSpan) {
        const maxVotes = Math.max(...Object.values(voteCounts));
        const percentage = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
        
        voteFill.style.width = `${percentage}%`;
        voteCountSpan.textContent = count;
        
        // Highlight winning action
        if (action === data.winningAction) {
          voteFill.style.background = '#48bb78';
          voteFill.parentElement.parentElement.style.background = 'rgba(72, 187, 120, 0.2)';
        }
      }
    });
    
    this.updateGameStateDisplay();
    this.addGameLog(`勝利アクション: ${data.winningAction} (${voteCounts[data.winningAction] || 0} 票)`);
  }

  handleGameEnded(data) {
    this.gameState = data.finalState;
    
    // Update control buttons
    document.getElementById('pauseGameBtn').style.display = 'none';
    document.getElementById('skipRoundBtn').style.display = 'none';
    document.getElementById('endGameBtn').style.display = 'none';
    document.getElementById('startGameBtn').style.display = 'inline-block';
    document.getElementById('startGameBtn').textContent = '新しいゲーム開始';
    
    document.getElementById('votingSection').style.display = 'none';
    
    this.updateGameStateDisplay();
    
    if (data.winner) {
      this.addGameLog(`🎉 勝者: ${data.winner.playerName} (${data.winner.animalType})`);
    } else {
      this.addGameLog('🎮 ゲーム終了 - 勝者なし');
    }
  }

  startVotingCountdown(duration) {
    const countdownEl = document.getElementById('votingCountdown');
    let timeLeft = Math.ceil(duration / 1000);
    
    const updateCountdown = () => {
      countdownEl.textContent = timeLeft;
      
      if (timeLeft <= 3) {
        countdownEl.style.color = '#e53e3e';
        countdownEl.style.animation = 'pulse 0.5s infinite';
      } else {
        countdownEl.style.color = '#ed8936';
        countdownEl.style.animation = 'pulse 1s infinite';
      }
      
      timeLeft--;
      
      if (timeLeft >= 0) {
        setTimeout(updateCountdown, 1000);
      }
    };
    
    updateCountdown();
  }

  updateGameStateDisplay() {
    if (!this.gameState) return;
    
    document.getElementById('gameStatus').textContent = this.getStatusText(this.gameState.status);
    document.getElementById('currentRound').textContent = this.gameState.currentRound;
    document.getElementById('votingStatus').textContent = this.gameState.votingInProgress ? '✅' : '❌';
  }

  updatePlayerList() {
    // This would be implemented with actual player data
    // For now, just update the count
    const playerListContent = document.getElementById('playerListContent');
    if (this.gameState && this.gameState.playerCount !== undefined) {
      // Simple placeholder implementation
      playerListContent.innerHTML = `<p>プレイヤー数: ${this.gameState.playerCount}</p>`;
    }
  }

  updateIslandDisplay(players) {
    const islandGrid = document.getElementById('islandGrid');
    islandGrid.innerHTML = '';
    
    // Create 10x10 grid
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = document.createElement('div');
        cell.className = 'island-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Add any players at this position
        if (players) {
          players.forEach(player => {
            if (player.position.x === x && player.position.y === y) {
              const marker = document.createElement('span');
              marker.className = 'player-marker';
              marker.textContent = this.getAnimalEmoji(player.animalType);
              cell.appendChild(marker);
            }
          });
        }
        
        islandGrid.appendChild(cell);
      }
    }
  }

  addGameLog(message) {
    const gameLog = document.getElementById('gameLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
    
    gameLog.appendChild(logEntry);
    gameLog.scrollTop = gameLog.scrollHeight;
  }

  getStatusText(status) {
    const statusMap = {
      'lobby': '待機中',
      'playing': 'プレイ中',
      'voting': '投票中',
      'ended': '終了'
    };
    return statusMap[status] || status;
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

  updateConnectionStatus(connected) {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
      if (connected) {
        btn.disabled = false;
        btn.style.opacity = '1';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.6';
      }
    });

    if (!connected) {
      this.addGameLog('⚠️ サーバー接続が切断されました。再接続を試行中...');
    } else {
      this.addGameLog('✅ サーバーに接続されました');
    }
  }

  showError(message) {
    // Simple error display - could be enhanced with a modal or toast
    this.addGameLog(`❌ エラー: ${message}`);
    
    // Also show browser alert for critical errors
    if (message.includes('接続') || message.includes('サーバー')) {
      alert(`エラー: ${message}`);
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new StreamerDashboard();
});