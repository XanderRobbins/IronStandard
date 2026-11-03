// Set to your form endpoint (e.g. a Formspree URL: https://formspree.io/f/xxxxxxx).
// While empty, the form validates but will not send anywhere, and the hero
// status pill reads "Applications opening soon".
const FORM_ENDPOINT = "";

const root = document.documentElement;
root.classList.add("js");
document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Status pill reflects whether the form can actually submit
if (FORM_ENDPOINT) {
  document.getElementById("status").classList.add("status--open");
  document.getElementById("status-text").textContent = "Accepting applications";
}

// Live ISO week number on the sample-week card
(() => {
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const week = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  document.getElementById("week-no").textContent = "· Wk " + String(week).padStart(2, "0");
})();

// ---------- Nav ----------
const nav = document.getElementById("nav");
const toggle = nav.querySelector(".nav__toggle");
const links = document.getElementById("navlinks");
let lastY = window.scrollY;
let ticking = false;

function updateNav() {
  ticking = false;
  const y = window.scrollY;
  const max = root.scrollHeight - window.innerHeight;
  nav.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
  nav.classList.toggle("nav--solid", y > 8);
  if (nav.classList.contains("nav--open") || Math.abs(y - lastY) < 6) return;
  // Hide while reading down, bring back on any upward scroll
  nav.classList.toggle("nav--hidden", y > lastY && y > window.innerHeight * 0.6);
  lastY = y;
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateNav); }
}, { passive: true });
updateNav();
nav.addEventListener("focusin", () => nav.classList.remove("nav--hidden"));

function setMenu(open) {
  nav.classList.toggle("nav--open", open);
  root.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("nav--open")));
links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("nav--open")) { setMenu(false); toggle.focus(); }
});
matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

// Highlight the section currently in view
const navAnchors = [...links.querySelectorAll('a[href^="#"]:not(.btn)')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
navAnchors.forEach((a) => {
  const t = document.querySelector(a.getAttribute("href"));
  if (t) spy.observe(t);
});
// Watching sections without a nav link clears the highlight when they're in view
document.querySelectorAll("#top, #membership").forEach((el) => spy.observe(el));

// ---------- Reveal on scroll (also starts the steps timeline) ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal, .steps").forEach((el) => io.observe(el));

// ---------- Sample week ----------
const week = document.getElementById("week");
const weekItems = [...week.querySelectorAll(".week__item")];
const weekDone = document.getElementById("week-done");
const weekBar = document.getElementById("week-bar");
week.addEventListener("click", (e) => {
  const item = e.target.closest(".week__item");
  if (!item) return;
  item.setAttribute("aria-pressed", String(item.getAttribute("aria-pressed") !== "true"));
  const done = weekItems.filter((i) => i.getAttribute("aria-pressed") === "true").length;
  weekDone.textContent = done;
  weekBar.style.transform = `scaleX(${done / weekItems.length})`;
  week.classList.toggle("week--done", done === weekItems.length);
});

// ---------- Mobile apply bar: hidden over the hero, the form, and the footer ----------
const mcta = document.getElementById("mcta");
const covering = new Set();
const ctaIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => (en.isIntersecting ? covering.add(en.target) : covering.delete(en.target)));
  const show = covering.size === 0;
  mcta.classList.toggle("show", show);
  mcta.inert = !show;
});
["top", "apply", "footer"].forEach((id) => ctaIO.observe(document.getElementById(id)));

// ---------- Pointer ring (mouse only) ----------
if (!reduceMotion && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const ring = document.createElement("div");
  ring.className = "cursor";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);
  let x = 0, y = 0, rx = 0, ry = 0;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    ring.classList.add("on");
    ring.classList.toggle("hover", !!e.target.closest("a, button, summary, label"));
  }, { passive: true });
  document.addEventListener("pointerleave", () => ring.classList.remove("on"));
  (function follow() {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(follow);
  })();
}

// ---------- Application form ----------
const form = document.getElementById("apply-form");
const statusEl = document.getElementById("form-status");
const submitBtn = form.querySelector("button[type=submit]");
const submitLabel = submitBtn.querySelector(".btn__label");
const countEl = document.getElementById("form-count");
const barEl = document.getElementById("form-bar");
const fields = [...form.querySelectorAll(".field")];

const setStatus = (msg, cls) => { statusEl.textContent = msg; statusEl.className = "form__status " + (cls || ""); };

function isValid(field) {
  const control = field.querySelector('input:not([type="radio"]), textarea');
  if (!control) return !!field.querySelector("input:checked");
  if (!control.value.trim()) return false;
  return control.type !== "email" || control.checkValidity();
}

function showError(field, show) {
  field.classList.toggle("is-invalid", show);
  field.querySelector(".field__msg").textContent = show ? field.dataset.msg : "";
  field.querySelectorAll("input, textarea").forEach((c) => c.setAttribute("aria-invalid", String(show)));
}

function updateProgress() {
  const done = fields.filter(isValid).length;
  countEl.textContent = done;
  barEl.style.transform = `scaleX(${done / fields.length})`;
}

function autosize(t) {
  t.style.height = "auto";
  t.style.height = t.scrollHeight + 2 + "px";
}

form.addEventListener("input", (e) => {
  const field = e.target.closest(".field");
  if (!field) return;
  if (e.target.tagName === "TEXTAREA") autosize(e.target);
  if (field.classList.contains("is-invalid") && isValid(field)) showError(field, false);
  updateProgress();
});

// Only flag fields the user actually typed in, so tabbing through doesn't paint the form red
form.addEventListener("focusout", (e) => {
  const field = e.target.closest(".field");
  if (!field || field.classList.contains("field--chips")) return;
  if (e.target.value.trim()) showError(field, !isValid(field));
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const invalid = fields.filter((f) => !isValid(f));
  fields.forEach((f) => showError(f, invalid.includes(f)));
  if (invalid.length) {
    setStatus(invalid.length === 1 ? "One field still needs an answer." : `${invalid.length} fields still need an answer.`, "err");
    invalid[0].querySelector("input, textarea").focus();
    return;
  }

  if (!FORM_ENDPOINT) {
    setStatus("Applications aren’t open yet. Please check back soon.", "err");
    return;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = "Sending…";
  setStatus("");
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    form.querySelectorAll("textarea").forEach((t) => { t.style.height = ""; });
    updateProgress();
    setStatus("Application received. I’ll be in touch to schedule your intro call.", "ok");
  } catch {
    setStatus("That didn’t go through. Check your connection and try again.", "err");
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = "Submit application";
  }
});
