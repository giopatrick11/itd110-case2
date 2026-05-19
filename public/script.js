const API_URL = '/api';

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const incidentsSection = document.getElementById('incidents-section');
const searchSection = document.getElementById('search-section');
const approvalsSection = document.getElementById('approvals-section');

const mainNav = document.getElementById('main-nav');
const authNav = document.getElementById('auth-nav');

const navButtons = {
    dashboard: document.getElementById('show-dashboard'),
    incidents: document.getElementById('show-incidents'),
    search: document.getElementById('show-search'),
    approvals: document.getElementById('show-approvals'),
    logout: document.getElementById('logout-btn')
};

const loginForm = document.getElementById('login-form');
const registerModal = document.getElementById('register-modal');
const incidentModal = document.getElementById('incident-modal');
const detailModal = document.getElementById('detail-modal');
const qrModal = document.getElementById('qr-modal');

const registerForm = document.getElementById('register-form');
const incidentForm = document.getElementById('incident-form');
const searchForm = document.getElementById('search-form');

// State
let currentSection = 'dashboard';
let token = localStorage.getItem('token');
let userName = localStorage.getItem('userName');
let userRole = localStorage.getItem('userRole');
let dashboardData = null;
let trendsChart = null;
let currentPage = 1;
let totalPages = 1;

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
    navButtons.approvals.addEventListener('click', () => switchSection('approvals'));
    navButtons.logout.addEventListener('click', handleLogout);

    // Modals
    document.getElementById('open-incident-form').addEventListener('click', () => {
        incidentModal.classList.remove('hidden');
    });

    document.getElementById('open-register-form').addEventListener('click', () => {
        registerModal.classList.remove('hidden');
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close on ESC key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    incidentForm.addEventListener('submit', handleIncidentSubmit);
    searchForm.addEventListener('submit', handleSearchSubmit);
    
    // Live Search
    searchForm.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', handleSearchSubmit);
    });

    // Trends Filter
    document.getElementById('severity-trend-filter').addEventListener('change', updateTrendsChart);

    // Backup
    document.getElementById('download-backup').addEventListener('click', () => {
        window.location.href = `${API_URL}/backup?token=${token}`; 
    });
}

function closeAllModals() {
    incidentModal.classList.add('hidden');
    registerModal.classList.add('hidden');
    detailModal.classList.add('hidden');
    qrModal.classList.add('hidden');
}

