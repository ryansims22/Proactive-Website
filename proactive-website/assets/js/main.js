/* Proactive Accounting & Tax — site behavior
   Sticky header, mobile off-canvas nav, contact form submission. */

(function () {
  "use strict";

  /* ---- Sticky header: transparent at top, dark + shrunk on scroll ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile off-canvas navigation ---- */
  var navToggle = document.querySelector(".nav-toggle");
  var offcanvas = document.querySelector(".offcanvas");
  var offcanvasClose = document.querySelector(".offcanvas-close");
  var overlay = document.querySelector(".offcanvas-overlay");

  function openNav() {
    document.body.classList.add("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
    if (offcanvasClose) offcanvasClose.focus();
  }
  function closeNav() {
    var focusWasInside = offcanvas && offcanvas.contains(document.activeElement);
    document.body.classList.remove("nav-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      if (focusWasInside) navToggle.focus();
    }
  }
  if (navToggle) navToggle.addEventListener("click", openNav);
  if (offcanvasClose) offcanvasClose.addEventListener("click", closeNav);
  if (overlay) overlay.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) closeNav();
  });

  /* Keep keyboard focus inside the off-canvas panel while it's open */
  if (offcanvas) {
    offcanvas.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusables = offcanvas.querySelectorAll("a[href], button:not([disabled])");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---- Contact form ---- */
  var form = document.querySelector("#contact-form");
  if (form) {
    var status = document.querySelector("#form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      status.textContent = "Sending…";
      status.className = "form-status";

      fetch("/api/contact", {
        method: "POST",
        body: new FormData(form),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) {
            form.reset();
            status.textContent = "Thanks — your message has been sent. We'll be in touch soon.";
            status.classList.add("is-success");
          } else {
            status.textContent = data.error || "Something went wrong. Please try again.";
            status.classList.add("is-error");
          }
        })
        .catch(function () {
          status.textContent = "Something went wrong. Please call us at (760) 205-0625.";
          status.classList.add("is-error");
        })
        .finally(function () {
          button.disabled = false;
        });
    });
  }
})();
