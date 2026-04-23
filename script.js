const TOTAL_DAYS = 90;

const DEFAULT_SETTINGS = {
    name: '',
    kcal: '2400–2600',
    protein: '~70g',
    meals: [
        { id: 'meal1', time: '6:00 AM',  label: 'Pre-Workout',   items: 'Banana × 2, Water / Plain Tea' },
        { id: 'meal2', time: '7:30 AM',  label: 'Post-Workout',  items: 'Eggs × 4, Rice 200g' },
        { id: 'meal3', time: '10:00 AM', label: 'Meal 3',        items: 'Rice 250g, Parippu (Dal), Pol Sambol' },
        { id: 'meal4', time: '1:30 PM',  label: 'Meal 4',        items: 'Rice 300g, Eggs × 2 / Dry Fish (Salaya / Sprats), Vegetables' },
        { id: 'meal5', time: '4:30 PM',  label: 'Evening Snack', items: 'Samaposha 50–75g + Water / Little Milk, Banana × 1' },
        { id: 'meal6', time: '7:30 PM',  label: 'Dinner',        items: 'Rice 200g, Eggs × 2, Vegetables' },
        { id: 'meal7', time: '10:00 PM', label: 'Night',         items: 'Water / Milk 100ml (if available)' }
    ]
};

// ── Storage Helpers ───────────────────────────────────────
function getSettings() {
    const saved = localStorage.getItem('bulk_settings');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function saveSettingsData(data) {
    localStorage.setItem('bulk_settings', JSON.stringify(data));
}

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getProgress() {
    const saved = localStorage.getItem('bulk_progress_' + getTodayKey());
    return saved ? JSON.parse(saved) : {};
}

function saveProgress(progress) {
    localStorage.setItem('bulk_progress_' + getTodayKey(), JSON.stringify(progress));
}

function getStartDate() {
    return localStorage.getItem('bulk_start_date');
}

function getDaysInfo() {
    const start = new Date(getStartDate());
    const today = new Date(getTodayKey());
    const passed = Math.floor((today - start) / (1000*60*60*24));
    return { dayNumber: passed + 1, remaining: Math.max(0, TOTAL_DAYS - passed) };
}

// ── Tab Navigation ────────────────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
    document.getElementById('tab-' + tab + '-btn').classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active-tab');

    if (tab === 'settings') renderSettingsForm();
    if (tab === 'home') updateHomeFromSettings();
}

// ── Login ─────────────────────────────────────────────────
function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!email) return showError(errorEl, 'Please enter your Gmail address.');
    if (!/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email)) {
        return showError(errorEl, 'Please enter a valid Gmail address.');
    }

    localStorage.setItem('bulk_logged_in', 'true');
    localStorage.setItem('bulk_user_email', email);

    if (getStartDate()) {
        showMainApp();
    } else {
        showStartScreen();
    }
}

function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ── Screens ───────────────────────────────────────────────
function showStartScreen() {
    const s = getSettings();
    document.getElementById('logged-email').textContent = localStorage.getItem('bulk_user_email') || '';
    document.getElementById('start-kcal-label').textContent = s.kcal + ' kcal/day';
    document.getElementById('start-protein-label').textContent = s.protein + ' Protein/day';
    document.getElementById('start-meals-label').textContent = s.meals.length + ' Meals/day';

    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    setTimeout(() => document.getElementById('start-screen').classList.add('visible'), 20);
}

function startPlan() {
    localStorage.setItem('bulk_start_date', getTodayKey());
    showMainApp();
}

function showMainApp() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    const app = document.getElementById('main-app');
    app.classList.remove('hidden');
    setTimeout(() => app.classList.add('visible'), 20);
    updateHomeFromSettings();
    renderMeals();
}

