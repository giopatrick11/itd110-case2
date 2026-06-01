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
const linkModal = document.getElementById('link-modal');

const registerForm = document.getElementById('register-form');
const incidentForm = document.getElementById('incident-form');
const searchForm = document.getElementById('search-form');
const linkForm = document.getElementById('link-form');

// State
let currentSection = 'dashboard';
let token = localStorage.getItem('token');
let userName = localStorage.getItem('userName');
let userRole = localStorage.getItem('userRole');
let dashboardData = null;
let trendsChart = null;
let currentPage = 1;
let totalPages = 1;
let editingIncidentId = null;
let linkingType = null;
let isCreatingNew = false;
let currentIncidentData = null;

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
        editingIncidentId = null;
        document.getElementById('modal-title').textContent = 'Report New Incident';
        document.getElementById('modal-description').textContent = 'Record the details of a new public safety event.';
        incidentForm.querySelector('button[type="submit"]').textContent = 'Submit to Logs';
        incidentForm.reset();
        incidentModal.classList.remove('hidden');
    });

    document.getElementById('open-register-form').addEventListener('click', () => {
        registerModal.classList.remove('hidden');
    });

    // Surgical Close: Close only the modal containing the clicked X
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });

    // Close on outside click (only the specific modal clicked)
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });

    // Close on ESC key (Close the topmost/latest modal first)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModals = Array.from(document.querySelectorAll('.modal:not(.hidden)'));
            if (visibleModals.length > 0) {
                // Close the last one added to the visible list (usually the topmost)
                visibleModals[visibleModals.length - 1].classList.add('hidden');
            }
        }
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    incidentForm.addEventListener('submit', handleIncidentSubmit);
    searchForm.addEventListener('submit', handleSearchSubmit);
    linkForm.addEventListener('submit', handleLinkSubmit);
    
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
    linkModal.classList.add('hidden');
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
            document.getElementById('download-backup').classList.remove('hidden');
        } else {
            navButtons.approvals.classList.add('hidden');
            document.getElementById('download-backup').classList.add('hidden');
        }

        // First Responders cannot report new incidents
        if (userRole === 'Responder') {
            document.getElementById('open-incident-form').classList.add('hidden');
        } else {
            document.getElementById('open-incident-form').classList.remove('hidden');
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

async function showQRCode(id) {
    try {
        const response = await authFetch(`${API_URL}/incidents/${id}/qrcode`);
        if (!response.ok) throw new Error('Failed to fetch QR code');
        const data = await response.json();

        document.getElementById('qr-image').src = data.qrCode;
        document.getElementById('qr-url').textContent = data.url;
        document.getElementById('download-qr').href = data.qrCode;
        
        qrModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading QR code:', error);
        alert('Failed to generate QR code. Please try again.');
    }
}

function startEditing() {
    if (!currentIncidentData) return;
    const incident = currentIncidentData;
    editingIncidentId = incident.id;
    
    // Fill form
    incidentForm.title.value = incident.title;
    incidentForm.type.value = incident.type;
    incidentForm.severity.value = incident.severity;
    
    // Format date for datetime-local input
    if (incident.date) {
        const d = new Date(incident.date);
        const formattedDate = d.toISOString().slice(0, 16);
        incidentForm.date.value = formattedDate;
    }
    
    incidentForm.description.value = incident.description;
    
    // Update modal UI
    document.getElementById('modal-title').textContent = 'Edit Incident Record';
    document.getElementById('modal-description').textContent = 'Modify the specific details and properties of this incident.';
    incidentForm.querySelector('button[type="submit"]').textContent = 'Save Changes';
    
    // Switch modals
    detailModal.classList.add('hidden');
    incidentModal.classList.remove('hidden');
}

async function handleIncidentSubmit(e) {
    e.preventDefault();
    const formData = new FormData(incidentForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const url = editingIncidentId ? `${API_URL}/incidents/${editingIncidentId}` : `${API_URL}/incidents`;
        const method = editingIncidentId ? 'PUT' : 'POST';

        const response = await authFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            incidentModal.classList.add('hidden');
            incidentForm.reset();
            editingIncidentId = null;
            
            if (currentSection === 'incidents') loadIncidents(currentPage);
            else if (currentSection === 'dashboard') loadDashboard();
            
            // If we were viewing detail, refresh it
            if (window.location.hash.includes('incident=')) {
                handleHashChange();
            }
        }
    } catch (error) {
        console.error('Error submitting incident:', error);
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
        currentIncidentData = data;
        
        const detailBody = document.getElementById('detail-body');
        document.getElementById('detail-title').textContent = data.title;
        
        let html = `
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="badge badge-${data.status}">${data.status}</span>
                        <span class="badge badge-${data.severity}">${data.severity}</span>
                        <span class="badge" style="background: #f1f5f9; color: var(--text-muted)">${data.type}</span>
                    </div>
                    ${userRole === 'Admin' ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick='toggleStatus("${data.id}")' class="btn ${data.status === 'Closed' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">
                                ${data.status === 'Closed' ? 'Reopen Record' : 'Close Record'}
                            </button>
                            ${data.status !== 'Closed' ? `
                                <button onclick='startEditing()' class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">Edit Record</button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">Occurred on ${new Date(data.date).toLocaleString()}</p>
                <p style="font-size: 1rem; line-height: 1.6;">${data.description}</p>
                ${data.status === 'Closed' ? `
                    <div style="background: #fff4f4; border: 1px solid #feb2b2; color: #c53030; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        This record is <strong>Closed</strong>. No further persons can be linked unless it is reopened.
                    </div>
                ` : ''}
            </div>
            
            <div style="background: var(--bg-main); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                <h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 1rem;">Contextual Intelligence</h4>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Location Context</p>
                    <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.5;">
                        ${data.location ? `
                            <p>This incident <strong>occurred at</strong> <span style="color: var(--primary); font-weight: 500;">${data.location.name}</span>.</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Address: ${data.location.address}</p>
                        ` : '<p style="color: var(--text-muted);">No location data recorded for this incident.</p>'}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <p style="font-size: 0.875rem; font-weight: 600; margin: 0;">Persons of Interest & Witnesses</p>
                        ${data.status !== 'Closed' && userRole !== 'Responder' ? `
                            <button onclick="openLinkModal('${data.id}', 'person')" class="btn btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">+ Link Person</button>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.6;">
                        ${data.persons && data.persons.length > 0 ? data.persons.map(p => {
                            let relText = '';
                            switch(p.relationship) {
                                case 'INVOLVED_IN': relText = 'was <strong>directly involved</strong> in'; break;
                                case 'WITNESSED': relText = '<strong>witnessed</strong>'; break;
                                case 'SUSPECTED_IN': relText = 'is a <strong>suspect</strong> in'; break;
                                default: relText = 'is connected to';
                            }
                            return `<p><span style="font-weight: 500;">${p.person.firstName} ${p.person.lastName}</span> ${relText} this incident.</p>`;
                        }).join('') : '<p style="color: var(--text-muted);">No persons have been linked to this record.</p>'}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <p style="font-size: 0.875rem; font-weight: 600; margin: 0;">Response Personnel</p>
                        ${userRole !== 'Responder' ? `
                            <button onclick="openLinkModal('${data.id}', 'responder')" class="btn btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">+ Link Responder</button>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.6;">
                        ${data.responders && data.responders.length > 0 ? data.responders.map(r => `
                            <p><span style="font-weight: 500;">${r.name}</span> from <span style="color: var(--text-muted);">${r.agency}</span> <strong>responded to</strong> this call.</p>
                        `).join('') : '<p style="color: var(--text-muted);">No emergency responders have been logged for this incident.</p>'}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <p style="font-size: 0.875rem; font-weight: 600; margin: 0;">Physical & Digital Evidence</p>
                        ${userRole !== 'Responder' ? `
                            <button onclick="openLinkModal('${data.id}', 'evidence')" class="btn btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">+ Add Evidence</button>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.6;">
                        ${data.evidence && data.evidence.length > 0 ? data.evidence.map(e => `
                            <p><span style="font-weight: 500;">${e.name}</span> (${e.type}) was <strong>recovered</strong> and is currently <span style="color: var(--primary); font-weight: 500;">${e.status}</span>.</p>
                        `).join('') : '<p style="color: var(--text-muted);">No evidence has been linked to this record.</p>'}
                    </div>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <p style="font-size: 0.875rem; font-weight: 600; margin: 0;">Formal Documentation</p>
                        ${userRole !== 'Responder' ? `
                            <button onclick="openLinkModal('${data.id}', 'report')" class="btn btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">+ File Report</button>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.6;">
                        ${data.reports && data.reports.length > 0 ? data.reports.map(rep => `
                            <p>Case Report <span style="font-weight: 500;">#${rep.reportNumber}</span> <strong>documents</strong> this incident.</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Summary: ${rep.summary}</p>
                        `).join('') : '<p style="color: var(--text-muted);">No formal reports have been filed for this incident.</p>'}
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

async function toggleStatus(id) {
    if (!confirm('Are you sure you want to change the status of this record?')) return;
    
    try {
        const response = await authFetch(`${API_URL}/incidents/${id}/status`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            // Refresh detail view
            viewIncidentDetail(id);
            // Refresh list if we are on incidents page
            if (currentSection === 'incidents') loadIncidents(currentPage);
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to toggle status');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        alert('An error occurred while toggling status');
    }
}

async function openLinkModal(incidentId, type, forceCreateNew = false) {
    linkingType = type;
    isCreatingNew = forceCreateNew;
    const formFields = document.getElementById('link-form-fields');
    formFields.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8125rem;">Loading options...</p>';
    
    let title = '';
    let description = '';
    
    try {
        const incidentResp = await authFetch(`${API_URL}/incidents/${incidentId}/graph`);
        const incidentData = await incidentResp.json();
        
        let existingHtml = '<div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;">';
        existingHtml += `<p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 1rem;">Currently Linked</p>`;
        
        let linkedItems = [];
        if (type === 'evidence') linkedItems = incidentData.evidence || [];
        else if (type === 'report') linkedItems = incidentData.reports || [];
        else if (type === 'person') linkedItems = incidentData.persons || [];
        else if (type === 'responder') linkedItems = incidentData.responders || [];

        if (linkedItems.length === 0) {
            existingHtml += `<p style="font-size: 0.875rem; color: var(--text-muted); font-style: italic;">No ${type} linked yet.</p>`;
        } else {
            existingHtml += `<ul style="list-style: none; padding: 0; margin: 0;">`;
            linkedItems.forEach(item => {
                let label = '';
                let id = '';
                if (type === 'evidence') { label = `${item.name} (${item.type})`; id = item.id; }
                else if (type === 'report') { label = `Report #${item.reportNumber}`; id = item.id; }
                else if (type === 'person') { label = `${item.person.firstName} ${item.person.lastName} (${item.relationship})`; id = item.person.id; }
                else if (type === 'responder') { label = `${item.name} (${item.agency})`; id = item.id; }

                existingHtml += `
                    <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed var(--border);">
                        <span style="font-size: 0.875rem; font-weight: 500;">${label}</span>
                        <button type="button" onclick="removeLink('${incidentId}', '${id}', '${type}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">Remove</button>
                    </li>
                `;
            });
            existingHtml += `</ul>`;
        }
        existingHtml += '</div>';

        let formPart = `<input type="hidden" name="incidentId" value="${incidentId}">`;
        formPart += `<input type="hidden" name="isCreatingNew" value="${isCreatingNew}">`;

        if (type === 'evidence') {
            title = 'Add Incident Evidence';
            description = 'Log a piece of physical or digital evidence related to this case.';
            formPart += `
                <div class="form-group">
                    <label>Evidence Name/Item</label>
                    <input type="text" name="name" placeholder="e.g. Broken Lock, Security Footage" required>
                </div>
                <div class="form-row" style="display: flex; gap: 1rem;">
                    <div class="form-group" style="flex: 1;">
                        <label>Evidence Type</label>
                        <select name="type">
                            <option value="Physical">Physical</option>
                            <option value="Digital">Digital</option>
                            <option value="Forensic">Forensic</option>
                            <option value="Documentary">Documentary</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Current Status</label>
                        <select name="status">
                            <option value="Logged">Logged</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Transferred">Transferred</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Storage Location</label>
                    <input type="text" name="storageLocation" placeholder="e.g. Locker A-101">
                </div>
            `;
        } else if (type === 'report') {
            title = 'File Formal Documentation';
            description = 'Submit a formal report summary for this incident.';
            formPart += `
                <div class="form-group">
                    <label>Report Number</label>
                    <input type="text" name="reportNumber" placeholder="e.g. REP-2026-001" required>
                </div>
                <div class="form-group">
                    <label>Brief Summary</label>
                    <input type="text" name="summary" placeholder="One-sentence overview of findings" required>
                </div>
                <div class="form-group">
                    <label>Full Narrative</label>
                    <textarea name="fullText" rows="4" placeholder="Provide complete formal details..." required></textarea>
                </div>
                <div class="form-group">
                    <label>Classification</label>
                    <select name="classification">
                        <option value="Internal">Internal Only</option>
                        <option value="Public">Public Record</option>
                        <option value="Restricted">Restricted Access</option>
                    </select>
                </div>
            `;
        } else if (type === 'person') {
            title = isCreatingNew ? 'Create New Person' : 'Link Person of Interest';
            description = isCreatingNew ? 'Register a new person and link them to this incident.' : 'Connect an existing individual to this incident.';
            
            const toggleBtn = `<button type="button" onclick="openLinkModal('${incidentId}', 'person', ${!isCreatingNew})" class="btn btn-secondary" style="font-size: 0.75rem; margin-bottom: 1rem;">
                ${isCreatingNew ? '← Choose Existing' : '+ Create New Person'}
            </button>`;

            if (isCreatingNew) {
                formPart += `
                    ${toggleBtn}
                    <div class="form-row" style="display: flex; gap: 1rem;">
                        <div class="form-group" style="flex: 1;">
                            <label>First Name</label>
                            <input type="text" name="firstName" placeholder="John" required>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Last Name</label>
                            <input type="text" name="lastName" placeholder="Doe" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>System Role/Title</label>
                        <input type="text" name="role" placeholder="e.g. Witness, Resident, Student">
                    </div>
                    <div class="form-group">
                        <label>Contact Number</label>
                        <input type="text" name="contactNumber" placeholder="e.g. 09123456789">
                    </div>
                    <div class="form-group">
                        <label>Involvement Role in this Incident</label>
                        <select name="relationship" required>
                            <option value="INVOLVED_IN">Directly Involved</option>
                            <option value="WITNESSED">Witness</option>
                            <option value="SUSPECTED_IN">Suspect</option>
                        </select>
                    </div>
                `;
            } else {
                const resp = await authFetch(`${API_URL}/persons`);
                const persons = await resp.json();
                formPart += `
                    ${toggleBtn}
                    <div class="form-group">
                        <label>Select Existing Person</label>
                        <select name="personId" required>
                            <option value="">-- Choose Person --</option>
                            ${persons.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.role})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Involvement Role</label>
                        <select name="relationship" required>
                            <option value="INVOLVED_IN">Directly Involved</option>
                            <option value="WITNESSED">Witness</option>
                            <option value="SUSPECTED_IN">Suspect</option>
                        </select>
                    </div>
                `;
            }
        } else if (type === 'responder') {
            title = isCreatingNew ? 'Add New Responder' : 'Link Response Personnel';
            description = isCreatingNew ? 'Create a new responder record and link them to this call.' : 'Record which responder handled this specific incident.';
            
            const toggleBtn = `<button type="button" onclick="openLinkModal('${incidentId}', 'responder', ${!isCreatingNew})" class="btn btn-secondary" style="font-size: 0.75rem; margin-bottom: 1rem;">
                ${isCreatingNew ? '← Choose Existing' : '+ Add New Responder'}
            </button>`;

            if (isCreatingNew) {
                formPart += `
                    ${toggleBtn}
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" placeholder="Officer Name" required>
                    </div>
                    <div class="form-group">
                        <label>Agency/Department</label>
                        <input type="text" name="agency" placeholder="e.g. Campus Security, PNP, BFP" required>
                    </div>
                    <div class="form-group">
                        <label>Position/Title</label>
                        <input type="text" name="role" placeholder="e.g. Desk Officer, Patrolman">
                    </div>
                    <div class="form-group">
                        <label>Contact Number</label>
                        <input type="text" name="contactNumber" placeholder="e.g. 09123456789">
                    </div>
                `;
            } else {
                const resp = await authFetch(`${API_URL}/responders`);
                const responders = await resp.json();
                formPart += `
                    ${toggleBtn}
                    <div class="form-group">
                        <label>Select Existing Responder</label>
                        <select name="responderId" required>
                            <option value="">-- Choose Responder --</option>
                            ${responders.map(r => `<option value="${r.id}">${r.name} (${r.agency})</option>`).join('')}
                        </select>
                    </div>
                `;
            }
        }

        formFields.innerHTML = existingHtml + formPart;
        document.getElementById('link-modal-title').textContent = title;
        document.getElementById('link-modal-description').textContent = description;
        linkModal.classList.remove('hidden');

    } catch (e) { 
        console.error('Error opening link modal:', e);
        alert('Failed to load linking options. Please try again.');
    }
}

async function removeLink(incidentId, entityId, type) {
    if (!confirm(`Are you sure you want to remove this ${type} link?`)) return;

    try {
        let url = '';
        if (type === 'person') url = `${API_URL}/incidents/${incidentId}/persons/${entityId}`;
        else if (type === 'responder') url = `${API_URL}/incidents/${incidentId}/responders/${entityId}`;
        else if (type === 'evidence') url = `${API_URL}/evidence/${entityId}`;
        else if (type === 'report') url = `${API_URL}/reports/${entityId}`;

        const response = await authFetch(url, { method: 'DELETE' });
        if (response.ok) {
            // Refresh modal and detail view
            openLinkModal(incidentId, type);
            viewIncidentDetail(incidentId);
        } else {
            const err = await response.json();
            alert(err.message || 'Failed to remove link');
        }
    } catch (error) {
        console.error('Error removing link:', error);
    }
}

async function handleLinkSubmit(e) {
    e.preventDefault();
    const formData = new FormData(linkForm);
    const data = Object.fromEntries(formData.entries());
    const incidentId = data.incidentId;
    const isCreating = data.isCreatingNew === 'true';

    console.log('Submitting link:', linkingType, 'CreatingNew:', isCreating, data);

    try {
        let url = '';
        let body = JSON.stringify(data);
        let method = 'POST';

        if (linkingType === 'evidence') {
            url = `${API_URL}/evidence`;
        } else if (linkingType === 'report') {
            url = `${API_URL}/reports`;
        } else if (linkingType === 'person') {
            if (isCreating) {
                // First create person, then link
                const personResp = await authFetch(`${API_URL}/persons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const newPerson = await personResp.json();
                if (!personResp.ok) throw new Error(newPerson.error || 'Failed to create person');
                
                url = `${API_URL}/incidents/${incidentId}/persons/${newPerson.id}`;
                body = JSON.stringify({ relationship: data.relationship });
            } else {
                url = `${API_URL}/incidents/${incidentId}/persons/${data.personId}`;
                body = JSON.stringify({ relationship: data.relationship });
            }
        } else if (linkingType === 'responder') {
            if (isCreating) {
                // First create responder, then link
                const responderResp = await authFetch(`${API_URL}/responders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const newResponder = await responderResp.json();
                if (!responderResp.ok) throw new Error(newResponder.error || 'Failed to create responder');

                url = `${API_URL}/incidents/${incidentId}/responders/${newResponder.id}`;
                body = null;
            } else {
                url = `${API_URL}/incidents/${incidentId}/responders/${data.responderId}`;
                body = null;
            }
        }

        const response = await authFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        if (response.ok) {
            console.log('Link successful');
            linkModal.classList.add('hidden');
            linkForm.reset();
            // Refresh detail view
            viewIncidentDetail(incidentId);
            alert(`${linkingType.charAt(0).toUpperCase() + linkingType.slice(1)} ${isCreating ? 'created and linked' : 'linked'} successfully.`);
        } else {
            const err = await response.json();
            console.error('Link failed:', err);
            alert(err.message || err.error || 'Linking failed');
        }
    } catch (error) {
        console.error('Error linking entity:', error);
        alert(error.message);
    }
}

// Admin Functions
async function loadApprovals() {
    try {
        console.log('Fetching all users...');
        const response = await authFetch(`${API_URL}/auth/users`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const err = await response.json();
            console.error('Failed to fetch users:', err);
            return;
        }

        const users = await response.json();
        console.log('Users found:', users);
        
        const tbody = document.getElementById('pending-users-body');
        if (!tbody) {
            console.error('Table body #pending-users-body not found!');
            return;
        }
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem; font-weight: 600;">${u.name}</td>
                <td style="padding: 1rem; color: var(--text-muted);">${u.email}</td>
                <td style="padding: 1rem;">
                    <span class="badge" style="background: #eef2ff; color: #4338ca;">${u.role}</span>
                </td>
                <td style="padding: 1rem;">
                    <span class="badge badge-${u.status || 'Active'}">${u.status || 'Active'}</span>
                </td>
                <td style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">${new Date(u.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem; text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        ${u.status === 'Pending' ? `
                            <button onclick="approveUser('${u.id}')" class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.75rem; background: var(--success);">Approve</button>
                        ` : ''}
                        <button onclick="denyUser('${u.id}')" class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.75rem;">${u.status === 'Pending' ? 'Deny' : 'Delete'}</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
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
