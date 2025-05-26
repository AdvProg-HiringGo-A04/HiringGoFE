import CONFIG from '../../../js/config.js';
const BACKEND_URL = CONFIG.API_URL;

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const lowonganId = urlParams.get("lowonganId");

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/index.html';
  }

  // Handle the form submission
  document.getElementById("daftarLowonganForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    document.querySelectorAll(".text-red-600").forEach((el) => el.classList.add("hidden"));

    // Form validation
    let isValid = true;
    const requiredFields = ["sks", "ipk"];
    
    // Validate required fields
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

    // Validate IPK range (0 to 4)
    const ipk = document.getElementById("ipk").value;
    if (ipk < 0 || ipk > 4) {
      document.getElementById("ipk-error").textContent = "IPK harus antara 0 dan 4";
      document.getElementById("ipk-error").classList.remove("hidden");
      isValid = false;
    }

    // If form is valid, submit the data
    if (isValid) {
      const formData = new FormData(this);
      const lowonganData = {
        sks: formData.get("sks"),
        ipk: formData.get("ipk"),
      };

      // Logging for debugging purposes
      console.log("Lowongan data to be sent:", lowonganData);

      try {
        const response = await fetch(`${BACKEND_URL}/lowongan/${lowonganId}/daftar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(lowonganData)
        });

        if (!response.ok) {
          const data = await response.json();

          const errorMessage =
            data?.errors?.logId ||
            data?.errors?.mahasiswaID ||
            data?.errors?.mataKuliahId ||
            data?.message ||
            "Internal Server Error.";

          const toast = document.createElement("toast-notif");
          toast.setAttribute("message", errorMessage + ".");
          toast.setAttribute("type", "error");
          document.body.appendChild(toast);

          throw new Error(errorMessage);
          }

        // Show success message and redirect
        const toast = document.createElement("toast-notif");
        toast.setAttribute("message", "Berhasil mendaftar ke lowongan.");
        toast.setAttribute("type", "success");
        document.body.appendChild(toast);

        setTimeout(() => {
          window.location.href = "/pages/dashboard/dashboard.html"; // Redirect after successful registration
        }, 3000);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  });
});
