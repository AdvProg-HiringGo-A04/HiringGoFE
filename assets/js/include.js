document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");

  includes.forEach((el) => {
    const file = el.getAttribute("data-include");
    fetch(file)
      .then((res) => res.text())
      .then((data) => {
        el.innerHTML = data;
      })
      .catch((err) => {
        el.innerHTML = "<p style='color:red;'>Failed to load component</p>";
        console.error("Error loading include:", file, err);
      });
  });
});
