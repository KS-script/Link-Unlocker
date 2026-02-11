// ============================================
// Configuration
// ============================================
const CONFIG = {
    links: {
        youtube: 'https://www.youtube.com/@KS_SCRIPT_Owner?sub_confirmation=1',
        like: 'https://www.youtube.com/shorts/bGm4dt_Isrk',
        discord: 'https://discord.com/channels/@me', // 나중에 실제 링크로 변경
        script: 'https://ks-script.github.io/KS.WEB/'
    },
    verification: {
        step1Time: 8,  // YouTube 구독 대기 시간 (초)
        step2Time: 6,  // 좋아요 대기 시간 (초)
        step3Time: 10, // Discord 가입 대기 시간 (초)
        focusRequired: true // 페이지 복귀 필요 여부
    },
    storage: {
        key: 'ks_linkunlocker_data',
        secret: 'KS2024SCRIPT'
    }
};

// ============================================
// State Management
// ============================================
let state = {
    steps: {
        1: { clicked: false, verified: false, timestamp: null },
        2: { clicked: false, verified: false, timestamp: null },
        3: { clicked: false, verified: false, timestamp: null }
    },
    activeTimers: {},
    sessionToken: null
};

// ============================================
// Utility Functions
// ============================================
function generateToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return btoa(`${CONFIG.storage.secret}_${timestamp}_${random}`);
}

function encryptData(data) {
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr).split('').reverse().join(''));
}

