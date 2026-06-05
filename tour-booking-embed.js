/*
 * webflow-assets/tour-booking-embed.js — client script for the per-location
 * Google Calendar Appointment Schedule embed (OPE-2056).
 *
 * Runs inside the Webflow Embed element on the Locations CMS Collection
 * template (see appointment-schedule-embed.html for the paste-ready wrapper and
 * README.md for the why/how). It reads the CMS-bound
 * `data-appointment-schedule-url` attribute off `#tour-booking-section` and:
 *   - valid Google Appointment Schedule URL  -> renders the booking iframe in a
 *     UMV-style card ("Book a tour").
 *   - empty / missing / invalid              -> renders the "coming soon,
 *     contact operator" fallback card.
 *
 * Source of truth for the URL is config/locations.ts -> Webflow CMS (the
 * `appointment-schedule-url` field); the operator never edits this script.
 *
 * Delivery: this file is the canonical logic; it is pasted INLINE into the
 * Webflow Embed element (there is no JS asset-bundle / Site Custom Code
 * pipeline in this repo today — see README.md). tour-booking-embed.test.ts
 * drift-guards that the .html wrapper inlines this verbatim.
 */
(function () {
  "use strict";

  var SECTION_ID = "tour-booking-section";
  var CONTACT_EMAIL = "operations@e3storage.com";

  /*
   * Only embed URLs we recognize as Google Appointment Schedule booking pages.
   * The value comes from CMS (operator-pasted), so this guards against a
   * javascript:/data: URI or an off-platform host ever reaching an iframe src.
   */
  function isValidScheduleUrl(raw) {
    if (!raw || typeof raw !== "string") return false;
    var trimmed = raw.trim();
    if (!trimmed) return false;
    try {
      var u = new URL(trimmed);
      // Exact host (no subdomain wildcard), https only, and a bare canonical
      // Appointment Schedule path. Reject any query/fragment payload — these
      // URLs are bare paths; if Google ever needs params we add them explicitly.
      if (u.protocol !== "https:") return false;
      if (u.hostname !== "calendar.google.com") return false;
      if (u.search !== "" || u.hash !== "") return false;
      // Bare canonical Appointment Schedule path only:
      //   /calendar/appointments/schedules/<id>
      //   /calendar/u/<n>/appointments/schedules/<id>   (signed-in variant)
      // The /u/<n>/ form must STILL carry the appointments/schedules segment —
      // bare /calendar/u/0, /calendar/u/0/settings, /calendar/u/0/r etc. are the
      // operator's own Calendar UI, not booking pages, and must hit the fallback.
      return /^\/calendar\/(u\/[^/]+\/)?appointments\/schedules\/[^/]+/.test(u.pathname);
    } catch (e) {
      return false;
    }
  }

  function renderIframe(container, url) {
    var card = document.createElement("div");
    card.className = "e3-tour-card";

    var title = document.createElement("h3");
    title.className = "e3-tour-card__title";
    title.textContent = "Book a tour";

    var frame = document.createElement("iframe");
    frame.className = "e3-tour-card__iframe";
    frame.title = "Book a tour";
    frame.loading = "lazy";
    frame.setAttribute("frameborder", "0");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("width", "100%");
    // Google Calendar's Appointment Schedule widget has its own internal
    // scroll for the time-slot list. 580px shows the date grid + ~4 slots
    // without dominating the viewport — users scroll inside the iframe to
    // see remaining slots. (Was 700px which spilled out of frame on most
    // laptop screens — see OPE-2056 visual smoke 2026-06-04.)
    frame.setAttribute("height", "580");
    frame.style.height = "580px";
    frame.style.minHeight = "580px"; // override .e3-tour-card__iframe min-height: 700px from CSS
    // Defense in depth: even though src is a validated calendar.google.com URL,
    // sandbox the frame to the minimum Google Calendar needs — scripts + forms
    // to run the booking flow, same-origin so Calendar can read its own session,
    // popups for the confirmation window. NOTE: a popup inherits these sandbox
    // flags; if a schedule is ever configured to REQUIRE booker Google sign-in,
    // its OAuth popup would need `allow-popups-to-escape-sandbox` added here
    // (re-test before adding). Public tour schedules need no booker sign-in, so
    // we omit it. If the embed ever fails to load, allow-same-origin is first to drop.
    frame.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin allow-popups");
    frame.src = url; // validated by isValidScheduleUrl above

    card.appendChild(title);
    card.appendChild(frame);
    container.replaceChildren(card);
  }

  function renderFallback(container) {
    var card = document.createElement("div");
    card.className = "e3-tour-card e3-tour-card--coming-soon";
    // Announce the "coming soon" state to assistive tech.
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");

    var title = document.createElement("h3");
    title.className = "e3-tour-card__title";
    title.textContent = "Book a tour";

    var pill = document.createElement("span");
    pill.className = "e3-tour-pill";
    pill.textContent = "Coming soon";

    var body = document.createElement("p");
    body.className = "e3-tour-card__body";
    body.appendChild(
      document.createTextNode("This location's tour-booking page is coming soon. Contact our team at ")
    );
    var link = document.createElement("a");
    link.href = "mailto:" + CONTACT_EMAIL;
    link.textContent = CONTACT_EMAIL;
    body.appendChild(link);
    body.appendChild(document.createTextNode(" to schedule."));

    card.appendChild(title);
    card.appendChild(pill);
    card.appendChild(body);
    container.replaceChildren(card);
  }

  /*
   * No browser Sentry SDK is wired on the Webflow side yet (the canonical
   * server-side captureAndRethrow lives in src/lib/sentry.ts). Mirror its
   * contract here: emit a structured, greppable error, then RETHROW — never
   * swallow. Wiring a real browser Sentry for Webflow assets is a follow-up.
   */
  function captureAndRethrow(err) {
    try {
      console.error("[e3-tour-booking] embed render failed", {
        op: "webflow.tour_booking_embed",
        message: err && err.message ? err.message : String(err),
      });
    } catch (loggingError) {
      // console unavailable — fall through to the rethrow so nothing is swallowed.
      void loggingError;
    }
    throw err;
  }

  /*
   * Hoist the anchor out of any ancestor that's hidden (display:none).
   * The Locations CMS template's <section> gets inline display:none by the
   * older e3-pages-bundle.js (e3v2-built body class) which rebuilds the page
   * into its own premium layout — that leaves our Designer-placed anchor
   * inside a collapsed parent. Move the anchor to just-before the footer so
   * it lives in the visible rebuilt content. No-op when the anchor is
   * already visible. Safe to drop once the page-rebuild logic includes the
   * tour-booking section directly (OPE-2091 follow-up).
   */
  function hoistAnchorIfHidden(container) {
    var hidden = container.closest('[style*="display: none"], [style*="display:none"]');
    if (!hidden) return container;
    var footer = document.querySelector(".e3-footer-rebuild") || document.querySelector("footer");
    var newParent = footer ? footer.parentNode : document.body;
    if (footer) newParent.insertBefore(container, footer);
    else newParent.appendChild(container);
    /*
     * The rebuilt-page body on /locations/* uses display:grid, so the hoisted
     * anchor becomes a tight grid child unless we force it to span every
     * column. Lock the layout inline so the iframe gets the full UMV-card
     * width regardless of where it lands.
     */
    container.style.gridColumn = "1 / -1";
    container.style.width = "100%";
    container.style.maxWidth = "920px";
    container.style.margin = "32px auto";
    container.style.padding = "0 16px";
    container.style.boxSizing = "border-box";
    return container;
  }

  function init() {
    var container = document.getElementById(SECTION_ID);
    if (!container) return; // not a location page — nothing to render
    try {
      container = hoistAnchorIfHidden(container);
      var url = container.getAttribute("data-appointment-schedule-url");
      if (isValidScheduleUrl(url)) {
        renderIframe(container, url.trim());
      } else {
        renderFallback(container);
      }
    } catch (err) {
      captureAndRethrow(err);
    }
  }

  /*
   * Two-pass init. Other site scripts (the older e3-pages-bundle) hide the
   * Locations CMS template <section> at runtime, AFTER DOMContentLoaded but
   * before window.load completes. If we only init on DOMContentLoaded, the
   * parent is still visible — hoistAnchorIfHidden is a no-op — and then the
   * bundle hides everything underneath our newly-rendered iframe. So we:
   *   1. init() at DOMContentLoaded so the iframe is in the DOM early
   *   2. re-init() on a short delay after window.load to catch the race
   *      where the bundle hid the section between pass 1 and pass 2
   * Both passes are idempotent: hoistAnchorIfHidden short-circuits when the
   * parent is visible; renderIframe / renderFallback re-render harmlessly.
   */
  /*
   * Legacy "Book a Tour" button on the rebuilt /locations/<slug> page (from
   * the older e3-pages-bundle) links to the decommissioned Next.js wizard at
   * /tour/<slug> — that route is OPE-1358 era and being replaced by THIS
   * in-page iframe. Find any such anchor whose href targets the old wizard
   * and rewrite it to scroll to the booking iframe. Idempotent: marks
   * processed anchors with a data attribute so subsequent runs skip.
   */
  function rewriteLegacyTourButtons() {
    var anchors = document.querySelectorAll(
      'a[href*="/tour/"]:not([data-e3-tour-rewritten])'
    );
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      // Only rewrite anchors whose href path is exactly /tour/<slug> (no extra
      // segments) — leave any unrelated /tour/* deep links alone.
      try {
        var u = new URL(a.href, location.href);
        if (!/^\/tour\/[^/]+\/?$/.test(u.pathname)) continue;
      } catch (e) {
        continue;
      }
      a.setAttribute("data-e3-tour-rewritten", "1");
      a.setAttribute("href", "#" + SECTION_ID);
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var target = document.getElementById(SECTION_ID);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function runInit() {
    try {
      init();
      rewriteLegacyTourButtons();
    } catch (err) {
      captureAndRethrow(err);
    }
  }
  function scheduleSecondPass() {
    // window.load fires AFTER all subresources + most footer scripts. Add a
    // small extra delay to let any deferred bundle mutations settle.
    setTimeout(runInit, 800);
  }
  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInit);
  } else {
    runInit();
  }
  if (document.readyState === "complete") {
    scheduleSecondPass();
  } else {
    window.addEventListener("load", scheduleSecondPass);
  }
})();
