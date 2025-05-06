document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");

  function loadPage(path) {
    const main = document.querySelector("main");
    fetch(path)
      .then((res) => res.text())
      .then((html) => {
        main.innerHTML = html;
      })
      .catch(() => {
        main.innerHTML = "<p style='color:red;'>Gagal load halaman</p>";
      });
  }

  function resolveHashRoute() {
    const hash = window.location.hash.substring(1); // buang tanda #
    if (hash === "log") loadPage("/pages/log/list.html");
    // tambahin route lain, nanti pakenya tinggal di navbar href=#namanya
    else if (hash === "home") loadPage("/pages/home.html");
    else if (hash === "about") loadPage("/pages/about.html");
    else if (hash === "contact") loadPage("/pages/contact.html");
    else if (hash === "profile") loadPage("/pages/profile.html");
    else if (hash === "settings") loadPage("/pages/settings.html");
    else if (hash === "help") loadPage("/pages/help.html");
    else if (hash === "faq") loadPage("/pages/faq.html");
    else loadPage("/pages/home.html"); // default
  }

  includes.forEach((el) => {
    const file = el.getAttribute("data-include");
    fetch(file)
      .then((res) => res.text())
      .then((data) => {
        el.innerHTML = data;
      })
      .then(() => resolveHashRoute()) // setelah navbar/footer, baru load halaman
      .catch((err) => {
        el.innerHTML = "<p style='color:red;'>Failed to load component</p>";
        console.error("Error loading include:", file, err);
      });
  });

  // kalau user klik tombol back/forward di browser
  window.addEventListener("hashchange", resolveHashRoute);
});
