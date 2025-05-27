const BACKEND_URL = "https://hiringgo.syauqiyasman.com";

let logs = [];
let filteredLogs = [];
// let mataKuliahId = null;
let allLogData = [];

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/index.html';
}

const kategoriColors = {
  ASISTENSI: "bg-blue-100 text-blue-800",
  MENGOREKSI: "bg-purple-100 text-purple-800",
  MENGAWAS: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const statusColors = {
  DIPROSES: "bg-yellow-100 text-yellow-800",
  DITERIMA: "bg-green-100 text-green-800",
  DITOLAK: "bg-red-100 text-red-800",
};

const urlParams = new URLSearchParams(window.location.search);
const lowonganId = urlParams.get("lowonganId");

if (lowonganId) {
    localStorage.setItem('selectedLowonganId', lowonganId);
}

function fetchLogs() {
  // Show loading state
  document.getElementById("logsTableBody").innerHTML = `
    <tr>
      <td colspan="7" class="px-6 py-4 text-center">Loading...</td>
    </tr>
  `;

  console.log("Fetching logs for lowonganId:", lowonganId);
  const apiUrl = `${BACKEND_URL}/api/log/matakuliah/${lowonganId}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json();

        const errorMessage = data?.errors?.enrollment || data?.message || "Internal Server Error.";

        const toast = document.createElement("toast-notif");
        toast.setAttribute("message", errorMessage + ".");
        toast.setAttribute("type", "error");
        document.body.appendChild(toast);

        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then((response) => {
      if (response && response.data) {
        logs = response.data;
        filteredLogs = [...logs]; // Create a copy for filtering

        if (lowonganId) {
          const linkElement = document.getElementById("create-log-link");
          if (linkElement) {
            linkElement.href = `/pages/log/create.html?lowonganId=${lowonganId}`;
          }
        }

        applyFilters();
        renderLogs();
      } else {
        const toast = document.createElement("toast-notif");
        toast.setAttribute("message", "Invalid data format.");
        toast.setAttribute("type", "error");
        document.body.appendChild(toast);

        throw new Error("Invalid data format");
      }
    })
    .catch(() => {
      document.getElementById("logsTableBody").innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 font-extrabold text-center text-red-800">
            Error loading data. Please check the console for more details.
          </td>
        </tr>
      `;
    });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(startTime, endTime) {
  function formatSingleTime(timeStr) {
    // contoh: 2024-05-07T13:45:00
    if (timeStr.includes("T")) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    // contoh: 13:45:00
    else {
      const timeParts = timeStr.split(":");
      return `${timeParts[0]}:${timeParts[1]}`;
    }
  }

  return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`;
}

function renderLogs() {
  const tableBody = document.getElementById("logsTableBody");
  tableBody.innerHTML = "";

  // log kosong
  if (filteredLogs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center">Tidak ada data log yang ditemukan</td>
      </tr>
    `;
    return;
  }

  filteredLogs.forEach((log, index) => {
    // console.log(index + 1);
    // console.log(log.id);
    // console.log(log.judul);
    // console.log(log.kategori);
    // console.log(log.tanggalLog);
    // console.log(log.waktuMulai);
    // console.log(log.waktuSelesai);
    // console.log(log.mataKuliahId);

    const rowNumber = index + 1;

    const row = document.createElement("tr");
    row.className = "bg-white border-b hover:bg-gray-50 animate-fade-in";
    row.style.animationDelay = `${index * 0.05}s`;
    row.style.animationFillMode = "backwards";

    const kategoriColor = kategoriColors[log.kategori] || "bg-gray-100 text-gray-800";
    const statusColor = statusColors[log.status] || "bg-gray-100 text-gray-800";
    const formattedDate = formatDate(log.tanggalLog);
    const formattedTime = formatTime(log.waktuMulai, log.waktuSelesai);

    row.innerHTML = `
      <td class="px-6 py-4">${rowNumber}</td>
      <td class="px-6 py-4">${formattedDate}</td>
      <td class="px-6 py-4">${formattedTime}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${kategoriColor}">
          ${log.kategoriDisplayName}
        </span>
      </td>
      <td class="px-6 py-4 font-medium text-gray-900">${log.judul}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
          ${log.statusDisplayName}
        </span>
      </td>
      
      <td class="px-6 py-4 text-center">
        <div class="flex justify-center space-x-2">
          <a href="#" class="font-medium text-blue-600 hover:text-blue-900" title="Detail" onclick="viewLogDetail('${log.id}')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </a>

          <a
            href="/pages/log/edit.html?logId=${log.id}"
            class="font-medium text-yellow-600 hover:text-yellow-900"
            title="Edit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </a>

          <button
            onclick="openDeleteModal('${log.id}', '${log.judul}')"
            class="font-medium text-red-600 hover:text-red-900"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function applyFilters() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const kategoriFilter = document.getElementById("kategori").value;
  const statusFilter = document.getElementById("status").value;

  filteredLogs = logs.filter((log) => {
    const matchesSearch = log.judul.toLowerCase().includes(searchTerm);

    // Apply kategori filter if selected
    const matchesKategori = !kategoriFilter || log.kategori === kategoriFilter;

    // Apply status filter if selected
    const matchesStatus = !statusFilter || log.status === statusFilter;

    // Only include if all conditions match
    return matchesSearch && matchesKategori && matchesStatus;
  });

  renderLogs();
}

function deleteLog() {
  const id = document.getElementById("deleteItemId").value;

  fetch(`${BACKEND_URL}/api/log/${lowonganId}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json();

        const errorMessage =
          data?.errors?.enrollment ||
          data?.errors?.status ||
          data?.errors?.logId ||
          data?.errors?.mahasiswaId ||
          data?.errors?.mataKuliahId ||
          data?.message ||
          "Internal Server Error.";

        const toast = document.createElement("toast-notif");
        toast.setAttribute("message", errorMessage + ".");
        toast.setAttribute("type", "error");
        document.body.appendChild(toast);

        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(() => {
      logs = logs.filter((log) => log.id !== id);
      filteredLogs = filteredLogs.filter((log) => log.id !== id);

      renderLogs();

      const toast = document.createElement("toast-notif");
      toast.setAttribute("message", "Log deleted successfully.");
      toast.setAttribute("type", "success");
      document.body.appendChild(toast);

      closeDeleteModal();
    })
    .catch((error) => {
      console.error("Error deleting log:", error);
      closeDeleteModal();
    });
}

function openDeleteModal(id, name) {
  document.getElementById("deleteModal").classList.remove("hidden");
  document.getElementById("deleteItemId").value = id;
  document.getElementById("deleteItemName").textContent = name;
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.add("hidden");
}

function viewLogDetail(id) {
  console.log("Log ID:", id);
  fetch(`${BACKEND_URL}/api/log/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((res) => {
      const log = res.data;

      document.getElementById("detailJudul").textContent = log.judul;
      document.getElementById("detailKategori").textContent = log.kategoriDisplayName;
      document.getElementById("detailTanggal").textContent = log.tanggalLog;
      document.getElementById(
        "detailWaktu"
      ).textContent = `${log.waktuMulai} - ${log.waktuSelesai}`;
      document.getElementById("detailStatus").textContent = log.statusDisplayName;
      document.getElementById("detailKeterangan").textContent =
        log.keterangan ?? "(tidak ada keterangan)";
      document.getElementById("detailPesan").textContent = log.pesan ?? "(tidak ada pesan)";

      // tampilkan popup
      document.getElementById("logDetailOverlay").classList.remove("hidden");
    })
    .catch((err) => {
      console.error("Failed to fetch log details:", err);

      const toast = document.createElement("toast-notif");
      toast.setAttribute("message", "An error occurred while fetching log details.");
      toast.setAttribute("type", "error");
      document.body.appendChild(toast);
    });
}

function closeLogDetail() {
  document.getElementById("logDetailOverlay").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("kategori").addEventListener("change", applyFilters);
  document.getElementById("status").addEventListener("change", applyFilters);

  fetchLogs();
});
