import CONFIG from "./config.js";
const API_BASE_URL = CONFIG.API_URL;
const AUTH_TOKEN = localStorage.getItem('token');
let CURRENT_USER_ID   = null;
let CURRENT_USER_ROLE = null;

document.addEventListener('DOMContentLoaded', function() {
  // Debug API configuration
  console.log('🔍 API Configuration Debug:');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('AUTH_TOKEN exists:', !!AUTH_TOKEN);
  console.log('AUTH_TOKEN preview:', AUTH_TOKEN ? AUTH_TOKEN.substring(0, 20) + '...' : 'No token');
  
  if (!AUTH_TOKEN) {
    window.location.href = '../../index.html';
    return;
  }

  getCurrentUser();

  if (CURRENT_USER_ROLE !== 'ADMIN') {
    alert('Anda tidak memiliki izin mengakses halaman ini.');
    window.location.href = '../../index.html';
    return;
  }

  initializePage();
  loadMahasiswa();
});

function initializePage() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.getAttribute('data-tab'));
        });
    });
    
    document.getElementById('createAdminForm').addEventListener('submit', handleCreateAdmin);
    document.getElementById('createDosenForm').addEventListener('submit', handleCreateDosen);
    document.getElementById('updateRoleForm').addEventListener('submit', handleUpdateRole);
    
    document.getElementById('newRole').addEventListener('change', toggleAdditionalFields);
    
    // Safe element access
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeUpdateRoleModal);
    }
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('updateRoleModal');
        if (event.target === modal) {
            closeUpdateRoleModal();
        }
    });
}

function getCurrentUser() {
  try {
    const tokenParts = AUTH_TOKEN.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      CURRENT_USER_ID   = payload.sub   || payload.userId || payload.id;
      CURRENT_USER_ROLE = payload.role  
                            || (payload.roles && payload.roles[0])
                            || '';
      console.log('Current user role:', CURRENT_USER_ROLE);
    }
  } catch (e) {
    console.error('Error decoding token:', e);
  }
}

let switchTabTimeout;

function switchTab(tabName) {
    // Debounce rapid tab switches
    if (switchTabTimeout) {
        clearTimeout(switchTabTimeout);
    }
    
    switchTabTimeout = setTimeout(() => {
        // Remove active from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate clicked tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show target content
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        switch(tabName) {
            case 'mahasiswa':
                loadMahasiswa();
                break;
            case 'dosen':
                loadDosen();
                break;
            case 'admin':
                loadAdmin();
                break;
        }
        
        clearAlerts();
    }, 100); // Wait 100ms before switching
}