// ── Home Tab ──────────────────────────────────────────────
function updateHomeFromSettings() {
    const s = getSettings();

    // Greeting
    const greeting = s.name ? `Hello, ${s.name} 👋` : 'Hello, Champ 👋';
    document.getElementById('user-greeting').textContent = greeting;

    // Stats
    document.getElementById('stat-kcal').textContent = s.kcal;
    document.getElementById('stat-protein').textContent = s.protein;

    // Date & countdown
    const today = new Date();
    document.getElementById('current-date').textContent =
        today.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }).toUpperCase();

    if (getStartDate()) {
        const { dayNumber, remaining } = getDaysInfo();
        document.getElementById('days-left').textContent =
            remaining > 0
                ? `Day ${dayNumber} of 90  •  ${remaining} Days Remaining`
                : '🎉 90-Day Plan Complete!';

        const startDate = new Date(getStartDate());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 89);
        document.getElementById('app-footer').textContent =
            `3-Month Bulk Plan  •  Started ${startDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}  •  Ends ${endDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
    }

    renderMeals();
}

// ── Meals ─────────────────────────────────────────────────
function renderMeals() {
    const container = document.getElementById('meal-container');
    const progress = getProgress();
    const meals = getSettings().meals;
    container.innerHTML = '';

    meals.forEach((meal, i) => {
        const status = progress[meal.id] || 'none';
        const card = document.createElement('div');
        card.className = `meal-card ${status !== 'none' ? 'status-'+status : ''}`;
        card.style.animationDelay = `${i * 0.06}s`;
        card.innerHTML = `
            <div class="meal-info">
                <span class="time-tag">${meal.time} — ${meal.label}</span>
                <p>${meal.items}</p>
            </div>
            <div class="meal-actions">
                <button class="action-btn btn-check ${status==='done'?'active':''}" onclick="setStatus('${meal.id}','done')">✓</button>
                <button class="action-btn btn-cross ${status==='missed'?'active':''}" onclick="setStatus('${meal.id}','missed')">✗</button>
            </div>`;
        container.appendChild(card);
    });
    updateStats();
}

function setStatus(mealId, status) {
    const progress = getProgress();
    progress[mealId] = progress[mealId] === status ? 'none' : status;
    saveProgress(progress);
    renderMeals();
}

function updateStats() {
    const progress = getProgress();
    const meals = getSettings().meals;
    const total = meals.length;
    const doneCount = Object.values(progress).filter(v => v === 'done').length;

    document.getElementById('progress-text').textContent = `${doneCount}/${total}`;

    const msgEl   = document.getElementById('status-message');
    const iconEl  = document.getElementById('status-icon');
    const titleEl = document.getElementById('status-title');
    const descEl  = document.getElementById('status-desc');
    const bannerEl = document.getElementById('day-complete-banner');

    const mealIds = meals.map(m => m.id);
    const allActioned = mealIds.every(id => progress[id] && progress[id] !== 'none');
    const allDone = allActioned && doneCount === total;

    if (allActioned && allDone) {
        msgEl.className = 'good-job';
        iconEl.textContent = '🏆';
        titleEl.textContent = 'GOOD JOB!';
        titleEl.style.color = '#10b981';
        descEl.textContent = "You crushed today's bulk plan! Rest well and come back stronger 💪";
    } else if (allActioned) {
        msgEl.className = 'incomplete';
        iconEl.textContent = '⚠️';
        titleEl.textContent = 'Not Completed';
        titleEl.style.color = '#f43f5e';
        descEl.textContent = `You missed ${total - doneCount} meal(s) today. Tomorrow is a new chance! 🔄`;
    } else {
        msgEl.className = '';
        msgEl.style.display = 'none';
    }

    // Day-complete banner
    if (allActioned) {
        const { dayNumber, remaining } = getDaysInfo();

        // Check 90-day plan complete
        if (dayNumber >= TOTAL_DAYS && allDone) {
            showPlanComplete();
            bannerEl.classList.add('hidden');
            return;
        }

        // Show day-complete banner
        bannerEl.classList.remove('hidden');
        document.getElementById('dcb-sub').textContent =
            `You finished Day ${dayNumber}! Come back tomorrow to continue. 💪`;
        document.getElementById('dcb-next').textContent =
            remaining > 1 ? `➡ Next: Day ${dayNumber + 1} (${remaining - 1} days left)` : '🏁 Final day tomorrow!';
    } else {
        bannerEl.classList.add('hidden');
    }
}

// ── 90-Day Celebration ────────────────────────────────────
function showPlanComplete() {
    const s = getSettings();
    const name = s.name || 'Champion';
    document.getElementById('complete-msg').textContent =
        `${name}, you completed the full 90-day Bulk Plan! You're an absolute beast! 💪🔥`;

    const screen = document.getElementById('plan-complete-screen');
    screen.classList.remove('hidden');
    setTimeout(() => screen.classList.add('visible'), 20);
    launchConfetti();
}

function launchConfetti() {
    const wrap = document.getElementById('confetti-wrap');
    wrap.innerHTML = '';
    const colors = ['#6366f1','#10b981','#f59e0b','#f43f5e','#34d399','#818cf8','#fbbf24'];
    for (let i = 0; i < 80; i++) {
        const dot = document.createElement('div');
        dot.className = 'confetti-dot';
        dot.style.cssText = `
            left:${Math.random()*100}%;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            width:${6+Math.random()*8}px;
            height:${6+Math.random()*8}px;
            animation-delay:${Math.random()*3}s;
            animation-duration:${3+Math.random()*3}s;
        `;
        wrap.appendChild(dot);
    }
}

