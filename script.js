// Set to your form endpoint (e.g. a Formspree URL: https://formspree.io/f/xxxxxxx).
// While empty, the form validates but will not send anywhere.
const FORM_ENDPOINT = "";

document.documentElement.classList.add("js");
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector(".nav__toggle");
const links = document.getElementById("navlinks");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Highlight current section in nav
const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
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

// FAQ: one open at a time
const faqs = document.querySelectorAll(".faq details");
faqs.forEach((d) => d.addEventListener("toggle", () => {
  if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
}));

// Application form
const form = document.getElementById("apply-form");
const statusEl = document.getElementById("form-status");
const setStatus = (msg, cls) => { statusEl.textContent = msg; statusEl.className = "form__status " + (cls || ""); };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll("[required]").forEach((f) => {
    const bad = !f.value.trim() || (f.type === "email" && !f.checkValidity());
    f.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { setStatus("Please complete the highlighted fields.", "err"); return; }

  if (!FORM_ENDPOINT) {
    setStatus("Applications aren’t open yet. Please check back soon.", "err");
    return;
  }

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  setStatus("Sending…");
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    setStatus("Application received. I’ll be in touch to schedule your intro call.", "ok");
  } catch {
    setStatus("Something went wrong. Please try again.", "err");
  } finally {
    btn.disabled = false;
  }
});
form.addEventListener("input", (e) => e.target.classList.remove("invalid"));
