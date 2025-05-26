import CONFIG from './config.js';
const BACKEND_URL = CONFIG.API_URL;
const AUTH_TOKEN = localStorage.getItem('token') || '';
let CURRENT_USER_ID = null;
let CURRENT_USER_ROLE = null;

function getCurrentUser() {
  try {
    const tokenParts = AUTH_TOKEN.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      CURRENT_USER_ID   = payload.sub   || payload.userId || payload.id;
      CURRENT_USER_ROLE = payload.role  
                            || (payload.roles && payload.roles[0])
                            || '';
      console.log('Current user ID:', CURRENT_USER_ID);
      console.log('Current user role:', CURRENT_USER_ROLE);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error decoding token:', e);
    return false;
  }
}

function redirectToLogin() {
  // Clear any existing token
  localStorage.removeItem('token');
  localStorage.removeItem('selectedLowonganId');
  
  // Use relative path that works both locally and on Vercel
  const currentPath = window.location.pathname;
  let loginPath;
  
  if (currentPath.includes('/pages/dashboard/')) {
    // We're in /pages/dashboard/, so go back two levels
    loginPath = '../../index.html';
  } else if (currentPath.includes('/pages/')) {
    // We're in some other /pages/ subfolder, go back one level
    loginPath = '../index.html';
  } else {
    // We're at root level
    loginPath = 'index.html';
  }
  
  console.log('Redirecting to login:', loginPath);
  window.location.href = loginPath;
}

window.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const dashboardContent = document.getElementById('dashboard-content');

  console.log('=== Dashboard Authentication Check ===');
  console.log('Token exists:', !!AUTH_TOKEN);
  console.log('Current path:', window.location.pathname);

  // Check authentication first
  if (!AUTH_TOKEN) {
    console.warn('No token found, redirecting to login');
    redirectToLogin();
    return;
  }

  // Get current user info from token
  if (!getCurrentUser()) {
    console.warn('Failed to decode token, redirecting to login');
    redirectToLogin();
    return;
  }

  // Check if we have valid user data
  if (!CURRENT_USER_ID || !CURRENT_USER_ROLE) {
    console.warn('No valid user ID or role found, redirecting to login');
    redirectToLogin();
    return;
  }

  console.log('Authentication successful, loading dashboard');
  loadDashboard();

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedLowonganId');
      redirectToLogin();
    });
  }
});

async function loadDashboard() {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const dashboardContent = document.getElementById('dashboard-content');

  // Enhanced debugging
  console.log('=== Dashboard Debug Start ===');
  console.log('Token exists:', !!AUTH_TOKEN);
  console.log('Token preview:', AUTH_TOKEN ? AUTH_TOKEN.substring(0, 50) + '...' : 'No token');
  console.log('Backend URL:', BACKEND_URL);
  console.log('User ID:', CURRENT_USER_ID);
  console.log('User Role:', CURRENT_USER_ROLE);
  console.log('================================');

  try {
    showLoading(true);
    hideError();

    const url = `${BACKEND_URL}/api/dashboard`;
    console.log('Fetching dashboard URL:', url);

    // Log the exact headers being sent
    const headers = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };
    console.log('Request headers:', headers);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'same-origin'
    });

    console.log('Response received:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized - Token might be invalid or expired');
        redirectToLogin();
        return;
      }
      
      // Try to get error message from response
      let errText;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errText = errorData.message || errorData.error || response.statusText;
        } else {
          errText = await response.text();
        }
      } catch (parseError) {
        errText = response.statusText;
      }
      
      console.error('Response error:', errText);
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log('Dashboard data received:', data);

    showLoading(false);
    if (dashboardContent) {
      dashboardContent.classList.remove('hidden');
    }

    renderDashboard(data);

  } catch (error) {
    console.error('Error loading dashboard:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    showLoading(false);
    
    // Handle network errors specifically
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showError('Network error: Please check your connection and try again');
    } else if (error.message.includes('401')) {
      showError('Authentication failed. Please login again.');
      setTimeout(() => {
        redirectToLogin();
      }, 2000);
    } else {
      showError(error.message || 'Gagal memuat data dashboard');
    }
  }
}

