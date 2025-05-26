import CONFIG from './config.js';
const BACKEND_URL = CONFIG.API_URL;

const token = localStorage.getItem('token') || '';

function parseJwt(t) {
  try {
    const base64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

const payload = parseJwt(token);
const userId = payload.sub || payload.id || '';
const userRole = payload.role || '';

console.log('JWT payload:', payload);
console.log('Resolved userId:', userId);
console.log('User role:', userRole);

window.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const dashboardContent = document.getElementById('dashboard-content');

  // Check authentication
  if (!token || !userId) {
    console.warn('No token or userId found, redirecting to login');
    window.location.href = '/index.html';
    return;
  }

  loadDashboard();

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedLowonganId');
      window.location.href = '/index.html';
    });
  }
});

async function loadDashboard() {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const dashboardContent = document.getElementById('dashboard-content');

  // Enhanced debugging
  console.log('=== Dashboard Debug Start ===');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
  console.log('Backend URL:', BACKEND_URL);
  console.log('JWT Payload:', payload);
  console.log('User ID:', userId);
  console.log('User Role:', userRole);
  console.log('================================');

  try {
    showLoading(true);
    hideError();

    const url = `${BACKEND_URL}/api/dashboard`;
    console.log('Fetching dashboard URL:', url);

    // Log the exact headers being sent
    const headers = {
      'Authorization': `Bearer ${token}`,
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
        localStorage.removeItem('token');
        window.location.href = '/index.html';
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
    dashboardContent.classList.remove('hidden');

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
        localStorage.removeItem('token');
        window.location.href = '/index.html';
      }, 2000);
    } else {
      showError(error.message || 'Gagal memuat data dashboard');
    }
  }
}

function renderDashboard(data) {
  console.log('Rendering dashboard with data:', data);
  
  // Detect user role and render appropriate dashboard
  if (data.totalDosen !== undefined) {
    // Admin dashboard
    console.log('Rendering admin dashboard');
    renderAdminDashboard(data);
  } else if (data.totalMataKuliah !== undefined && data.totalMahasiswaAssistant !== undefined) {
    // Dosen dashboard
    console.log('Rendering dosen dashboard');
    renderDosenDashboard(data);
  } else if (data.openLowonganCount !== undefined && data.acceptedLowonganCount !== undefined) {
    // Mahasiswa dashboard
    console.log('Rendering mahasiswa dashboard');
    renderMahasiswaDashboard(data);
  } else {
    console.error('Unknown dashboard data format:', data);
    showError('Format data dashboard tidak dikenali');
  }
}

function renderAdminDashboard(data) {
  try {
    document.getElementById('admin-dashboard').classList.remove('hidden');
    
    document.getElementById('admin-total-dosen').textContent = data.totalDosen || 0;
    document.getElementById('admin-total-mahasiswa').textContent = data.totalMahasiswa || 0;
    document.getElementById('admin-total-mata-kuliah').textContent = data.totalMataKuliah || 0;
    document.getElementById('admin-total-lowongan').textContent = data.totalLowongan || 0;
  } catch (error) {
    console.error('Error rendering admin dashboard:', error);
    showError('Error menampilkan dashboard admin');
  }
}

function renderDosenDashboard(data) {
  try {
    document.getElementById('dosen-dashboard').classList.remove('hidden');
    
    document.getElementById('dosen-total-mata-kuliah').textContent = data.totalMataKuliah || 0;
    document.getElementById('dosen-total-assistant').textContent = data.totalMahasiswaAssistant || 0;
    document.getElementById('dosen-open-lowongan').textContent = data.openLowonganCount || 0;
  } catch (error) {
    console.error('Error rendering dosen dashboard:', error);
    showError('Error menampilkan dashboard dosen');
  }
}

function renderMahasiswaDashboard(data) {
  try {
    document.getElementById('mahasiswa-dashboard').classList.remove('hidden');
    
    // Update statistics
    document.getElementById('mahasiswa-open-lowongan').textContent = data.openLowonganCount || 0;
    document.getElementById('mahasiswa-accepted').textContent = data.acceptedLowonganCount || 0;
    document.getElementById('mahasiswa-pending').textContent = data.pendingLowonganCount || 0;
    document.getElementById('mahasiswa-rejected').textContent = data.rejectedLowonganCount || 0;
    
    // Update total hours and incentives
    document.getElementById('mahasiswa-total-hours').textContent = 
        (data.totalLogHours || 0).toFixed(1);
    document.getElementById('mahasiswa-total-insentif').textContent = 
        formatCurrency(data.totalInsentif || 0);
    
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
    container.innerHTML = lowonganList.map(lowongan => `
      <div class="lowongan-item">
        <div class="lowongan-info flex-1">
          <h4>${lowongan.mataKuliahName || 'Mata Kuliah'}</h4>
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
    `).join('');
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
  window.location.href = `/pages/lowongan/detail.html?id=${lowonganId}`;
}

function viewLogs(lowonganId) {
  if (!lowonganId) {
    console.error('Lowongan ID tidak tersedia');
    return;
  }
  localStorage.setItem('selectedLowonganId', lowonganId);
  window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
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