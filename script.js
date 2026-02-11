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
        focusRequired: true, // 페이지 복귀 필요 여부
        minInteractionTime: 3000 // 최소 인터랙션 시간 (밀리초)
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
        1: { clicked: false, verified: false, timestamp: null, windowOpened: false },
        2: { clicked: false, verified: false, timestamp: null, windowOpened: false },
        3: { clicked: false, verified: false, timestamp: null, windowOpened: false }
    },
    activeTimers: {},
    sessionToken: null,
    initialized: false
};

// ============================================
// Utility Functions
// ============================================
function generateToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return btoa(`${CONFIG.storage.secret}_${timestamp}_${random}`);
}

function validateToken(token) {
    if (!token) return false;
    try {
        const decoded = atob(token);
        return decoded.includes(CONFIG.storage.secret);
    } catch {
        return false;
    }
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
        steps: state.steps,
        sessionToken: state.sessionToken,
        timestamp: Date.now()
    };
    localStorage.setItem(CONFIG.storage.key, encryptData(data));
}

function loadState() {
    const saved = localStorage.getItem(CONFIG.storage.key);
    if (saved) {
        const data = decryptData(saved);
        if (data && data.sessionToken) {
            // 24시간 이내의 데이터만 유효
            const hoursDiff = (Date.now() - data.timestamp) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                state.steps = data.steps || state.steps;
                state.sessionToken = data.sessionToken;
                state.initialized = true;
                return true;
            }
        }
    }
    
    // 새 세션 생성
    state.sessionToken = generateToken();
    state.initialized = true;
    saveState();
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
        
        const btn = document.getElementById(`btn${stepNum}`);
        btn.disabled = true;
        btn.classList.remove('loading');
        btn.innerHTML = `
            <span class="btn-text">Completed</span>
            <span class="btn-icon"><i class="fas fa-check"></i></span>
        `;
        
        document.getElementById(`timer${stepNum}`).classList.remove('active');
        
        // Unlock next step
        const nextStep = stepNum + 1;
        if (nextStep <= 3) {
            const nextCard = document.getElementById(`step${nextStep}`);
            const nextBtn = document.getElementById(`btn${nextStep}`);
            if (nextCard && !state.steps[nextStep].verified) {
                nextCard.classList.remove('locked');
                nextBtn.disabled = false;
            }
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
        } else if (i === 1) {
            // First step is always unlocked initially
            document.getElementById('step1').classList.remove('locked');
            document.getElementById('btn1').disabled = false;
        } else {
            // Check if previous step is completed
            if (state.steps[i - 1].verified) {
                document.getElementById(`step${i}`).classList.remove('locked');
                document.getElementById(`btn${i}`).disabled = false;
            }
        }
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
    const stepCard = document.getElementById(`step${stepNum}`);
    
    // Clear any existing timer
    if (state.activeTimers[stepNum]) {
        clearInterval(state.activeTimers[stepNum]);
    }
    
    timerEl.classList.add('active');
    btn.classList.add('loading');
    btn.disabled = true;
    stepCard.classList.add('active');
    
    let remaining = duration;
    let startTime = Date.now();
    let hasReturnedToTab = false;
    let wasHidden = false;
    
    // Enhanced visibility tracking
    const checkVisibility = () => {
        if (document.hidden) {
            wasHidden = true;
        } else if (wasHidden) {
            hasReturnedToTab = true;
            wasHidden = false;
        }
    };
    
    // Window focus tracking (more reliable)
    const checkFocus = () => {
        if (!document.hasFocus()) {
            wasHidden = true;
        } else if (wasHidden) {
            hasReturnedToTab = true;
            wasHidden = false;
        }
    };
    
    document.addEventListener('visibilitychange', checkVisibility);
    window.addEventListener('blur', () => { wasHidden = true; });
    window.addEventListener('focus', checkFocus);
    
    const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        remaining = Math.max(0, duration - elapsed);
        
        if (remaining > 0) {
            timerText.textContent = `Verifying... ${remaining}s remaining`;
        } else {
            // Cleanup
            clearInterval(state.activeTimers[stepNum]);
            delete state.activeTimers[stepNum];
            document.removeEventListener('visibilitychange', checkVisibility);
            window.removeEventListener('blur', () => { wasHidden = true; });
            window.removeEventListener('focus', checkFocus);
            
            timerEl.classList.remove('active');
            btn.classList.remove('loading');
            stepCard.classList.remove('active');
            
            // Flexible verification based on step
            let verificationPassed = false;
            
            if (stepNum === 1) {
                // YouTube subscribe - strict check
                verificationPassed = hasReturnedToTab && (Date.now() - startTime) >= (CONFIG.verification.minInteractionTime);
            } else if (stepNum === 2) {
                // YouTube like - medium check
                verificationPassed = (wasHidden || hasReturnedToTab) && (Date.now() - startTime) >= (CONFIG.verification.minInteractionTime);
            } else if (stepNum === 3) {
                // Discord join - lenient check
                verificationPassed = state.steps[stepNum].windowOpened && (Date.now() - startTime) >= (CONFIG.verification.minInteractionTime);
            }
            
            if (!verificationPassed && CONFIG.verification.focusRequired && stepNum !== 3) {
                // Failed verification
                btn.disabled = false;
                btn.innerHTML = `
                    <span class="btn-text">Try Again</span>
                    <span class="btn-icon"><i class="fas fa-redo"></i></span>
                `;
                showToast('warning', 'Verification Failed', 'Please complete the action on the external site and return here.');
                state.steps[stepNum].clicked = false;
                state.steps[stepNum].windowOpened = false;
                saveState();
                return;
            }
            
            // Success
            state.steps[stepNum].verified = true;
            state.steps[stepNum].timestamp = Date.now();
            
            updateStepUI(stepNum);
            showToast('success', 'Step Completed!', `Step ${stepNum} has been verified successfully.`);
            
            // Auto-unlock next step
            if (stepNum < 3) {
                setTimeout(() => {
                    showToast('success', 'Next Step Unlocked', `You can now proceed with step ${stepNum + 1}.`);
                }, 1000);
            } else if (stepNum === 3) {
                setTimeout(() => {
                    showToast('success', 'All Steps Complete!', 'You can now get your script!');
                }, 1000);
            }
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
        if (state.activeTimers[stepNum]) {
            showToast('warning', 'Please Wait', 'Verification is already in progress.');
            return;
        }
    }
    
    // Check prerequisites
    if (stepNum > 1 && !state.steps[stepNum - 1].verified) {
        showToast('error', 'Step Locked', `Please complete step ${stepNum - 1} first.`);
        return;
    }
    
    // Mark as clicked
    state.steps[stepNum].clicked = true;
    state.steps[stepNum].windowOpened = true;
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
    const newWindow = window.open(link, '_blank');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        showToast('error', 'Popup Blocked', 'Please allow popups for this site and try again.');
        state.steps[stepNum].clicked = false;
        state.steps[stepNum].windowOpened = false;
        saveState();
        return;
    }
    
    // Show initial toast
    showToast('success', 'Window Opened', `Please complete the action and return to this tab.`);
    
    // Start verification timer with slight delay
    setTimeout(() => {
        startVerification(stepNum, duration);
    }, 500);
}

