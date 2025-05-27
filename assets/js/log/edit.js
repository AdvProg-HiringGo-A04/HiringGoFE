const BACKEND_URL = "https://hiringgo.syauqiyasman.com";

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const logId = urlParams.get("logId");
  const lowonganId = urlParams.get("lowonganId") || urlParams.get("idlowongan") || localStorage.getItem('selectedLowonganId');

  if (!logId) {
    alert("Log ID tidak ditemukan");
    window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
    return;
  }

  console.log("Log ID:", logId);

  fetch(`${BACKEND_URL}/api/log/${logId}`, {
    method: "GET",
    headers: {
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
    .then((data) => {
      console.log("Data log yang diterima:", data);

      document.getElementById("judul").value = data.data.judul;
      document.getElementById("kategori").value = data.data.kategori;
      document.getElementById("waktuMulai").value = data.data.waktuMulai;
      document.getElementById("waktuSelesai").value = data.data.waktuSelesai;
      document.getElementById("tanggalLog").value = data.data.tanggalLog;
      document.getElementById("keterangan").value = data.data.keterangan || "";
      document.getElementById("pesan").value = data.data.pesan || "";
      document.getElementById("mataKuliahId").value = data.data.mataKuliahId;
    })
    .catch((error) => {
      setTimeout(() => {
        window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
      }, 3000);

      console.error(error);
    });

  document.getElementById("editLogForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Reset error
    document.querySelectorAll(".text-red-600").forEach((el) => el.classList.add("hidden"));

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

      fetch(`${BACKEND_URL}/api/log/${logId}`, {
        method: "PUT",
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
          const toast = document.createElement("toast-notif");
          toast.setAttribute("message", "Log updated successfully.");
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
});

function navigateBack() {
    const lowonganId = localStorage.getItem('selectedLowonganId');
    if (lowonganId) {
        window.location.href = `/pages/log/list.html?lowonganId=${lowonganId}`;
    } else {
        window.location.href = "/";
    }
}