async function checkAuth() {
    if (token) {
        // If we have a token but no role/name (e.g. from an old session), fetch it
        if (!userName || !userRole) {
            try {
                const response = await authFetch(`${API_URL}/auth/me`);
                if (response.ok) {
                    const user = await response.json();
                    userName = user.name;
                    userRole = user.role;
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userRole', userRole);
                } else {
                    return handleLogout();
                }
            } catch (error) {
                return handleLogout();
            }
        }

        mainNav.classList.remove('hidden');
        authNav.classList.add('hidden');
        loginSection.classList.add('hidden');

        if (userName) {
            document.getElementById('user-display').textContent = userName.toUpperCase();
        }

        if (userRole === 'Admin') {
            navButtons.approvals.classList.remove('hidden');
        } else {
            navButtons.approvals.classList.add('hidden');
        }

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
    approvalsSection.classList.add('hidden');
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
        currentPage = 1;
        loadIncidents(1);
    } else if (section === 'search') {
        searchSection.classList.remove('hidden');
    } else if (section === 'approvals') {
        approvalsSection.classList.remove('hidden');
        loadApprovals();
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
            userName = result.user.name;
            userRole = result.user.role;
            localStorage.setItem('token', token);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userRole', userRole);
            checkAuth();
            handleHashChange();
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
            alert('Personnel account created successfully!');
            registerModal.classList.add('hidden');
            registerForm.reset();
            if (currentSection === 'approvals') loadApprovals();
        } else {
            const result = await response.json();
            alert(result.error || 'Account creation failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    token = null;
    userName = null;
    userRole = null;
    checkAuth();
}

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
        dashboardData = data;
        
        document.getElementById('stat-incidents').textContent = data.summary.totalIncidents;
        document.getElementById('stat-locations').textContent = data.summary.totalLocations;
        document.getElementById('stat-persons').textContent = data.summary.totalPersons;
        document.getElementById('stat-responders').textContent = data.summary.totalResponders;

        updateTrendsChart();

        const recentList = document.getElementById('recent-incidents-list');
        if (data.recentIncidents.length === 0) {
            recentList.innerHTML = '<li class="text-muted">No recent incidents recorded.</li>';
        } else {
            recentList.innerHTML = data.recentIncidents.map(i => `
                <li>
                    <strong>${i.title}</strong><br>
                    <small style="color: var(--text-muted)">${i.type} | ${new Date(i.date).toLocaleDateString()}</small>
                </li>
            `).join('');
        }

        const riskList = document.getElementById('high-risk-locations-list');
        if (data.highRiskLocations.length === 0) {
            riskList.innerHTML = '<li class="text-muted">No high risk locations identified.</li>';
        } else {
            riskList.innerHTML = data.highRiskLocations.map(l => `
                <li>
                    <strong style="color: var(--danger)">${l.name}</strong> - ${l.riskLevel}<br>
                    <small style="color: var(--text-muted)">${l.address}</small>
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateTrendsChart() {
    if (!dashboardData || !dashboardData.trends) return;

    const filter = document.getElementById('severity-trend-filter').value;
    const trends = dashboardData.trends;

    // Group by date
    const dateGroups = {};
    trends.forEach(t => {
        if (filter !== 'all' && t.severity !== filter) return;
        
        if (!dateGroups[t.date]) dateGroups[t.date] = 0;
        dateGroups[t.date] += t.count;
    });

    const labels = Object.keys(dateGroups).sort();
    const values = labels.map(date => dateGroups[date]);

    if (trendsChart) {
        trendsChart.data.labels = labels;
        trendsChart.data.datasets[0].data = values;
        trendsChart.data.datasets[0].label = `Incidents (${filter})`;
        trendsChart.update();
    } else {
        const ctx = document.getElementById('incident-trends-chart').getContext('2d');
        trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Incidents (${filter})`,
                    data: values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

async function loadIncidents(page = 1) {
    try {
        const response = await authFetch(`${API_URL}/incidents?page=${page}&limit=6`);
        const data = await response.json();
        
        currentPage = data.page;
        totalPages = data.totalPages;
        
        renderIncidentList(data.incidents, 'incident-list-container');
        renderPagination();
    } catch (error) {
        console.error('Error loading incidents:', error);
    }
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button onclick="changePage(${i})" class="${currentPage === i ? 'active' : ''}">${i}</button>
        `;
    }

    html += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>
    `;

    container.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadIncidents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderIncidentList(incidents, containerId) {
    const container = document.getElementById(containerId);
    if (!incidents || incidents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No incidents found matching your criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = incidents.map(i => `
        <div class="card">
            <div class="card-header">
                <span class="badge badge-${i.severity}">${i.severity}</span>
                <span class="badge badge-${i.status}">${i.status}</span>
            </div>
            <h3>${i.title}</h3>
            <p>${i.description.substring(0, 120)}${i.description.length > 120 ? '...' : ''}</p>
            <div style="display: flex; gap: 0.75rem;">
                <button onclick="viewIncidentDetail('${i.id}')" class="btn btn-primary" style="flex: 1; font-size: 0.8125rem;">View</button>
                <button onclick="showQRCode('${i.id}')" class="btn btn-secondary" style="font-size: 0.8125rem;">QR Code</button>
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
            if (currentSection === 'incidents') loadIncidents(1);
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
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <span class="badge badge-${data.status}">${data.status}</span>
                    <span class="badge badge-${data.severity}">${data.severity}</span>
                    <span class="badge" style="background: #f1f5f9; color: var(--text-muted)">${data.type}</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">Occurred on ${new Date(data.date).toLocaleString()}</p>
                <p style="font-size: 1rem; line-height: 1.6;">${data.description}</p>
            </div>
            
            <div style="background: var(--bg-main); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                <h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 1rem;">Graph Connections</h4>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Location</p>
                    <div class="chip-container">
                        ${data.location ? `
                            <div class="chip">
                                <span class="chip-label">OCCURRED_AT</span>
                                <span>${data.location.name}</span>
                            </div>
                        ` : '<span style="color: var(--text-muted); font-size: 0.875rem;">No location associated</span>'}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">People Involved</p>
                    <div class="chip-container">
                        ${data.persons && data.persons.length > 0 ? data.persons.map(p => `
                            <div class="chip">
                                <span class="chip-label">${p.relationship}</span>
                                <span>${p.person.firstName} ${p.person.lastName}</span>
                            </div>
                        `).join('') : '<span style="color: var(--text-muted); font-size: 0.875rem;">No people associated</span>'}
                    </div>
                </div>

                <div>
                    <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Emergency Responders</p>
                    <div class="chip-container">
                        ${data.responders && data.responders.length > 0 ? data.responders.map(r => `
                            <div class="chip">
                                <span class="chip-label">RESPONDED_TO</span>
                                <span>${r.name} (${r.agency})</span>
                            </div>
                        `).join('') : '<span style="color: var(--text-muted); font-size: 0.875rem;">No responders associated</span>'}
                    </div>
                </div>
            </div>
        `;
        
        detailBody.innerHTML = html;
        detailModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading incident details:', error);
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

// Admin Functions
async function loadApprovals() {
    try {
        const response = await authFetch(`${API_URL}/auth/pending`);
        const users = await response.json();
        
        const tbody = document.getElementById('pending-users-body');
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No pending access requests.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem; font-weight: 600;">${u.name}</td>
                <td style="padding: 1rem; color: var(--text-muted);">${u.email}</td>
                <td style="padding: 1rem;">
                    <span class="badge" style="background: #eef2ff; color: #4338ca;">${u.role}</span>
                </td>
                <td style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">${new Date(u.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem; text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button onclick="approveUser('${u.id}')" class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.75rem; background: var(--success);">Approve</button>
                        <button onclick="denyUser('${u.id}')" class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.75rem;">Deny</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading approvals:', error);
    }
}

async function approveUser(id) {
    if (!confirm('Are you sure you want to approve this user?')) return;
    try {
        const response = await authFetch(`${API_URL}/auth/approve/${id}`, { method: 'POST' });
        if (response.ok) {
            alert('User approved successfully!');
            loadApprovals();
        } else {
            const result = await response.json();
            alert(result.error || 'Approval failed');
        }
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

async function denyUser(id) {
    if (!confirm('Are you sure you want to deny this request? This will permanently delete the user.')) return;
    try {
        const response = await authFetch(`${API_URL}/auth/deny/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('User request denied and removed.');
            loadApprovals();
        } else {
            const result = await response.json();
            alert(result.error || 'Denial failed');
        }
    } catch (error) {
        console.error('Error denying user:', error);
    }
}