function getScript() {
    // Ensure state is loaded
    if (!state.initialized) {
        loadState();
    }
    
    // Final verification
    const allCompleted = Object.values(state.steps).every(s => s.verified);
    
    if (!allCompleted) {
        showToast('error', 'Not Completed', 'Please complete all verification steps first.');
        return;
    }
    
    // Validate session token
    if (!validateToken(state.sessionToken)) {
        // Generate new token if invalid
        state.sessionToken = generateToken();
        saveState();
    }
    
    // Check timestamps to prevent rapid completion
    const timestamps = Object.values(state.steps)
        .map(s => s.timestamp)
        .filter(t => t !== null);
    
    if (timestamps.length !== 3) {
        showToast('error', 'Verification Error', 'Please complete all steps properly.');
        return;
    }
    
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // Minimum 5 seconds between first and last step (reduced from 10)
    if (maxTime - minTime < 5000) {
        showToast('error', 'Verification Error', 'Please take your time to complete each step properly.');
        return;
    }
    
    // Success - redirect
    showToast('success', 'Success!', 'Redirecting to your script...');
    
    // Add visual feedback
    const scriptBtn = document.getElementById('scriptBtn');
    scriptBtn.style.transform = 'scale(0.95)';
    
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
        // Clear all timers
        Object.keys(state.activeTimers).forEach(key => {
            clearInterval(state.activeTimers[key]);
        });
        
        // Clear storage
        localStorage.removeItem(CONFIG.storage.key);
        
        // Reload page
        location.reload();
    }
}

// ============================================
// Particle Animation
// ============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
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
// Anti-Tamper Protection (Optional)
// ============================================
function initAntiTamper() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showToast('warning', 'Context Menu Disabled', 'Right-click is disabled on this page.');
        return false;
    });
    
    // Warning message for console
    console.log('%cWarning!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis browser feature is intended for developers. Do not paste any code here.', 'color: white; font-size: 16px;');
    
    // Disable certain keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')
        ) {
            e.preventDefault();
            showToast('warning', 'Shortcut Disabled', 'Developer shortcuts are disabled.');
            return false;
        }
    });
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Create visual effects
    createParticles();
    
    // Load saved state
    const hasExistingData = loadState();
    
    // Initialize UI
    initializeUI();
    
    // Initialize anti-tamper (optional - can be commented out during development)
    // initAntiTamper();
    
    // Show welcome message
    if (hasExistingData) {
        const completed = Object.values(state.steps).filter(s => s.verified).length;
        if (completed > 0 && completed < 3) {
            setTimeout(() => {
                showToast('success', 'Welcome Back!', `You have ${completed} of 3 steps completed.`);
            }, 500);
        } else if (completed === 3) {
            setTimeout(() => {
                showToast('success', 'Ready!', 'All steps completed. Click "Get Script" to continue.');
            }, 500);
        }
    } else {
        setTimeout(() => {
            showToast('success', 'Welcome!', 'Complete all 3 steps to unlock your script.');
        }, 500);
    }
});

// Handle page visibility for auto-save
document.addEventListener('visibilitychange', () => {
    if (state.initialized) {
        saveState();
    }
});

// Save state before leaving
window.addEventListener('beforeunload', () => {
    if (state.initialized) {
        saveState();
    }
});

// Cleanup timers on page unload
window.addEventListener('unload', () => {
    Object.keys(state.activeTimers).forEach(key => {
        clearInterval(state.activeTimers[key]);
    });
});
