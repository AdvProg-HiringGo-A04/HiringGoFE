(function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <div class="fixed bottom-5 right-5 bg-white text-white px-5 py-2 rounded-lg shadow-lg opacity-0 transition-opacity duration-300" role="alert">
      <span class="toast-message"></span>
    </div>
  `;

  class Toast extends HTMLElement {
    connectedCallback() {
      const message = this.getAttribute("message");
      const type = this.getAttribute("type") || "success";

      const toastClone = template.content.cloneNode(true);
      const toastElement = toastClone.querySelector("div");
      const toastMessage = toastClone.querySelector(".toast-message");

      toastMessage.textContent = message;

      switch (type) {
        case "success":
          toastElement.classList.add("bg-green-500");
          break;
        case "error":
          toastElement.classList.add("bg-red-500");
          break;
        case "info":
          toastElement.classList.add("bg-blue-800");
          break;
      }

      document.body.appendChild(toastElement);

      setTimeout(() => {
        toastElement.classList.remove("opacity-0");
        toastElement.classList.add("opacity-100");
      }, 10);

      setTimeout(() => {
        toastElement.classList.remove("opacity-100");
        toastElement.classList.add("opacity-0");
        setTimeout(() => toastElement.remove(), 300);
      }, 5000);
    }
  }

  customElements.define("toast-notif", Toast);
})();

// // cara pakai di html
// <toast-notif message="This is a success message!" type="info"></toast-notif>;

// // cara pakai di js
// const toast = document.createElement("toast-notif");
// toast.setAttribute("message", errorMessage + ".");
// toast.setAttribute("type", "error");
// document.body.appendChild(toast);
