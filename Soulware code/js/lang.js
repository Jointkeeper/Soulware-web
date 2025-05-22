
document.addEventListener("DOMContentLoaded", function () {
  const defaultLang = "en";
  const supportedLangs = ["en", "ru"];

  function getPreferredLanguage() {
    const saved = localStorage.getItem("lang");
    if (saved && supportedLangs.includes(saved)) return saved;

    const systemLang = navigator.language.slice(0, 2).toLowerCase();
    return supportedLangs.includes(systemLang) ? systemLang : defaultLang;
  }

  function setLanguage(lang) {
    fetch("lang/" + lang + ".json")
      .then((res) => res.json())
      .then((data) => {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (data[key]) el.innerText = data[key];
        });
      });

    localStorage.setItem("lang", lang);
  }

  const langSelector = document.getElementById("lang-select");
  if (langSelector) {
    langSelector.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }

  setLanguage(getPreferredLanguage());
});
