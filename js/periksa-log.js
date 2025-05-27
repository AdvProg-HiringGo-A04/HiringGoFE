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

console.log('JWT payload:', payload);
console.log('Resolved userId:', userId);

// Global variables
let currentLogs = [];
let currentLogForUpdate = null;

// DOM Elements
const elements = {
  unauth: document.getElementById('unauth'),
  content: document.getElementById('content'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  success: document.getElementById('success'),
  logoutBtn: document.getElementById('logoutBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  logsTableBody: document.getElementById('logsTableBody'),
  emptyState: document.getElementById('emptyState'),
  totalLogs: document.getElementById('totalLogs'),
  pendingLogs: document.getElementById('pendingLogs'),
  totalHours: document.getElementById('totalHours'),
  logModal: document.getElementById('logModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalContent: document.getElementById('modalContent'),
  closeModal: document.getElementById('closeModal'),
  approveBtn: document.getElementById('approveBtn'),
  rejectBtn: document.getElementById('rejectBtn'),
  cancelBtn: document.getElementById('cancelBtn')
};

// Utility functions
function showElement(element) {
  if (element) element.style.display = 'block';
}

function hideElement(element) {
  if (element) element.style.display = 'none';
}

function showMessage(type, message) {
  hideElement(elements.error);
  hideElement(elements.success);
  
  const messageEl = type === 'error' ? elements.error : elements.success;
  if (messageEl) {
    messageEl.textContent = message;
    showElement(messageEl);
    
    // Auto hide after 5 seconds
    setTimeout(() => hideElement(messageEl), 5000);
  }
}

function formatTime(timeString) {
  if (!timeString) return 'N/A';
  return timeString.substring(0, 5); // HH:MM format
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID');
}

function getStatusBadge(status) {
  const statusMap = {
    'DIPROSES': { class: 'bg-yellow-100 text-yellow-800', text: 'Diproses' },
    'DITERIMA': { class: 'bg-green-100 text-green-800', text: 'Diterima' },
    'DITOLAK': { class: 'bg-red-100 text-red-800', text: 'Ditolak' }
  };
  
  const statusInfo = statusMap[status] || { class: 'bg-gray-100 text-gray-800', text: status };
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}">${statusInfo.text}</span>`;
}

function getCategoryDisplayName(category) {
  const categoryMap = {
    'ASISTENSI': 'Asistensi',
    'MENGOREKSI': 'Mengoreksi',
    'MENGAWAS': 'Mengawas',
    'OTHER': 'Lain-lain'
  };
  return categoryMap[category] || category;
}

// API functions
async function fetchLogs() {
  try {
    showElement(elements.loading);
    hideElement(elements.error);
    
    const response = await fetch(`${BACKEND_URL}/api/logs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Logs response:', responseData);
    
    currentLogs = responseData.data || [];
    displayLogs(currentLogs);
    updateStats(currentLogs);
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    showMessage('error', `Error mengambil data log: ${error.message}`);
  } finally {
    hideElement(elements.loading);
  }
}

async function updateLogStatus(logId, status) {
  try {
    showElement(elements.loading);
    
    const response = await fetch(`${BACKEND_URL}/api/logs/${logId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logId: logId,
        status: status
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Update response:', responseData);
    
    showMessage('success', `Log berhasil ${status === 'DITERIMA' ? 'diterima' : 'ditolak'}`);
    
    // Refresh the logs
    await fetchLogs();
    
  } catch (error) {
    console.error('Error updating log status:', error);
    showMessage('error', `Error mengupdate status log: ${error.message}`);
  } finally {
    hideElement(elements.loading);
  }
}

// Display functions
function displayLogs(logs) {
  if (!elements.logsTableBody) return;
  
  elements.logsTableBody.innerHTML = '';
  
  if (!logs || logs.length === 0) {
    showElement(elements.emptyState);
    return;
  }
  
  hideElement(elements.emptyState);
  
  logs.forEach(log => {
    const row = document.createElement('tr');
    row.className = 'bg-white border-b hover:bg-gray-50';
    
    row.innerHTML = `
      <td class="px-6 py-4">${formatDate(log.tanggalLog)}</td>
      <td class="px-6 py-4 font-medium text-gray-900">${log.mahasiswaName}</td>
      <td class="px-6 py-4">
        <div class="text-sm">
          <div class="font-medium">${log.mataKuliahName}</div>
          <div class="text-gray-500">${log.mataKuliahCode}</div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="max-w-xs truncate" title="${log.judul}">${log.judul}</div>
      </td>
      <td class="px-6 py-4">${getCategoryDisplayName(log.kategori)}</td>
      <td class="px-6 py-4">
        <div class="text-sm">
          <div>${log.durationInHours.toFixed(1)} jam</div>
          <div class="text-gray-500">${formatTime(log.waktuMulai)} - ${formatTime(log.waktuSelesai)}</div>
        </div>
      </td>
      <td class="px-6 py-4">${getStatusBadge(log.status)}</td>
      <td class="px-6 py-4">
        <button 
          onclick="showLogDetails('${log.id}')" 
          class="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          Detail
        </button>
      </td>
    `;
    
    elements.logsTableBody.appendChild(row);
  });
}

function updateStats(logs) {
  if (!logs) return;
  
  const totalLogs = logs.length;
  const pendingLogs = logs.filter(log => log.status === 'DIPROSES').length;
  const totalHours = logs.reduce((sum, log) => sum + (log.durationInHours || 0), 0);
  
  if (elements.totalLogs) elements.totalLogs.textContent = totalLogs;
  if (elements.pendingLogs) elements.pendingLogs.textContent = pendingLogs;
  if (elements.totalHours) elements.totalHours.textContent = totalHours.toFixed(1);
}

function showLogDetails(logId) {
  const log = currentLogs.find(l => l.id === logId);
  if (!log) return;
  
  currentLogForUpdate = log;
  
  if (elements.modalTitle) {
    elements.modalTitle.textContent = `Detail Log - ${log.judul}`;
  }
  
  if (elements.modalContent) {
    elements.modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mahasiswa</label>
          <p class="text-sm text-gray-900">${log.mahasiswaName}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah</label>
          <p class="text-sm text-gray-900">${log.mataKuliahName} (${log.mataKuliahCode})</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
          <p class="text-sm text-gray-900">${formatDate(log.tanggalLog)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
          <p class="text-sm text-gray-900">${formatTime(log.waktuMulai)} - ${formatTime(log.waktuSelesai)} (${log.durationInHours.toFixed(1)} jam)</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <p class="text-sm text-gray-900">${getCategoryDisplayName(log.kategori)}</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Judul</label>
          <p class="text-sm text-gray-900">${log.judul}</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
          <p class="text-sm text-gray-900">${log.keterangan || 'Tidak ada keterangan'}</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Pesan untuk Dosen</label>
          <p class="text-sm text-gray-900">${log.pesanUntukDosen || 'Tidak ada pesan'}</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status Saat Ini</label>
          <div>${getStatusBadge(log.status)}</div>
        </div>
      </div>
    `;
  }
  
  // Show/hide action buttons based on current status
  const isProcessing = log.status === 'DIPROSES';
  if (elements.approveBtn) {
    elements.approveBtn.style.display = isProcessing ? 'inline-block' : 'none';
  }
  if (elements.rejectBtn) {
    elements.rejectBtn.style.display = isProcessing ? 'inline-block' : 'none';
  }
  
  showElement(elements.logModal);
}

function closeModal() {
  hideElement(elements.logModal);
  currentLogForUpdate = null;
}

// Event listeners
window.addEventListener('DOMContentLoaded', () => {
  // Check authentication and authorization
  if (token && payload.role === 'DOSEN' && userId) {
    showElement(elements.content);
    hideElement(elements.unauth);
    fetchLogs(); // Load logs on page load
  } else {
    hideElement(elements.content);
    showElement(elements.unauth);
    return;
  }
  
  // Logout button
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/index.html';
    });
  }
  
  // Refresh button
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', fetchLogs);
  }
  
  // Modal close events
  if (elements.closeModal) {
    elements.closeModal.addEventListener('click', closeModal);
  }
  if (elements.cancelBtn) {
    elements.cancelBtn.addEventListener('click', closeModal);
  }
  
  // Modal approve button
  if (elements.approveBtn) {
    elements.approveBtn.addEventListener('click', async () => {
      if (currentLogForUpdate) {
        await updateLogStatus(currentLogForUpdate.id, 'DITERIMA');
        closeModal();
      }
    });
  }
  
  // Modal reject button
  if (elements.rejectBtn) {
    elements.rejectBtn.addEventListener('click', async () => {
      if (currentLogForUpdate) {
        await updateLogStatus(currentLogForUpdate.id, 'DITOLAK');
        closeModal();
      }
    });
  }
  
  // Close modal when clicking outside
  if (elements.logModal) {
    elements.logModal.addEventListener('click', (e) => {
      if (e.target === elements.logModal) {
        closeModal();
      }
    });
  }
});

// Make showLogDetails available globally for onclick handlers
window.showLogDetails = showLogDetails;