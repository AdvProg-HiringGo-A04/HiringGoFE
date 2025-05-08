document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search); // TODO
  const mataKuliahId = urlParams.get("mataKuliahId"); // TODO

  if (mataKuliahId) {
    document.getElementById("mataKuliahId").value = mataKuliahId;
  }

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
      };

      const studentId = localStorage.getItem("studentId"); // TODO

      console.log("Log data to be sent:", logData);
      console.log(mataKuliahId);

      fetch("http://localhost:8080/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Student-Id": "00000000-0000-0000-0000-000000000003", // TODO
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
            window.location.href = "/pages/log/list.html";
          }, 3000);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });
});