async function loadMahasiswa() {
    try {
        const mahasiswa = await apiCall('/mahasiswa'); // Remove /api prefix
        const tbody = document.querySelector('#mahasiswaTable tbody');
        
        if (mahasiswa && mahasiswa.length > 0) {
            tbody.innerHTML = mahasiswa.map(mhs => {
                const isCurrentUser = mhs.id === CURRENT_USER_ID;
                
                return `
                <tr>
                    <td>${mhs.namaLengkap || 'N/A'}</td>
                    <td>${mhs.email || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            ${!isCurrentUser ? `
                                <button class="btn-small edit" onclick="openUpdateRoleModal('${mhs.id}', '${mhs.email}', 'MAHASISWA', '${mhs.namaLengkap || ''}')">
                                    Update Role
                                </button>
                                <button class="btn-small delete" onclick="confirmDeleteUser('${mhs.id}', 'MAHASISWA')">
                                    Delete
                                </button>
                            ` : `
                                <span style="color: #666; font-style: italic;">Akun Anda</span>
                            `}
                        </div>
                    </td>
                </tr>
            `;}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Tidak ada data mahasiswa</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading mahasiswa:', error);
        showAlert('mahasiswaAlert', 'error', 'Gagal memuat data mahasiswa');
    }
}

async function loadDosen() {
    try {
        const dosen = await apiCall('/dosen');
        const tbody = document.querySelector('#dosenTable tbody');
        
        if (dosen && dosen.length > 0) {
            tbody.innerHTML = dosen.map(dsn => {
                const isCurrentUser = dsn.id === CURRENT_USER_ID;
                
                return `
                <tr>
                    <td>${dsn.namaLengkap || 'N/A'}</td>
                    <td>${dsn.email || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            ${!isCurrentUser ? `
                                <button class="btn-small edit" onclick="openUpdateRoleModal('${dsn.id}', '${dsn.email}', 'DOSEN', '${dsn.namaLengkap || ''}')">
                                    Update Role
                                </button>
                                <button class="btn-small delete" onclick="confirmDeleteUser('${dsn.id}', 'DOSEN')">
                                    Delete
                                </button>
                            ` : `
                                <span style="color: #666; font-style: italic;">Akun Anda</span>
                            `}
                        </div>
                    </td>
                </tr>
            `;}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Tidak ada data dosen</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading dosen:', error);
        showAlert('dosenAlert', 'error', 'Gagal memuat data dosen');
    }
}

async function loadAdmin() {
    try {
        const admin = await apiCall('/admin');
        const tbody = document.querySelector('#adminTable tbody');
        
        if (admin && admin.length > 0) {
            tbody.innerHTML = admin.map(adm => {
                const isCurrentUser = adm.id === CURRENT_USER_ID;
                
                return `
                <tr>
                    <td>${adm.email || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            ${!isCurrentUser ? `
                                <button class="btn-small edit" onclick="openUpdateRoleModal('${adm.id}', '${adm.email}', 'ADMIN', 'Admin')">
                                    Update Role
                                </button>
                                <button class="btn-small delete" onclick="confirmDeleteUser('${adm.id}', 'ADMIN')">
                                    Delete
                                </button>
                            ` : `
                                <span style="color: #666; font-style: italic;">Akun Anda</span>
                            `}
                        </div>
                    </td>
                </tr>
            `;}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Tidak ada data admin</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading admin:', error);
        showAlert('adminAlert', 'error', 'Gagal memuat data admin');
    }
}

async function handleCreateAdmin(e) {
  e.preventDefault();
  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (!isValidEmail(email)) {
    showAlert('createAdminAlert','error','Format email tidak valid');
    return;
  }
  if (password.length < 6) {
    showAlert('createAdminAlert','error','Password minimal 6 karakter');
    return;
  }

  try {
    showButtonLoading('createAdminBtn','createAdminLoader');
    await apiCall('/admin','POST',{ email, password });
    showAlert('createAdminAlert','success','Admin berhasil dibuat!');
    document.getElementById('createAdminForm').reset();
    if (document.querySelector('.tab.active').dataset.tab==='admin') loadAdmin();

  }catch (err) {
  console.error('Error creating admin:', err);
  const raw = err.message || '';
  let msg;

  if ( raw.toLowerCase().includes('email is already taken') ) {
    msg = 'Email ini sudah digunakan';
  } else {
    msg = raw;
  }

  showAlert('createAdminAlert','error', msg);
}
 finally {
    hideButtonLoading('createAdminBtn','createAdminLoader');
  }
}

async function handleCreateDosen(e) {
    e.preventDefault();

    const name     = document.getElementById('dosenName').value.trim();
    const nip      = document.getElementById('dosenNIP').value.trim();
    const email    = document.getElementById('dosenEmail').value.trim();
    const password = document.getElementById('dosenPassword').value;

    if (name.length < 3) {
        showAlert('createDosenAlert','error','Nama lengkap minimal 3 karakter');
        return;
    }
    if (nip.length !=10) {
        showAlert('createDosenAlert','error','NIP harus 10 karakter');
        return;
    }
    if (!isValidEmail(email)) {
        showAlert('createDosenAlert','error','Format email tidak valid');
        return;
    }
    if (password.length < 6) {
        showAlert('createDosenAlert','error','Password minimal 6 karakter');
        return;
    }

    try {
        showButtonLoading('createDosenBtn','createDosenLoader');

        await apiCall('/dosen','POST',{
            namaLengkap: name,
            nip,
            email,
            password
        });

        showAlert('createDosenAlert','success','Dosen berhasil dibuat!');
        document.getElementById('createDosenForm').reset();
        if (document.querySelector('.tab.active').dataset.tab === 'dosen') {
            loadDosen();
        }

    } catch (err) {
        console.error('Error creating dosen:', err);
        let msg = err.message || 'Gagal membuat dosen';
        if (msg.toLowerCase().includes('email')) {
            msg = 'Email ini sudah digunakan';
        } else if (msg.toLowerCase().includes('nip')) {
            msg = 'NIP ini sudah terdaftar untuk dosen lain';
        }
        showAlert('createDosenAlert','error', msg);

    } finally {
        hideButtonLoading('createDosenBtn','createDosenLoader');
    }
}

function openUpdateRoleModal(userId, userEmail, currentRole, currentName = '') {
    console.log('=== openUpdateRoleModal Debug ===');
    console.log('Raw userId parameter:', userId);
    console.log('Type of userId:', typeof userId);
    console.log('userEmail:', userEmail);
    console.log('currentRole:', currentRole);
    console.log('currentName:', currentName);
    console.log('================================');
    
    if (userId === CURRENT_USER_ID) {
        alert('Anda tidak dapat mengubah role akun Anda sendiri.');
        return;
    }
    
    if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('Invalid userId:', userId);
        alert('Error: User ID tidak valid. Data: ' + JSON.stringify({userId, userEmail, currentRole}));
        return;
    }
    
    document.getElementById('updateUserId').value = userId;
    document.getElementById('currentUserRole').value = currentRole;
    document.getElementById('updateUserInfo').value = `${userEmail} (${currentRole})`;
    document.getElementById('newRole').value = '';
    
    if (currentName && currentName !== 'N/A' && currentName !== 'Admin') {
        document.getElementById('updateNamaLengkap').value = currentName;
    } else {
        document.getElementById('updateNamaLengkap').value = '';
    }
    
    document.getElementById('updateNip').value = '';
    document.getElementById('updateNpm').value = '';
    document.getElementById('additionalFields').style.display = 'none';
    
    // Simple modal show - support both methods
    const modal = document.getElementById('updateRoleModal');
    modal.style.display = 'block';
    modal.classList.remove('hidden');
    
    clearAlert('updateRoleAlert');
}

function toggleAdditionalFields() {
    const newRole = document.getElementById('newRole').value;
    const currentRole = document.getElementById('currentUserRole').value;
    const additionalFields = document.getElementById('additionalFields');
    const namaLengkapGroup = document.getElementById('namaLengkapGroup');
    const nipGroup = document.getElementById('nipGroup');
    const npmGroup = document.getElementById('npmGroup');
    
    additionalFields.style.display = 'none';
    namaLengkapGroup.style.display = 'none';
    nipGroup.style.display = 'none';
    npmGroup.style.display = 'none';
    
    if (newRole && newRole !== currentRole) {
        if (newRole === 'DOSEN') {
            additionalFields.style.display = 'block';
            namaLengkapGroup.style.display = 'block';
            nipGroup.style.display = 'block';
            
            document.getElementById('updateNamaLengkap').required = true;
            document.getElementById('updateNip').required = true;
            document.getElementById('updateNpm').required = false;
        } else if (newRole === 'MAHASISWA') {
            additionalFields.style.display = 'block';
            namaLengkapGroup.style.display = 'block';
            npmGroup.style.display = 'block';
            
            document.getElementById('updateNamaLengkap').required = true;
            document.getElementById('updateNpm').required = true;
            document.getElementById('updateNip').required = false;
        } else if (newRole === 'ADMIN') {
            document.getElementById('updateNamaLengkap').required = false;
            document.getElementById('updateNip').required = false;
            document.getElementById('updateNpm').required = false;
        }
    }
}

function closeUpdateRoleModal() {
    // Simple modal hide - support both methods
    const modal = document.getElementById('updateRoleModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    document.getElementById('updateRoleForm').reset();
    document.getElementById('additionalFields').style.display = 'none';
    clearAlert('updateRoleAlert');
}

const ERROR_MAP = {
  'email is already taken': 'Email ini sudah digunakan, silakan pilih yang lain',
  'nip is already taken':   'NIP ini sudah terdaftar untuk dosen lain',
  'npm is already taken':   'NPM ini sudah terdaftar untuk mahasiswa lain',
};

function friendlyMessage(raw = '') {
  const lower = raw.toLowerCase();
  for (const key in ERROR_MAP) {
    if (lower.includes(key)) {
      return ERROR_MAP[key];
    }
  }
  return raw;
}

async function handleUpdateRole(e) {
  e.preventDefault();

  const userId      = document.getElementById('updateUserId').value;
  const currentRole = document.getElementById('currentUserRole').value;
  const newRole     = document.getElementById('newRole').value;

  if (newRole === currentRole) {
    showAlert('updateRoleAlert','error','Role baru sama dengan role saat ini');
    return;
  }

  let requestBody = { role: newRole };
  if (newRole === 'DOSEN') {
    const nama = document.getElementById('updateNamaLengkap').value.trim();
    const nip  = document.getElementById('updateNip').value.trim();
    if (!nama || nama.length < 3) {
      showAlert('updateRoleAlert','error','Nama lengkap minimal 3 karakter');
      return;
    }
    if (!nip || nip.length < 5) {
      showAlert('updateRoleAlert','error','NIP tidak valid');
      return;
    }
    requestBody.namaLengkap = nama;
    requestBody.nip         = nip;
  }
  if (newRole === 'MAHASISWA') {
    const nama = document.getElementById('updateNamaLengkap').value.trim();
    const npm  = document.getElementById('updateNpm').value.trim();
    if (!nama || nama.length < 3) {
      showAlert('updateRoleAlert','error','Nama lengkap minimal 3 karakter');
      return;
    }
    if (!npm || npm.length !== 10) {
      showAlert('updateRoleAlert','error','NPM harus 10 digit');
      return;
    }
    requestBody.namaLengkap = nama;
    requestBody.npm         = npm;
  }

  try {
    const endpoint = `/${currentRole.toLowerCase()}/${userId}`;
    await apiCall(endpoint, 'PATCH', requestBody);

    showAlert('updateRoleAlert','success','Role berhasil diupdate!');

    loadMahasiswa();
    loadDosen();
    loadAdmin();

    setTimeout(closeUpdateRoleModal, 1000);

  } catch (err) {
    console.error('Error updating role:', err);
    const msg = friendlyMessage(err.message);
    showAlert('updateRoleAlert','error', msg);
  }
}

async function deleteUser(userId, userRole) {
    console.log('🗑️ DELETE USER DEBUG:');
    console.log('userId:', userId);
    console.log('userRole:', userRole);
    
    try {
        let endpoint;
        switch(userRole) {
            case 'ADMIN':
                endpoint = `/admin/${userId}`;
                break;
            case 'DOSEN':
                endpoint = `/dosen/${userId}`;
                break;
            case 'MAHASISWA':
                endpoint = `/mahasiswa/${userId}`;
                break;
            default:
                throw new Error('Role tidak valid');
        }
        
        console.log('🌐 DELETE endpoint:', endpoint);
        await apiCall(endpoint, 'DELETE');
        console.log('✅ DELETE API call successful');
        
        const activeTab = document.querySelector('.tab.active');
        console.log('🔍 Active tab element:', activeTab);
        console.log('🔍 Active tab data-tab:', activeTab?.getAttribute('data-tab'));
        
        const activeTabName = activeTab?.getAttribute('data-tab');
        const alertId = getAlertIdByTab(activeTabName);
        
        console.log('📢 Showing success alert:', alertId);
        showAlert(alertId, 'success', `${userRole} berhasil dihapus!`);
        
        console.log('🔄 Reloading table data for tab:', activeTabName);
        
        // FORCE reload based on current tab
        switch(activeTabName) {
            case 'mahasiswa':
                console.log('🔄 Reloading mahasiswa data...');
                await loadMahasiswa();
                break;
            case 'dosen':
                console.log('🔄 Reloading dosen data...');
                await loadDosen();
                break;
            case 'admin':
                console.log('🔄 Reloading admin data...');
                await loadAdmin();
                break;
            default:
                console.log('⚠️ Unknown tab, reloading all data...');
                await loadMahasiswa();
                await loadDosen();
                await loadAdmin();
        }
        
        console.log('✅ Table reload completed');
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        const activeTab = document.querySelector('.tab.active');
        const alertId = getAlertIdByTab(activeTab?.getAttribute('data-tab'));
        showAlert(alertId, 'error', error.message || 'Gagal menghapus user');
    }
}

function getAlertIdByTab(tabName) {
    const alertMap = {
        'mahasiswa': 'mahasiswaAlert',
        'dosen': 'dosenAlert',
        'admin': 'adminAlert'
    };
    return alertMap[tabName] || 'mahasiswaAlert';
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('token');
        
    fetch(`${API_BASE_URL}${CONFIG.AUTH_ENDPOINT}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        }).catch(error => {
            console.warn('Logout API call failed:', error);
        }).finally(() => {
            window.location.href = '../../index.html';
        });
    }
}

// Enhanced apiCall with retry mechanism
async function apiCall(endpoint, method = 'GET', body = null, retryCount = 0) {
    const config = {
        method,
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body && ['POST','PUT','PATCH'].includes(method)) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        let payload = null;
        try {
            payload = await response.json();
        } catch (_) {}

        if (!response.ok) {
            // If 500 error and we haven't retried yet, try again
            if (response.status === 500 && retryCount < 2) {
                console.log(`🔄 Retrying API call (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return apiCall(endpoint, method, body, retryCount + 1);
            }
            
            const backendMsg =
                payload?.message ||
                payload?.error ||
                (payload?.errors && JSON.stringify(payload.errors)) ||
                `${response.status} ${response.statusText}`;

            throw new Error(backendMsg);
        }

        if (method === 'DELETE') {
            return {};
        }

        return payload?.data !== undefined ? payload.data : payload;
        
    } catch (error) {
        // Retry on network errors
        if (error.name === 'TypeError' && retryCount < 2) {
            console.log(`🔄 Network error, retrying (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiCall(endpoint, method, body, retryCount + 1);
        }
        
        throw error;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showAlert(containerId, type, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert ${type}">${message}</div>`;
    }
}

function clearAlert(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

function clearAlerts() {
    const alertIds = ['mahasiswaAlert', 'dosenAlert', 'adminAlert', 'createAdminAlert', 'createDosenAlert'];
    alertIds.forEach(id => clearAlert(id));
}

function showButtonLoading(buttonId, loaderId) {
    const button = document.getElementById(buttonId);
    const loader = document.getElementById(loaderId);
    
    if (button && loader) {
        button.disabled = true;
        loader.style.display = 'inline-block';
        const span = button.querySelector('span');
        if (span) {
            span.style.marginLeft = '10px';
        }
    }
}

function hideButtonLoading(buttonId, loaderId) {
    const button = document.getElementById(buttonId);
    const loader = document.getElementById(loaderId);
    
    if (button && loader) {
        button.disabled = false;
        loader.style.display = 'none';
        const span = button.querySelector('span');
        if (span) {
            span.style.marginLeft = '0';
        }
    }
}

// ✅ GLOBAL EXPORTS - Clean version without duplicates
window.openUpdateRoleModal = openUpdateRoleModal;
window.closeUpdateRoleModal = closeUpdateRoleModal;
window.deleteUser = deleteUser;

// Single confirmDeleteUser function declaration
window.confirmDeleteUser = function(userId, role) {
    console.log('🔧 confirmDeleteUser called with:', userId, role);
    console.log('🔧 deleteUser function type:', typeof deleteUser);
    
    if (confirm(`Apakah Anda yakin ingin menghapus ${role.toLowerCase()} ini?`)) {
        console.log('✅ User confirmed deletion, calling deleteUser...');
        deleteUser(userId, role);
    } else {
        console.log('❌ User cancelled deletion');
    }
};

// Global functions for onclick handlers
window.openUpdateRoleModal = openUpdateRoleModal;
window.closeUpdateRoleModal = closeUpdateRoleModal;
window.deleteUser = deleteUser;

// Fix confirmDeleteUser function
window.confirmDeleteUser = function(userId, role) {
    console.log('confirmDeleteUser called with:', userId, role);
    if (confirm(`Apakah Anda yakin ingin menghapus ${role.toLowerCase()} ini?`)) {
        console.log('User confirmed deletion, calling deleteUser...');
        deleteUser(userId, role);
    } else {
        console.log('User cancelled deletion');
    }
};

// Also make it available without window
function confirmDeleteUser(userId, role) {
    window.confirmDeleteUser(userId, role);
}