// Shared nav + footer injector keeps every page identical without a build step.
(function () {
  const NAV = `
  <header class="nav">
    <div class="shell nav-inner">
      <a href="/" class="nav-brand" aria-label="QUAICU home">
        <img src="/favicon.ico" alt="" width="22" height="22" class="nav-brand-mark" />QUAICU
      </a>
      <nav class="nav-links" aria-label="Primary">
        <a href="/platform.html" data-page="platform">Platform</a>
        <a href="/products.html" data-page="products">Products</a>
        <a href="/architecture.html" data-page="architecture">Architecture</a>
        <a href="/diagnostic.html" data-page="diagnostic">Diagnostic</a>
        <a href="/solutions.html" data-page="solutions">Solutions</a>
        <a href="/company.html" data-page="company">Company</a>
        <a href="/partnerships.html" data-page="partnerships">Partnerships</a>
        <a href="/blog/" data-page="blog">Notes</a>
        <a href="/careers.html" data-page="careers">Careers</a>
      </nav>
      <div class="nav-cta">
        <a class="btn btn--ghost" href="/engagement.html">How we engage</a>
        <a class="btn btn--primary" href="/diagnostic.html">Book the Diagnostic</a>
      </div>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-mobile" type="button">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-progress" aria-hidden="true"><span class="nav-progress-fill"></span></div>
  </header>
  <div class="nav-mobile" id="nav-mobile" data-open="false" aria-hidden="true">
    <nav aria-label="Primary mobile">
      <a href="/platform.html" data-page="platform">Platform</a>
      <a href="/products.html" data-page="products">Products</a>
      <a href="/architecture.html" data-page="architecture">Architecture</a>
      <a href="/diagnostic.html" data-page="diagnostic">Diagnostic</a>
      <a href="/solutions.html" data-page="solutions">Solutions</a>
      <a href="/company.html" data-page="company">Company</a>
      <a href="/partnerships.html" data-page="partnerships">Partnerships</a>
      <a href="/blog/" data-page="blog">Notes</a>
      <a href="/careers.html" data-page="careers">Careers</a>
    </nav>
    <div class="nav-mobile-cta">
      <a class="btn btn--ghost btn--lg" href="/engagement.html">How we engage<span class="arrow"></span></a>
      <a class="btn btn--primary btn--lg" href="/diagnostic.html">Book the Diagnostic<span class="arrow"></span></a>
    </div>
  </div>`;

  const FOOT = `
  <footer class="foot">
    <div class="shell">
      <div class="foot-grid">
        <div class="foot-col foot-brand">
          <div class="h2">QUAICU.</div>
          <div class="muted" style="max-width: 32ch; font-size: 14px;">
            AI governance kernel and policy packs for regulated enterprises.
            One kernel. Six verticals. Available standalone.
          </div>
          <div class="meta" style="margin-top: 24px;">
            QUAICU Solutions Pvt Ltd<br/>
            Hyderabad · India<br/>
            hello@quaicu.org
          </div>
        </div>
        <div class="foot-col">
          <h4>Platform</h4>
          <ul>
            <li><a href="/platform.html">Overview</a></li>
            <li><a href="/architecture.html">Architecture</a></li>
            <li><a href="/platform.html#delivery">Delivery</a></li>
            <li><a href="/diagnostic.html">Diagnostic</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Products</h4>
          <ul>
            <li><a href="/products.html#alis">ALIS · Education</a></li>
            <li><a href="/products.html#rico">RICO · Healthcare</a></li>
            <li><a href="/products.html#fero">FERO · Hospitality</a></li>
            <li><a href="/products.html#polo">POLO · Real Estate</a></li>
            <li><a href="/products.html#lemo">LEMO · Legal</a></li>
            <li><a href="/products.html#ciro">CIRO · Banking</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/company.html">About</a></li>
            <li><a href="/partnerships.html">Partnerships</a></li>
            <li><a href="/council.html">Members Council</a></li>
            <li><a href="/careers.html">Careers</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Engage</h4>
          <ul>
            <li><a href="/diagnostic.html">Book the Diagnostic</a></li>
            <li><a href="/engagement.html">How we engage</a></li>
            <li><a href="/contact.html">Contact</a></li>
            <li><a href="/legal.html">Legal</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Developers</h4>
          <ul>
            <li><a href="https://kernel.quaicu.org" target="_blank" rel="noopener">kernel.quaicu.org ↗</a></li>
            <li><a href="https://kernel.quaicu.org/quickstart/" target="_blank" rel="noopener">Quickstart ↗</a></li>
            <li><a href="https://kernel.quaicu.org/reference/api/rest/" target="_blank" rel="noopener">API Reference ↗</a></li>
            <li><a href="https://kernel.quaicu.org/tutorials/" target="_blank" rel="noopener">Tutorials ↗</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-coda">
        <div>© <span data-year></span> QUAICU SOLUTIONS PRIVATE LIMITED · BUILT IN HYDERABAD · DPDP-NATIVE</div>
      </div>
    </div>
  </footer>`;

  // Inject on DOM ready
  function inject() {
    const navSlot = document.querySelector("[data-nav-slot]");
    const footSlot = document.querySelector("[data-foot-slot]");
    if (navSlot) navSlot.outerHTML = NAV;
    if (footSlot) footSlot.outerHTML = FOOT;
    wireMobileNav();
    wireScrollProgress();
    markActiveLink();
  }

  function markActiveLink() {
    const path = location.pathname;
    // Anything under /blog/ (index, posts, tags) lights up the "Notes" link.
    const isBlog = path === "/blog" || path.startsWith("/blog/");
    const file = isBlog
      ? "blog"
      : (path.split("/").pop() || "index.html").replace(".html", "") || "index";
    document.querySelectorAll(".nav-links a[data-page], .nav-mobile a[data-page]").forEach((a) => {
      if (a.dataset.page === file) a.classList.add("is-active");
    });
  }

  function wireScrollProgress() {
    const fill = document.querySelector(".nav-progress-fill");
    if (!fill) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(window.scrollY / max, 1) * 100 : 0;
      fill.style.width = pct + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function wireMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const sheet = document.querySelector(".nav-mobile");
    if (!toggle || !sheet) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      sheet.setAttribute("data-open", String(open));
      sheet.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    // Close on link tap (so anchor navigation feels snappy on mobile)
    sheet.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
