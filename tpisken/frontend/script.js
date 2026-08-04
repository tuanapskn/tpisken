function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

createParticles();

const getApiBase = () => {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('messageArea');
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    messageArea.innerHTML = `<div class="${type}">${icon} ${message}</div>`;
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 5000);
}

function setSubmitButton(loading = false) {
    const btn = document.getElementById('submitBtn');
    btn.disabled = loading;
    btn.innerHTML = loading ? 
        '<i class="fas fa-spinner fa-spin"></i> Adding Customer...' : 
        '<i class="fas fa-plus-circle"></i> Add Customer';
}

function updateConnectionStatus(isHealthy) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (isHealthy) {
        indicator.className = 'status-indicator status-healthy';
        statusText.innerHTML = '<i class="fas fa-check-circle"></i> Connected to System';
    } else {
        indicator.className = 'status-indicator status-unhealthy';
        statusText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection Issues';
    }
}

async function checkServiceHealth() {
    try {
        const response = await fetch(API_BASE.replace('/api', '/health'));
        const health = await response.json();
        console.log('Service health:', health);
        const isHealthy = health.status === 'healthy';
        updateConnectionStatus(isHealthy);
        return isHealthy;
    } catch (error) {
        console.error('Service health check failed:', error);
        updateConnectionStatus(false);
        return false;
    }
}

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.log(`Retry ${i + 1}/${maxRetries} for ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setSubmitButton(true);
    
    const userData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };
    
    try {
        const response = await fetchWithRetry(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('userForm').reset();
            loadUsers();
            showMessage('Customer added successfully!', 'success');
        } else {
            showMessage('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Network error: Unable to add customer. Please try again.', 'error');
        console.error('Error adding user:', error);
    } finally {
        setSubmitButton(false);
    }
});

async function loadUsers() {
    const loading = document.getElementById('loading');
    const usersList = document.getElementById('usersList');
    
    loading.style.display = 'flex';
    usersList.innerHTML = '';
    
    try {
        const response = await fetchWithRetry(`${API_BASE}/users`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            if (result.users.length === 0) {
                usersList.innerHTML = `
                    <div class="empty-state">
                        <img src="migros1.png" alt="Migros">
                        <h3>No customers registered yet</h3>
                        <p>Add your first customer using the form above to get started!</p>
                    </div>
                `;
            } else {
                usersList.innerHTML = result.users.map(user => `
                    <div class="user-item">
                        <div class="user-info">
                            <div class="user-name">
                                <i class="fas fa-user-circle"></i>
                                ${escapeHtml(user.name)}
                            </div>
                            <div><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div>
                            ${user.phone ? `<div><i class="fas fa-phone"></i> ${escapeHtml(user.phone)}</div>` : ''}
                            <div class="user-meta">
                                <i class="fas fa-clock"></i>
                                Registered: ${new Date(user.created_at).toLocaleString()}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                `).join('');
            }
        } else {
            usersList.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> Error loading customers: ${result.message}</div>`;
        }
    } catch (error) {
        usersList.innerHTML = '<div class="error"><i class="fas fa-wifi"></i> System temporarily unavailable. Please check your connection.</div>';
        console.error('Error loading users:', error);
    } finally {
        loading.style.display = 'none';
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to remove this customer? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetchWithRetry(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            loadUsers();
            showMessage('Customer removed successfully!', 'success');
        } else {
            showMessage('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Network error: Unable to remove customer. Please try again.', 'error');
        console.error('Error deleting user:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function initApp() {
    console.log('🚀 Initializing Registration System...');
    
    const isHealthy = await checkServiceHealth();
    
    if (isHealthy) {
        console.log('✅ System is healthy, loading customers...');
        loadUsers();
    } else {
        console.log('⚠️ System is not healthy, retrying in 5 seconds...');
        document.getElementById('usersList').innerHTML = 
            '<div class="error"><i class="fas fa-sync-alt fa-spin"></i> Unable to connect to server. Retrying...</div>';
        setTimeout(initApp, 5000);
    }
}

setInterval(checkServiceHealth, 30000);
initApp();