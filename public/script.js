const API_URL = '/api';

// DOM Elements
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const dashboardSection = document.getElementById('dashboard-section');
const incidentsSection = document.getElementById('incidents-section');
const searchSection = document.getElementById('search-section');

const mainNav = document.getElementById('main-nav');
const authNav = document.getElementById('auth-nav');

const navButtons = {
    dashboard: document.getElementById('show-dashboard'),
    incidents: document.getElementById('show-incidents'),
    search: document.getElementById('show-search'),
    logout: document.getElementById('logout-btn')
};

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const incidentModal = document.getElementById('incident-modal');
const detailModal = document.getElementById('detail-modal');
const qrModal = document.getElementById('qr-modal');

const incidentForm = document.getElementById('incident-form');
const searchForm = document.getElementById('search-form');

// State
let currentSection = 'dashboard';
let token = localStorage.getItem('token');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    handleHashChange();
});

window.addEventListener('hashchange', handleHashChange);

function setupEventListeners() {
    // Navigation
    navButtons.dashboard.addEventListener('click', () => switchSection('dashboard'));
    navButtons.incidents.addEventListener('click', () => switchSection('incidents'));
    navButtons.search.addEventListener('click', () => switchSection('search'));
    navButtons.logout.addEventListener('click', handleLogout);

    // Auth Toggles
    document.getElementById('toggle-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    document.getElementById('toggle-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Modals
    document.getElementById('open-incident-form').addEventListener('click', () => {
        incidentModal.classList.remove('hidden');
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            incidentModal.classList.add('hidden');
            detailModal.classList.add('hidden');
            qrModal.classList.add('hidden');
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    incidentForm.addEventListener('submit', handleIncidentSubmit);
    searchForm.addEventListener('submit', handleSearchSubmit);

    // Backup
    document.getElementById('download-backup').addEventListener('click', () => {
        // Since backup is protected, we'll try a standard download link first
        // If it fails due to auth, we might need a different approach for protected downloads
        window.location.href = `${API_URL}/backup?token=${token}`; 
    });
}

function checkAuth() {
    if (token) {
        mainNav.classList.remove('hidden');
        authNav.classList.add('hidden');
        loginSection.classList.add('hidden');
        registerSection.classList.add('hidden');
        if (!window.location.hash.includes('incident=')) {
            switchSection('dashboard');
        }
    } else {
        mainNav.classList.add('hidden');
        authNav.classList.remove('hidden');
        loginSection.classList.remove('hidden');
        hideMainSections();
    }
}

function handleHashChange() {
    const hash = window.location.hash;
    if (hash.includes('incident=')) {
        const incidentId = hash.split('incident=')[1];
        if (token) {
            viewIncidentDetail(incidentId);
        } else {
            alert('Please login to view incident details');
        }
    }
}

function hideMainSections() {
    dashboardSection.classList.add('hidden');
    incidentsSection.classList.add('hidden');
    searchSection.classList.add('hidden');
}

function switchSection(section) {
    if (!token) return;
    currentSection = section;
    
    hideMainSections();

    if (section === 'dashboard') {
        dashboardSection.classList.remove('hidden');
        loadDashboard();
    } else if (section === 'incidents') {
        incidentsSection.classList.remove('hidden');
        loadIncidents();
    } else if (section === 'search') {
        searchSection.classList.remove('hidden');
    }
}

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            token = result.token;
            localStorage.setItem('token', token);
            checkAuth();
            handleHashChange(); // Check if we should open a detail view after login
        } else {
            alert(result.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        } else {
            const result = await response.json();
            alert(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    token = null;
    checkAuth();
}

// Authenticated Fetch Helper
async function authFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
}

// Data Fetching
async function loadDashboard() {
    try {
        const response = await authFetch(`${API_URL}/dashboard`);
        if (response.status === 401) return handleLogout();
        const data = await response.json();
        
        document.getElementById('stat-incidents').textContent = data.summary.totalIncidents;
        document.getElementById('stat-locations').textContent = data.summary.totalLocations;
        document.getElementById('stat-persons').textContent = data.summary.totalPersons;
        document.getElementById('stat-responders').textContent = data.summary.totalResponders;

        const recentList = document.getElementById('recent-incidents-list');
        recentList.innerHTML = data.recentIncidents.map(i => `
            <li>
                <strong>${i.title}</strong><br>
                <small>${i.type} | ${new Date(i.date).toLocaleDateString()}</small>
            </li>
        `).join('');

        const riskList = document.getElementById('high-risk-locations-list');
        riskList.innerHTML = data.highRiskLocations.map(l => `
            <li>
                <strong>${l.name}</strong> - ${l.riskLevel}<br>
                <small>${l.address}</small>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadIncidents() {
    try {
        const response = await authFetch(`${API_URL}/incidents`);
        const incidents = await response.json();
        renderIncidentList(incidents, 'incident-list-container');
    } catch (error) {
        console.error('Error loading incidents:', error);
    }
}

function renderIncidentList(incidents, containerId) {
    const container = document.getElementById(containerId);
    if (!incidents || incidents.length === 0) {
        container.innerHTML = '<p>No incidents found.</p>';
        return;
    }

    container.innerHTML = incidents.map(i => `
        <div class="card">
            <span class="badge badge-${i.status}">${i.status}</span>
            <span class="badge badge-${i.severity}">${i.severity}</span>
            <h3>${i.title}</h3>
            <p>${i.description.substring(0, 100)}${i.description.length > 100 ? '...' : ''}</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button onclick="viewIncidentDetail('${i.id}')" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;">View Graph</button>
                <button onclick="showQRCode('${i.id}')" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;">QR Code</button>
            </div>
        </div>
    `).join('');
}

async function handleIncidentSubmit(e) {
    e.preventDefault();
    const formData = new FormData(incidentForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await authFetch(`${API_URL}/incidents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            incidentModal.classList.add('hidden');
            incidentForm.reset();
            if (currentSection === 'incidents') loadIncidents();
            else if (currentSection === 'dashboard') loadDashboard();
        }
    } catch (error) {
        console.error('Error creating incident:', error);
    }
}

async function handleSearchSubmit(e) {
    e.preventDefault();
    const formData = new FormData(searchForm);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }

    try {
        const response = await authFetch(`${API_URL}/search?${params.toString()}`);
        const results = await response.json();
        renderIncidentList(results, 'search-results');
    } catch (error) {
        console.error('Error searching:', error);
    }
}

async function viewIncidentDetail(id) {
    try {
        const response = await authFetch(`${API_URL}/incidents/${id}/graph`);
        if (!response.ok) throw new Error('Failed to load detail');
        const data = await response.json();
        
        const detailBody = document.getElementById('detail-body');
        document.getElementById('detail-title').textContent = data.title;
        
        let html = `
            <div class="detail-info">
                <p><strong>Status:</strong> ${data.status} | <strong>Severity:</strong> ${data.severity}</p>
                <p><strong>Type:</strong> ${data.type} | <strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
                <p style="margin-top: 1rem;">${data.description}</p>
            </div>
            <hr style="margin: 1.5rem 0;">
            <div class="graph-connections">
                <h3>Graph Relationships</h3>
                <div style="margin-top: 1rem;">
                    <strong>Location (OCCURRED_AT):</strong>
                    ${data.location ? `
                        <div class="card" style="margin-top: 0.5rem; background: #f9f9f9;">
                            <p><strong>${data.location.name}</strong></p>
                            <p><small>${data.location.address}</small></p>
                        </div>
                    ` : '<p>None connected</p>'}
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Involved Persons:</strong>
                    ${data.persons && data.persons.length > 0 ? data.persons.map(p => `
                        <div class="card" style="margin-top: 0.5rem; background: #f9f9f9;">
                            <p><strong>${p.person.firstName} ${p.person.lastName}</strong> - <span class="badge badge-Open" style="background: #3498db;">${p.relationship}</span></p>
                        </div>
                    `).join('') : '<p>None connected</p>'}
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Responders (RESPONDED_TO):</strong>
                    ${data.responders && data.responders.length > 0 ? data.responders.map(r => `
                        <div class="card" style="margin-top: 0.5rem; background: #f9f9f9;">
                            <p><strong>${r.name}</strong> (${r.agency})</p>
                        </div>
                    `).join('') : '<p>None connected</p>'}
                </div>
            </div>
        `;
        
        detailBody.innerHTML = html;
        detailModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading incident details:', error);
        alert('Could not find incident details.');
    }
}

async function showQRCode(id) {
    try {
        const response = await authFetch(`${API_URL}/incidents/${id}/qrcode`);
        const data = await response.json();
        
        document.getElementById('qr-image').src = data.qrCode;
        document.getElementById('qr-url').textContent = data.url;
        document.getElementById('download-qr').href = data.qrCode;
        
        qrModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error showing QR code:', error);
    }
}
