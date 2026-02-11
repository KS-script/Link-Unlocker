// Initialize state
let subscribeClicked = false;
let likeClicked = false;

// DOM Elements
const subscribeBtn = document.getElementById('subscribeBtn');
const likeBtn = document.getElementById('likeBtn');
const unlockBtn = document.getElementById('unlockBtn');
const progressFill = document.getElementById('progressFill');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const status1 = document.getElementById('status1');
const status2 = document.getElementById('status2');

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Update progress
function updateProgress() {
    let progress = 0;
    if (subscribeClicked) progress += 50;
    if (likeClicked) progress += 50;
    
    progressFill.style.width = progress + '%';
    
    // Check if both actions are completed
    if (subscribeClicked && likeClicked) {
        unlockBtn.disabled = false;
        unlockBtn.classList.add('active');
        unlockBtn.innerHTML = `
            <span class="unlock-text">
                <i class="fas fa-unlock"></i>
                Get Script Now
            </span>
            <div class="unlock-glow"></div>
        `;
    }
}

// Subscribe button click
subscribeBtn.addEventListener('click', () => {
    // Open YouTube subscribe link
    window.open('https://www.youtube.com/@KS_SCRIPT_Owner?sub_confirmation=1', '_blank');
    
    // Update UI after delay (simulate user action)
    setTimeout(() => {
        subscribeClicked = true;
        step1.classList.add('completed');
        status1.innerHTML = '<i class="fas fa-check-circle"></i>';
        subscribeBtn.disabled = true;
        subscribeBtn.style.opacity = '0.6';
        subscribeBtn.innerHTML = '<i class="fas fa-check"></i> Subscribed';
        updateProgress();
    }, 1500);
});

// Like button click
likeBtn.addEventListener('click', () => {
    // Open YouTube video link
    window.open('https://www.youtube.com/shorts/bGm4dt_Isrk', '_blank');
    
    // Update UI after delay (simulate user action)
    setTimeout(() => {
        likeClicked = true;
        step2.classList.add('completed');
        status2.innerHTML = '<i class="fas fa-check-circle"></i>';
        likeBtn.disabled = true;
        likeBtn.style.opacity = '0.6';
        likeBtn.innerHTML = '<i class="fas fa-check"></i> Liked';
        updateProgress();
    }, 1500);
});

// Unlock button click
unlockBtn.addEventListener('click', () => {
    if (subscribeClicked && likeClicked) {
        // Add loading animation
        unlockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'https://ks-script.github.io/KS.WEB/';
        }, 1000);
    }
});

// Initialize particles on load
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'S' to trigger subscribe
    if (e.key === 's' || e.key === 'S') {
        if (!subscribeClicked) {
            subscribeBtn.click();
        }
    }
    // Press 'L' to trigger like
    if (e.key === 'l' || e.key === 'L') {
        if (!likeClicked) {
            likeBtn.click();
        }
    }
    // Press 'Enter' to unlock if available
    if (e.key === 'Enter') {
        if (subscribeClicked && likeClicked && !unlockBtn.disabled) {
            unlockBtn.click();
        }
    }
});

// Add visual feedback for button hover
[subscribeBtn, likeBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (!btn.disabled) {
            btn.style.transform = 'scale(1.05)';
        }
    });
    
    btn.addEventListener('mouseleave', () => {
        if (!btn.disabled) {
            btn.style.transform = 'scale(1)';
        }
    });
});

// Check for returning users (optional feature)
function checkReturningUser() {
    const visited = localStorage.getItem('linkUnlockerVisited');
    if (visited) {
        // Show welcome back message
        console.log('Welcome back to LinkUnlocker!');
    }
    localStorage.setItem('linkUnlockerVisited', 'true');
}

checkReturningUser();

// Add smooth scroll for mobile
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