// ── Settings Tab ──────────────────────────────────────────
function renderSettingsForm() {
    const s = getSettings();
    document.getElementById('setting-name').value    = s.name    || '';
    document.getElementById('setting-kcal').value    = s.kcal    || '';
    document.getElementById('setting-protein').value = s.protein || '';
    renderMealEditorList(s.meals);
}

function renderMealEditorList(meals) {
    const list = document.getElementById('meal-editor-list');
    list.innerHTML = '';
    meals.forEach((meal, i) => {
        const row = document.createElement('div');
        row.className = 'meal-editor-row';
        row.setAttribute('data-index', i);
        row.innerHTML = `
            <div class="meal-editor-fields">
                <div class="meal-editor-top">
                    <input type="text" class="me-input me-time" placeholder="Time (e.g. 7:30 AM)" value="${meal.time}" oninput="updateMealField(${i},'time',this.value)">
                    <input type="text" class="me-input me-label" placeholder="Label (e.g. Breakfast)" value="${meal.label}" oninput="updateMealField(${i},'label',this.value)">
                </div>
                <textarea class="me-textarea" placeholder="Food items..." oninput="updateMealField(${i},'items',this.value)">${meal.items}</textarea>
            </div>
            <button class="delete-meal-btn" onclick="deleteMeal(${i})" title="Delete meal">✕</button>`;
        list.appendChild(row);
    });
}

let _tempMeals = null;

function getCurrentEditorMeals() {
    if (!_tempMeals) _tempMeals = JSON.parse(JSON.stringify(getSettings().meals));
    return _tempMeals;
}

function updateMealField(index, field, value) {
    const meals = getCurrentEditorMeals();
    if (meals[index]) meals[index][field] = value;
}

function addMealField() {
    const meals = getCurrentEditorMeals();
    const newId = 'meal_' + Date.now();
    meals.push({ id: newId, time: '', label: '', items: '' });
    renderMealEditorList(meals);
}

function deleteMeal(index) {
    const meals = getCurrentEditorMeals();
    if (meals.length <= 1) return alert('You need at least 1 meal.');
    meals.splice(index, 1);
    renderMealEditorList(meals);
}

function saveSettings() {
    const name    = document.getElementById('setting-name').value.trim();
    const kcal    = document.getElementById('setting-kcal').value.trim();
    const protein = document.getElementById('setting-protein').value.trim();
    const meals   = getCurrentEditorMeals();

    const s = getSettings();
    s.name    = name;
    s.kcal    = kcal    || s.kcal;
    s.protein = protein || s.protein;
    s.meals   = meals;
    saveSettingsData(s);

    _tempMeals = null; // reset temp

    const msg = document.getElementById('settings-saved-msg');
    msg.textContent = '✅ Settings saved successfully!';
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 2500);

    updateHomeFromSettings();
}

// ── Reset ─────────────────────────────────────────────────
function confirmReset() {
    const m = document.getElementById('reset-modal');
    m.classList.remove('hidden');
    setTimeout(() => m.classList.add('visible'), 20);
}

function closeModal() {
    const m = document.getElementById('reset-modal');
    m.classList.remove('visible');
    setTimeout(() => m.classList.add('hidden'), 300);
}

function resetPlan() {
    // Clear ALL bulk data including login
    const keys = Object.keys(localStorage).filter(k => k.startsWith('bulk_'));
    keys.forEach(k => localStorage.removeItem(k));
    _tempMeals = null;
    closeModal();
    setTimeout(() => {
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('main-app').classList.remove('visible');
        // Reset tab to home for next session
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
        document.getElementById('tab-home-btn').classList.add('active');
        document.getElementById('tab-home').classList.add('active-tab');
        // Clear email field and show login
        document.getElementById('email').value = '';
        document.getElementById('login-overlay').classList.remove('hidden');
    }, 350);
}

// ── Init ──────────────────────────────────────────────────
function init() {
    const loggedIn   = localStorage.getItem('bulk_logged_in');
    const planStarted = getStartDate();

    if (loggedIn === 'true' && planStarted) {
        showMainApp();
    } else if (loggedIn === 'true') {
        showStartScreen();
    }
    // else: login screen shown by default

    document.getElementById('email').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });
}

document.addEventListener('DOMContentLoaded', init);
