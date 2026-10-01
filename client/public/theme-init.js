// Runs before the app paints, so a dark-theme reader never sees a flash of
// the light page while React loads. Mirrors readStored() in ThemeContext.
(function () {
  var mode = "system";
  try {
    var v = localStorage.getItem("aihub-theme");
    if (v === "light" || v === "dark") mode = v;
  } catch {
    // Blocked storage: fall back to the OS setting.
  }
  if (mode === "system") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
})();