function renderDashboard(data) {
  console.log('Rendering dashboard with data:', data);
  console.log('Current user role for rendering:', CURRENT_USER_ROLE);
  
  // Use CURRENT_USER_ROLE instead of detecting from data structure
  switch(CURRENT_USER_ROLE) {
    case 'ADMIN':
      console.log('Rendering admin dashboard');
      renderAdminDashboard(data);
      break;
    case 'DOSEN':
      console.log('Rendering dosen dashboard');
      renderDosenDashboard(data);
      break;
    case 'MAHASISWA':
      console.log('Rendering mahasiswa dashboard');
      renderMahasiswaDashboard(data);
      break;
    default:
      console.error('Unknown user role:', CURRENT_USER_ROLE);
      showError('Role pengguna tidak dikenali: ' + CURRENT_USER_ROLE);
      break;
  }
}

function renderAdminDashboard(data) {
  try {
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard) {
      adminDashboard.classList.remove('hidden');
    }
    
    const totalDosenEl = document.getElementById('admin-total-dosen');
    const totalMahasiswaEl = document.getElementById('admin-total-mahasiswa');
    const totalMataKuliahEl = document.getElementById('admin-total-mata-kuliah');
    const totalLowonganEl = document.getElementById('admin-total-lowongan');
    
    if (totalDosenEl) totalDosenEl.textContent = data.totalDosen || 0;
    if (totalMahasiswaEl) totalMahasiswaEl.textContent = data.totalMahasiswa || 0;
    if (totalMataKuliahEl) totalMataKuliahEl.textContent = data.totalMataKuliah || 0;
    if (totalLowonganEl) totalLowonganEl.textContent = data.totalLowongan || 0;
  } catch (error) {
    console.error('Error rendering admin dashboard:', error);
    showError('Error menampilkan dashboard admin');
  }
}

function renderDosenDashboard(data) {
  try {
    const dosenDashboard = document.getElementById('dosen-dashboard');
    if (dosenDashboard) {
      dosenDashboard.classList.remove('hidden');
    }
    
    const totalMataKuliahEl = document.getElementById('dosen-total-mata-kuliah');
    const totalAssistantEl = document.getElementById('dosen-total-assistant');
    const openLowonganEl = document.getElementById('dosen-open-lowongan');
    
    if (totalMataKuliahEl) totalMataKuliahEl.textContent = data.totalMataKuliah || 0;
    if (totalAssistantEl) totalAssistantEl.textContent = data.totalMahasiswaAssistant || 0;
    if (openLowonganEl) openLowonganEl.textContent = data.openLowonganCount || 0;
  } catch (error) {
    console.error('Error rendering dosen dashboard:', error);
    showError('Error menampilkan dashboard dosen');
  }
}

function renderMahasiswaDashboard(data) {
  try {
    const mahasiswaDashboard = document.getElementById('mahasiswa-dashboard');
    if (mahasiswaDashboard) {
      mahasiswaDashboard.classList.remove('hidden');
    }
    
    // Update statistics
    const openLowonganEl = document.getElementById('mahasiswa-open-lowongan');
    const acceptedEl = document.getElementById('mahasiswa-accepted');
    const pendingEl = document.getElementById('mahasiswa-pending');
    const rejectedEl = document.getElementById('mahasiswa-rejected');
    const totalHoursEl = document.getElementById('mahasiswa-total-hours');
    const totalInsentifEl = document.getElementById('mahasiswa-total-insentif');
    
    if (openLowonganEl) openLowonganEl.textContent = data.openLowonganCount || 0;
    if (acceptedEl) acceptedEl.textContent = data.acceptedLowonganCount || 0;
    if (pendingEl) pendingEl.textContent = data.pendingLowonganCount || 0;
    if (rejectedEl) rejectedEl.textContent = data.rejectedLowonganCount || 0;
    if (totalHoursEl) totalHoursEl.textContent = (data.totalLogHours || 0).toFixed(1);
    if (totalInsentifEl) totalInsentifEl.textContent = formatCurrency(data.totalInsentif || 0);
    
    // Render accepted lowongan list
    renderAcceptedLowonganList(data.acceptedLowonganList || []);
  } catch (error) {
    console.error('Error rendering mahasiswa dashboard:', error);
    showError('Error menampilkan dashboard mahasiswa');
  }
}

