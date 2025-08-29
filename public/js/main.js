// Main page JavaScript for Survival Island Battle
document.addEventListener('DOMContentLoaded', function() {
  const streamerBtn = document.getElementById('streamerBtn');
  const joinBtn = document.getElementById('joinBtn');
  const roomIdInput = document.getElementById('roomIdInput');

  // Handle streamer button click
  streamerBtn.addEventListener('click', function() {
    // Redirect to streamer dashboard
    window.location.href = '/streamer';
  });

  // Handle join game button click
  joinBtn.addEventListener('click', function() {
    const roomId = roomIdInput.value.trim().toUpperCase();
    
    if (!roomId) {
      alert('ルームIDを入力してください');
      return;
    }
    
    if (roomId.length !== 6) {
      alert('ルームIDは6文字で入力してください');
      return;
    }
    
    // Redirect to mobile interface
    window.location.href = `/mobile/${roomId}`;
  });

  // Handle Enter key press in room ID input
  roomIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });

  // Auto-uppercase room ID input
  roomIdInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
  });

  // Add some visual feedback for button interactions
  function addButtonFeedback() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      button.addEventListener('mousedown', function() {
        this.style.transform = 'translateY(2px)';
      });
      
      button.addEventListener('mouseup', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  }

  addButtonFeedback();

  // Add some animations for better UX
  function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    });

    const animatedElements = document.querySelectorAll('.feature-card');
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  animateOnScroll();

  // Add mobile detection and appropriate messaging
  function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Add mobile-specific messaging or functionality
      const joinSection = document.querySelector('.join-section');
      if (joinSection) {
        const mobileHint = document.createElement('p');
        mobileHint.style.marginTop = '15px';
        mobileHint.style.fontSize = '0.9rem';
        mobileHint.style.opacity = '0.8';
        mobileHint.textContent = '📱 モバイル端末からの参加が推奨されます';
        joinSection.appendChild(mobileHint);
      }
    }
  }

  detectMobile();
});