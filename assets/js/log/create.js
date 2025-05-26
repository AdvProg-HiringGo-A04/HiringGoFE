import CONFIG from '../../../js/config.js';
const BACKEND_URL = CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const lowonganId = urlParams.get("lowonganId") || urlParams.get("idlowongan") || localStorage.getItem('selectedLowonganId');

  // Update semua link kembali dengan lowonganId
  function updateBackLinks() {
      if (lowonganId) {
          // Update link "Batal"
          const cancelLink = document.querySelector('a[href="/pages/log/list.html"]');
          if (cancelLink) {
              cancelLink.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
          }
          
          // Update back button di header
          const backButton = document.querySelector('a.text-blue-900[href="/pages/log/list.html"]');
          if (backButton) {
              backButton.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
          }
      }
  }
  
  // Panggil update back links
  updateBackLinks();

  document.getElementById("createLogForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Reset errors
    document.querySelectorAll(".text-red-600").forEach((el) => el.classList.add("hidden"));

    // Form validation
    let isValid = true;
    const requiredFields = [
      "judul",
      "kategori",
      "tanggalLog",
      "waktuMulai",
      "waktuSelesai",
      "mataKuliahId",
    ];

    requiredFields.forEach((field) => {
      const input = document.getElementById(field);
      if (!input || !input.value.trim()) {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
          errorElement.textContent = "Field ini wajib diisi";
          errorElement.classList.remove("hidden");
        }
        isValid = false;
      }
    });

    const waktuMulai = document.getElementById("waktuMulai").value;
    const waktuSelesai = document.getElementById("waktuSelesai").value;
    if (waktuMulai && waktuSelesai && waktuSelesai <= waktuMulai) {
      document.getElementById("waktuSelesai-error").textContent =
        "Waktu selesai harus setelah waktu mulai";
      document.getElementById("waktuSelesai-error").classList.remove("hidden");
      isValid = false;
    }

    const tanggalLog = document.getElementById("tanggalLog").value;
    const today = new Date().toISOString().split("T")[0];
    if (tanggalLog && tanggalLog > today) {
      document.getElementById("tanggalLog-error").textContent =
        "Tanggal log tidak boleh di masa depan";
      document.getElementById("tanggalLog-error").classList.remove("hidden");
      isValid = false;
    }

    if (isValid) {
      const formData = new FormData(this);
      const logData = {
        judul: formData.get("judul"),
        kategori: formData.get("kategori"),
        waktuMulai: formData.get("waktuMulai"),
        waktuSelesai: formData.get("waktuSelesai"),
        tanggalLog: formData.get("tanggalLog"),
        keterangan: formData.get("keterangan") || null,
        pesan: formData.get("pesan") || null,
        mataKuliahId: formData.get("mataKuliahId"),
        lowonganId: lowonganId || localStorage.getItem('selectedLowonganId'),
      };

      console.log("Log data to be sent:", logData);

      fetch(`${BACKEND_URL}/api/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(logData),
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json();

            const errorMessage =
              data?.errors?.enrollment || data?.errors?.message || "Internal Server Error";

            const toast = document.createElement("toast-notif");
            toast.setAttribute("message", errorMessage + ".");
            toast.setAttribute("type", "error");
            document.body.appendChild(toast);

            throw new Error(errorMessage);
          }
          return response.json();
        })
        .then(() => {
          // Show success message
          const toast = document.createElement("toast-notif");
          toast.setAttribute("message", "Log saved successfully.");
          toast.setAttribute("type", "success");
          document.body.appendChild(toast);

          setTimeout(() => {
            window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
          }, 3000);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });

  // Fungsi untuk redirect ke list dengan lowonganId
  function redirectToList() {
    const currentLowonganId = localStorage.getItem('selectedLowonganId');
    if (currentLowonganId) {
      window.location.href = `/pages/log/list.html?lowonganId=${currentLowonganId}`;
    } else {
      window.location.href = "/pages/log/list.html";
    }
  }
  
  // Tambahkan event listener untuk tombol Batal
  const cancelButton = document.querySelector('a[href*="/pages/log/list.html"]');
  if (cancelButton) {
    cancelButton.addEventListener('click', function(e) {
      e.preventDefault();
      redirectToList();
    });
  }
});

// Fungsi global untuk navigasi kembali
function navigateBack() {
    const lowonganId = localStorage.getItem('selectedLowonganId');
    if (lowonganId) {
        window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
    } else {
        window.location.href = "/pages/log/list.html";
    }
}