function decryptData(encrypted) {
    try {
        const decoded = decodeURIComponent(atob(encrypted).split('').reverse().join(''));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function saveState() {
    const data = {
        ...state,
        token: state.sessionToken,
        timestamp: Date.now()
    };
    localStorage.setItem(CONFIG.storage.key, encryptData(data));
}

function loadState() {
    const saved = localStorage.getItem(CONFIG.storage.key);
    if (saved) {
        const data = decryptData(saved);
        if (data && data.token) {
            // 24시간 이내의 데이터만 유효
            const hoursDiff = (Date.now() - data.timestamp) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                state = { ...state, ...data };
                return true;
            }
        }
    }
    state.sessionToken = generateToken();
    return false;
}

// ============================================
// UI Functions
// ============================================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        warning: 'fa-exclamation'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function updateProgress() {
    const completed = Object.values(state.steps).filter(s => s.verified).length;
    const percent = Math.round((completed / 3) * 100);
    
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${completed} of 3 completed`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    
    // Update script button
    const scriptBtn = document.getElementById('scriptBtn');
    const scriptSubtitle = document.getElementById('scriptSubtitle');
    
    if (completed === 3) {
        scriptBtn.classList.remove('disabled');
        scriptBtn.classList.add('active');
        scriptSubtitle.textContent = 'Click to get your script!';
    } else {
        scriptBtn.classList.add('disabled');
        scriptBtn.classList.remove('active');
        scriptSubtitle.textContent = `Complete all steps to unlock (${3 - completed} remaining)`;
    }
}

function updateStepUI(stepNum) {
    const stepCard = document.getElementById(`step${stepNum}`);
    const stepData = state.steps[stepNum];
    
    if (stepData.verified) {
        stepCard.classList.remove('active', 'locked');
        stepCard.classList.add('completed');
        document.getElementById(`btn${stepNum}`).disabled = true;
        document.getElementById(`btn${stepNum}`).innerHTML = `
            <span class="btn-text">Completed</span>
            <span class="btn-icon"><i class="fas fa-check"></i></span>
        `;
        document.getElementById(`timer${stepNum}`).classList.remove('active');
        
        // Unlock next step
        const nextStep = stepNum + 1;
        if (nextStep <= 3) {
            const nextCard = document.getElementById(`step${nextStep}`);
            nextCard.classList.remove('locked');
            document.getElementById(`btn${nextStep}`).disabled = false;
        }
    }
    
    updateProgress();
    saveState();
}

function initializeUI() {
    // Restore UI from saved state
    for (let i = 1; i <= 3; i++) {
        if (state.steps[i].verified) {
            updateStepUI(i);
        }
    }
    
    // Unlock appropriate steps
    if (!state.steps[1].verified) {
        document.getElementById('step1').classList.remove('locked');
    }
    
    updateProgress();
}

// ============================================
// Verification System
// ============================================
function startVerification(stepNum, duration) {
    const timerEl = document.getElementById(`timer${stepNum}`);
    const timerText = document.getElementById(`timerText${stepNum}`);
    const btn = document.getElementById(`btn${stepNum}`);
    
    timerEl.classList.add('active');
    btn.classList.add('loading');
    btn.disabled = true;
    
    let remaining = duration;
    let isHidden = false;
    let returnedFromTab = false;
    
    // Track page visibility
    const visibilityHandler = () => {
        if (document.hidden) {
            isHidden = true;
        } else if (isHidden) {
            returnedFromTab = true;
            isHidden = false;
        }
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
    
    const updateTimer = () => {
        if (remaining > 0) {
            timerText.textContent = `Verifying... ${remaining}s remaining`;
            remaining--;
        } else {
            // Verification complete
            clearInterval(state.activeTimers[stepNum]);
            document.removeEventListener('visibilitychange', visibilityHandler);
            
            // Check if user actually left and returned
            if (CONFIG.verification.focusRequired && !returnedFromTab) {
                timerEl.classList.remove('active');
                btn.classList.remove('loading');
                btn.disabled = false;
                btn.innerHTML = `
                    <span class="btn-text">Try Again</span>
                    <span class="btn-icon"><i class="fas fa-redo"></i></span>
                `;
                showToast('warning', 'Verification Failed', 'Please complete the action on the external site.');
                state.steps[stepNum].clicked = false;
                saveState();
                return;
            }
            
            // Success
            state.steps[stepNum].verified = true;
            state.steps[stepNum].timestamp = Date.now();
            
            updateStepUI(stepNum);
            showToast('success', 'Step Completed!', `Step ${stepNum} has been verified successfully.`);
        }
    };
    
    updateTimer();
    state.activeTimers[stepNum] = setInterval(updateTimer, 1000);
}

// ============================================
// Step Handlers
// ============================================
function handleStep(stepNum) {
    // Prevent multiple clicks
    if (state.steps[stepNum].clicked && !state.steps[stepNum].verified) {
        showToast('warning', 'Please Wait', 'Verification is already in progress.');
        return;
    }
    
    // Check prerequisites
    if (stepNum > 1 && !state.steps[stepNum - 1].verified) {
        showToast('error', 'Step Locked', `Please complete step ${stepNum - 1} first.`);
        return;
    }
    
    // Mark as clicked
    state.steps[stepNum].clicked = true;
    state.steps[stepNum].timestamp = Date.now();
    saveState();
    
    // Get link and duration based on step
    let link, duration;
    switch (stepNum) {
        case 1:
            link = CONFIG.links.youtube;
            duration = CONFIG.verification.step1Time;
            break;
        case 2:
            link = CONFIG.links.like;
            duration = CONFIG.verification.step2Time;
            break;
        case 3:
            link = CONFIG.links.discord;
            duration = CONFIG.verification.step3Time;
            break;
    }
    
    // Open link in new tab
    window.open(link, '_blank');
    
    // Start verification timer
    setTimeout(() => {
        startVerification(stepNum, duration);
    }, 500);
}

function getScript() {
    // Final verification
    const allCompleted = Object.values(state.steps).every(s => s.verified);
    
    if (!allCompleted) {
        showToast('error', 'Not Completed', 'Please complete all verification steps first.');
        return;
    }
    
    // Additional security check
    const token = state.sessionToken;
    if (!token || !token.includes(CONFIG.storage.secret)) {
        showToast('error', 'Invalid Session', 'Please refresh the page and try again.');
        return;
    }
    
    // Check timestamps
    const timestamps = Object.values(state.steps).map(s => s.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    if (maxTime - minTime < 10000) { // Minimum 10 seconds between first and last step
        showToast('error', 'Verification Error', 'Please complete each step properly.');
        return;
    }
    
    // Success - redirect
    showToast('success', 'Unlocking Script...', 'Redirecting you now!');
    
    setTimeout(() => {
        window.location.href = CONFIG.links.script;
    }, 1500);
}

// ============================================
// Modal Functions
// ============================================
function showInfo() {
    document.getElementById('infoModal').classList.add('active');
}

function closeModal() {
    document.getElementById('infoModal').classList.remove('active');
}

function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
        localStorage.removeItem(CONFIG.storage.key);
        location.reload();
    }
}

// ============================================
// Particle Animation
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

// ============================================
// Anti-Tamper Protection
// ============================================
(function() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Detect DevTools
    let devToolsOpen = false;
    const threshold = 160;
    
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                console.log('%cWarning!', 'color: red; font-size: 40px; font-weight: bold;');
                console.log('%cThis browser feature is intended for developers. Do not paste any code here.', 'color: white; font-size: 16px;');
            }
        } else {
            devToolsOpen = false;
        }
    }, 1000);
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') ||
            e.key === 'F12'
        ) {
            e.preventDefault();
        }
    });
})();

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadState();
    initializeUI();
    
    // Welcome message for returning users
    const saved = localStorage.getItem(CONFIG.storage.key);
    if (saved) {
        const completed = Object.values(state.steps).filter(s => s.verified).length;
        if (completed > 0 && completed < 3) {
            showToast('success', 'Welcome Back!', `You have ${completed} step(s) completed. Continue to unlock.`);
        }
    }
});

// Handle page visibility for timer accuracy
document.addEventListener('visibilitychange', () => {
    saveState();
});

// Save state before leaving
window.addEventListener('beforeunload', () => {
    saveState();
});
