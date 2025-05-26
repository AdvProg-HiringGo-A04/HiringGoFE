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

window.addEventListener('DOMContentLoaded', () => {
  const unauth = document.getElementById('unauth');
  const content = document.getElementById('content');

  if (token && payload.role === 'MAHASISWA' && userId) {
    content.style.display = 'block';
    unauth.style.display = 'none';
  } else {
    content.style.display = 'none';
    unauth.style.display = 'flex';
    return; 
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html'; 
  });

  document.getElementById('fetchBtn').addEventListener('click', async () => {
    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const errorDiv = document.getElementById('error');
    const tbody = document.querySelector('#honorTable tbody');
    
    errorDiv.textContent = '';
    tbody.innerHTML = '';

    try {
      if (!userId) {
        throw new Error('User ID tidak tersedia dalam token.');
      }

      const url = `${BACKEND_URL}/mahasiswa/${userId}/honors?year=${year}&month=${month}`;
      console.log('Fetching URL:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Response error:', errText);
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const responseData = await res.json();
      console.log('Response data:', responseData);
      
      const { data } = responseData;
      
      if (!data || data.length === 0) {
        errorDiv.textContent = 'Tidak ada data honor untuk periode ini.';
        errorDiv.style.color = '#ff9800'; 
        return;
      }

      data.forEach(item => {
        const tr = document.createElement('tr');
        
        const periode = `${item.tanggalAwal} — ${item.tanggalAkhir}`;
        
        const honorJam = new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR' 
        }).format(item.honorPerJam);
        
        const totalPembayaran = new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR' 
        }).format(item.totalPembayaran);

        tr.innerHTML = `
          <td>${periode}</td>
          <td>${item.mataKuliahNama || 'N/A'}</td>
          <td>${item.totalJam || 0} jam</td>
          <td>${honorJam}</td>
          <td>${totalPembayaran}</td>
          <td><span style="color: ${item.status === 'HAS_LOGS' ? 'green' : 'orange'}">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Fetch error:', err);
      errorDiv.textContent = `Error: ${err.message}`;
      errorDiv.style.color = '#e74c3c'; 
    }
  });
});