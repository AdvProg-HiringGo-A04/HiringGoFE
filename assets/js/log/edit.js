document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search); // TODO
  const logId = urlParams.get("logId"); // TODO
  // const studentId = localStorage.getItem("studentId"); //TODO

  if (!logId) {
    alert("Log ID tidak ditemukan");
    window.location.href = "/pages/log/list.html";
    return;
  }

  console.log("Log ID:", logId);

  fetch(`http://localhost:8080/api/log/${logId}`, {
    method: "GET",
    headers: {
      "X-Student-Id": "0000-0000-0000-0000-000000000003", // TODO
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
        window.location.href = "/pages/log/list.html";
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
      };

      fetch(`http://localhost:8080/api/log/${logId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Student-Id": "0000-0000-0000-0000-000000000003", // TODO
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
            window.location.href = "/pages/log/list.html";
          }, 3000);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });
});