function renderAcceptedLowonganList(lowonganList) {
  const container = document.getElementById('accepted-lowongan-list');
  
  if (!container) {
    console.error('Container accepted-lowongan-list not found');
    return;
  }
  
  if (!lowonganList || lowonganList.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Tidak ada lowongan yang diterima</p>';
    return;
  }
  
  try {
    container.innerHTML = lowonganList.map(lowongan => {
      // Debug log to see the structure
      console.log('Lowongan object:', lowongan);
      
      // Access the nested mataKuliah object
      const mataKuliahName = lowongan.mataKuliah?.namaMataKuliah || 
                            lowongan.mataKuliahName || 
                            'Mata Kuliah';
      
      return `
        <div class="lowongan-item">
          <div class="lowongan-info flex-1">
            <h4>${mataKuliahName}</h4>
            <p>Tahun Ajaran: ${lowongan.tahunAjaran || '-'} | Semester: ${lowongan.semester || '-'}</p>
          </div>
          <div class="flex space-x-2">
            <button onclick="viewLowonganDetail('${lowongan.id}')" 
                    class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Detail
            </button>
            <button onclick="viewLogs('${lowongan.id}')" 
                    class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
              Log
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error rendering lowongan list:', error);
    container.innerHTML = '<p class="text-red-500 text-center py-4">Error menampilkan daftar lowongan</p>';
  }
}

function viewLowonganDetail(lowonganId) {
  if (!lowonganId) {
    console.error('Lowongan ID tidak tersedia');
    return;
  }
  
  // Use relative path for navigation
  const currentPath = window.location.pathname;
  let targetPath;
  
  if (currentPath.includes('/pages/dashboard/')) {
    targetPath = `../lowongan/detail.html?id=${lowonganId}`;
  } else {
    targetPath = `/pages/lowongan/detail.html?id=${lowonganId}`;
  }
  
  window.location.href = targetPath;
}

function viewLogs(lowonganId) {
  if (!lowonganId) {
    console.error('Lowongan ID tidak tersedia');
    return;
  }
  
  localStorage.setItem('selectedLowonganId', lowonganId);
  
  // Use relative path for navigation
  const currentPath = window.location.pathname;
  let targetPath;
  
  if (currentPath.includes('/pages/dashboard/')) {
    targetPath = `../log/list.html?lowonganId=${lowonganId}`;
  } else {
    targetPath = `/pages/log/list.html?lowonganId=${lowonganId}`;
  }
  
  window.location.href = targetPath;
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `Rp ${amount || 0}`;
  }
}

function showLoading(show) {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    if (show) {
      loadingElement.classList.remove('hidden');
    } else {
      loadingElement.classList.add('hidden');
    }
  }
}

function showError(message) {
  const errorElement = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  
  if (errorElement && errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.color = '#e74c3c';
    errorElement.classList.remove('hidden');
  } else {
    console.error('Error elements not found:', message);
  }
}

function hideError() {
  const errorElement = document.getElementById('error');
  if (errorElement) {
    errorElement.classList.add('hidden');
  }
}

// Refresh functionality
function refreshDashboard() {
  const dashboardContent = document.getElementById('dashboard-content');
  if (dashboardContent) {
    dashboardContent.classList.add('hidden');
  }
  loadDashboard();
}

// Export functions to global scope
window.viewLowonganDetail = viewLowonganDetail;
window.viewLogs = viewLogs;
window.refreshDashboard = refreshDashboard;