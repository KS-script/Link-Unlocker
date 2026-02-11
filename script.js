// Particle effect
function createParticles() {
    const container = document.getElementById('particleContainer');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = 15 + Math.random() * 10 + 's';
        container.appendChild(particle);
    }
}

// Initialize particles
createParticles();

// Track completion status
let steps = {
    subscribe: false,
    like: false
};

// Check localStorage for previous actions
function checkPreviousActions() {
    const subscribed = localStorage.getItem('ks_subscribed');
    const liked = localStorage.getItem('ks_liked');
    
    if (subscribed === 'true') {
        steps.subscribe = true;
        updateStepStatus(1, true);
    }
    
    if (liked === 'true') {
        steps.like = true;
        updateStepStatus(2, true);
    }
    
    checkAllStepsCompleted();
}

// Update step status UI
function updateStepStatus(stepNumber, completed) {
    const stepCard = document.querySelector(`[data-step="${stepNumber}"]`);
    const stepStatus = document.getElementById(`step${stepNumber}Status`);
    
    if (completed) {
        stepCard.classList.add('completed');
        stepStatus.classList.add('active');
    }
}

// Check if all steps are completed
function checkAllStepsCompleted() {
    if (steps.subscribe && steps.like) {
        const unlockBtn = document.getElementById('unlockBtn');
        const unlockHint = document.getElementById('unlockHint');
        
        unlockBtn.disabled = false;
        unlockHint.textContent = '✨ Script is ready! Click to get it';
        unlockHint.style.color = '#667eea';
    }
}

// Subscribe button click handler
document.getElementById('subscribeBtn').addEventListener('click', function() {
    // Open YouTube subscribe link
    window.open('https://www.youtube.com/@KS_SCRIPT_Owner?sub_confirmation=1', '_blank');
    
    // Mark as completed after a delay (simulating user action)
    setTimeout(() => {
        steps.subscribe = true;
        localStorage.setItem('ks_subscribed', 'true');
        updateStepStatus(1, true);
        checkAllStepsCompleted();
        
        // Show success animation
        this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Subscribed';
        this.style.background = '#4CAF50';
        this.disabled = true;
    }, 3000);
});

// Like button click handler
document.getElementById('likeBtn').addEventListener('click', function() {
    // Open YouTube video link
    window.open('https://www.youtube.com/shorts/bGm4dt_Isrk', '_blank');
    
    // Mark as completed after a delay (simulating user action)
    setTimeout(() => {
        steps.like = true;
        localStorage.setItem('ks_liked', 'true');
        updateStepStatus(2, true);
        checkAllStepsCompleted();
        
        // Show success animation
        this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Liked';
        this.style.background = '#4CAF50';
        this.disabled = true;
    }, 3000);
});

// Unlock button click handler
document.getElementById('unlockBtn').addEventListener('click', function() {
    if (!this.disabled) {
        // Redirect to KS Script website
        window.location.href = 'https://ks-script.github.io/KS.WEB/';
    }
});

// Check previous actions on page load
checkPreviousActions();

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
