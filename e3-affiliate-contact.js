/*!
 * e3-affiliate-contact.js — OPE-2300 v2
 *
 * Injects branded /affiliate (operator-recruitment landing) and /get-in-touch
 * (contact + form) experiences on the e3 marketing Webflow site. Bypasses the
 * unstable Designer MCP by rendering full sections into the existing page DOM
 * after Webflow's stock chrome (Back-to-Top, Breadcrumb, Navbar) loads.
 *
 * Also hides the Washmotor leftover sections (Elevate Your Car's Look,
 * Get In Touch placeholder card, duplicate Find your e3 block) on these
 * two pages without touching the global Footer Symbol — gated by body path
 * so other pages are unaffected.
 *
 * Form submissions POST to /api/marketing/forms-ingest with:
 *   - source = affiliate_inquiry  (on /affiliate)
 *   - source = contact_inquiry    (on /get-in-touch)
 *
 * Hard rules honored:
 *  - No raw PII logging — only post to the configured endpoint.
 *  - All writes idempotent — the script no-ops if it has already injected
 *    (data-e3-page-rendered marker).
 *  - Errors do not block other Webflow scripts.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------ utils
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  function el(tag, attrs, ...children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'style') node.setAttribute('style', attrs[k]);
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    children.flat().forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  // --------------------------------------------------------------- styles
  function injectStyles() {
    if (document.getElementById('e3-affcon-styles')) return;
    var css = `
      body.e3-page-affiliate .legacy-page-content,
      body.e3-page-contact .legacy-page-content {
        display: none !important;
      }
      /* hide Washmotor leftover on these pages by class + by id */
      body.e3-page-affiliate .map-main-block,
      body.e3-page-contact .map-main-block,
      body.e3-page-affiliate .contact-form-section,
      body.e3-page-contact .contact-form-section,
      body.e3-page-affiliate .section.client-section,
      body.e3-page-contact .section.client-section,
      body.e3-page-affiliate .promo-section,
      body.e3-page-contact .promo-section,
      body.e3-page-affiliate .section.section-promo,
      body.e3-page-contact .section.section-promo {
        display: none !important;
      }
      .e3-section {
        background: #fff;
        padding: clamp(48px, 8vw, 96px) 24px;
      }
      .e3-section + .e3-section { border-top: 1px solid #eceff3; }
      .e3-container {
        max-width: 1120px;
        margin: 0 auto;
      }
      .e3-eyebrow {
        display: inline-block;
        font: 600 12px/1.4 "DM Sans","Inter",system-ui,sans-serif;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: #2E74B5;
        margin-bottom: 16px;
      }
      .e3-h1 {
        font: 700 clamp(36px,5vw,56px)/1.05 "Oswald","Inter",system-ui,sans-serif;
        color: #1F4D78;
        letter-spacing: -.01em;
        margin: 0 0 20px;
        text-transform: none;
      }
      .e3-h2 {
        font: 700 clamp(28px,3.4vw,40px)/1.1 "Oswald","Inter",system-ui,sans-serif;
        color: #1F4D78;
        margin: 0 0 16px;
      }
      .e3-h3 {
        font: 600 20px/1.25 "Oswald","Inter",system-ui,sans-serif;
        color: #18171a;
        margin: 0 0 8px;
      }
      .e3-lede {
        font: 400 clamp(17px,1.8vw,20px)/1.55 "DM Sans","Inter",system-ui,sans-serif;
        color: #4a5160;
        max-width: 720px;
        margin: 0 0 32px;
      }
      .e3-p {
        font: 400 16px/1.65 "DM Sans","Inter",system-ui,sans-serif;
        color: #4a5160;
        margin: 0 0 12px;
      }
      .e3-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        margin-top: 40px;
      }
      .e3-card {
        background: #fff;
        border: 1px solid #e6eaf0;
        border-radius: 14px;
        padding: 28px;
        box-shadow: 0 1px 2px rgba(15,23,42,.04);
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }
      .e3-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(15,23,42,.06);
        border-color: #c9d4e2;
      }
      .e3-list {
        list-style: none;
        padding: 0;
        margin: 16px 0 0;
      }
      .e3-list li {
        position: relative;
        padding: 8px 0 8px 28px;
        font: 400 16px/1.5 "DM Sans","Inter",system-ui,sans-serif;
        color: #4a5160;
      }
      .e3-list li::before {
        content: "";
        position: absolute;
        left: 4px;
        top: 16px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2E74B5;
      }
      .e3-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        background: #C8102E;
        color: #fff !important;
        font: 600 15px/1 "DM Sans","Inter",system-ui,sans-serif;
        letter-spacing: .02em;
        text-transform: uppercase;
        text-decoration: none;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        transition: background .15s ease, transform .15s ease;
      }
      .e3-btn-primary:hover { background: #a40d24; transform: translateY(-1px); }
      .e3-btn-secondary {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 13px 26px;
        background: #fff;
        color: #1F4D78 !important;
        font: 600 15px/1 "DM Sans","Inter",system-ui,sans-serif;
        letter-spacing: .02em;
        text-transform: uppercase;
        text-decoration: none;
        border: 1.5px solid #1F4D78;
        border-radius: 999px;
        cursor: pointer;
        transition: background .15s ease, color .15s ease;
      }
      .e3-btn-secondary:hover { background: #1F4D78; color: #fff !important; }
      .e3-hero {
        background: linear-gradient(180deg, #f6f8fb 0%, #fff 100%);
      }
      .e3-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 32px;
      }
      .e3-form .e3-field-full { grid-column: 1 / -1; }
      .e3-field { display: flex; flex-direction: column; gap: 6px; }
      .e3-field label {
        font: 600 12px/1.3 "DM Sans","Inter",system-ui,sans-serif;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #4a5160;
      }
      .e3-field input, .e3-field textarea, .e3-field select {
        width: 100%;
        padding: 12px 14px;
        font: 400 16px/1.4 "DM Sans","Inter",system-ui,sans-serif;
        color: #18171a;
        background: #fff;
        border: 1px solid #d6dde6;
        border-radius: 10px;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .e3-field input:focus, .e3-field textarea:focus, .e3-field select:focus {
        outline: 0;
        border-color: #2E74B5;
        box-shadow: 0 0 0 3px rgba(46,116,181,.15);
      }
      .e3-field textarea { min-height: 120px; resize: vertical; }
      .e3-form-actions { margin-top: 24px; }
      .e3-form-status {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 10px;
        font: 500 14px/1.4 "DM Sans","Inter",system-ui,sans-serif;
        display: none;
      }
      .e3-form-status.ok { background: #ecfdf5; color: #166534; border: 1px solid #a7f3d0; display: block; }
      .e3-form-status.err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; display: block; }
      .e3-two-col {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 48px;
        align-items: start;
        margin-top: 40px;
      }
      @media (max-width: 800px) {
        .e3-two-col { grid-template-columns: 1fr; gap: 32px; }
        .e3-form { grid-template-columns: 1fr; }
      }
      .e3-locations {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-top: 24px;
      }
      .e3-loc-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 16px;
        background: #fff;
        border: 1px solid #e6eaf0;
        border-radius: 10px;
        font: 500 14px/1.3 "DM Sans","Inter",system-ui,sans-serif;
        color: #18171a;
        text-decoration: none;
        transition: border-color .15s ease, background .15s ease;
      }
      .e3-loc-chip:hover { border-color: #2E74B5; background: #f6f8fb; color: #1F4D78; }
      .e3-loc-chip span.go { color: #2E74B5; font-weight: 700; }
    `;
    var style = el('style', { id: 'e3-affcon-styles' });
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------- pages
  var LOCATIONS = [
    { id: 'tucker-ga',     label: 'Tucker, GA' },
    { id: 'norcross-ga',   label: 'Norcross, GA' },
    { id: 'mariettta-ga',  label: 'Marietta, GA' },
    { id: 'cumming-ga',    label: 'Cumming, GA' },
    { id: 'kennesaw-ga',   label: 'Kennesaw, GA' },
    { id: 'st-augustine-fl', label: 'St. Augustine, FL' },
    { id: 'jacksonville-fl', label: 'Jacksonville, FL' },
    { id: 'charlotte-nc',  label: 'Charlotte, NC' },
    { id: 'raleigh-nc',    label: 'Raleigh, NC' },
    { id: 'charleston-sc', label: 'Charleston, SC' },
    { id: 'austin-tx',     label: 'Austin, TX' },
  ];

  function buildLocationsGrid() {
    return el('div', { class: 'e3-locations' },
      LOCATIONS.map(function (loc) {
        return el('a', { class: 'e3-loc-chip', href: '/locations/' + loc.id },
          loc.label,
          el('span', { class: 'go' }, '→')
        );
      })
    );
  }

  function buildContactPage() {
    return el('div', { class: 'e3-injected', 'data-e3-page-rendered': 'contact' },
      el('section', { class: 'e3-section e3-hero' },
        el('div', { class: 'e3-container' },
          el('span', { class: 'e3-eyebrow' }, 'Contact'),
          el('h1', { class: 'e3-h1' }, 'Talk to us.'),
          el('p', { class: 'e3-lede' },
            'Email is the fastest way to reach us. For tours, click any location below — each location’s booking calendar is live.'
          ),
          el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;' },
            el('a', { class: 'e3-btn-primary', href: 'mailto:tours@e3storage.com' }, 'Email tours@e3storage.com'),
            el('a', { class: 'e3-btn-secondary', href: '/locations' }, 'See all locations')
          )
        )
      ),
      el('section', { class: 'e3-section' },
        el('div', { class: 'e3-container' },
          el('div', { class: 'e3-two-col' },
            el('div', null,
              el('span', { class: 'e3-eyebrow' }, 'Send a message'),
              el('h2', { class: 'e3-h2' }, 'Tell us how we can help.'),
              el('p', { class: 'e3-p' },
                'Membership questions, press, ops requests, or anything else — fill out the form and a real person responds within one business day.'
              ),
              el('p', { class: 'e3-p' },
                'For an active membership question, sign in to the Member Portal so the operator at your home location can see your account context.'
              )
            ),
            buildForm('contact_inquiry', {
              fields: [
                { name: 'name',     label: 'Your name',  type: 'text',  required: true,  full: true },
                { name: 'email',    label: 'Email',      type: 'email', required: true },
                { name: 'phone',    label: 'Phone',      type: 'tel',   required: false },
                { name: 'location', label: 'Nearest e3 location', type: 'select', required: false, options: LOCATIONS, full: true },
                { name: 'topic',    label: 'Topic',      type: 'select', required: true, full: true, options: [
                  { id: 'membership', label: 'Membership question' },
                  { id: 'press',      label: 'Press / media' },
                  { id: 'general',    label: 'General inquiry' },
                  { id: 'other',      label: 'Something else' }
                ]},
                { name: 'message',  label: 'Message',    type: 'textarea', required: true, full: true }
              ],
              submitLabel: 'Send message'
            })
          ),
          el('div', { style: 'margin-top:64px;' },
            el('span', { class: 'e3-eyebrow' }, 'Visit a location'),
            el('h2', { class: 'e3-h2' }, '11 locations across the southeast and Texas.'),
            el('p', { class: 'e3-lede' },
              'Tour bookings happen at the location level — click a location to schedule a visit on its operator’s live calendar.'
            ),
            buildLocationsGrid()
          )
        )
      )
    );
  }

  function buildAffiliatePage() {
    return el('div', { class: 'e3-injected', 'data-e3-page-rendered': 'affiliate' },
      el('section', { class: 'e3-section e3-hero' },
        el('div', { class: 'e3-container' },
          el('span', { class: 'e3-eyebrow' }, 'Partner with E3 Storage'),
          el('h1', { class: 'e3-h1' }, 'Run an E3 location. We handle the platform.'),
          el('p', { class: 'e3-lede' },
            'Bring the real estate. We bring the OpenGate-managed platform — CRM, member portal, payments, access control, daily ops digest. You operate the location; we run the system.'
          ),
          el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;' },
            el('a', { class: 'e3-btn-primary', href: '#apply' }, 'Apply to operate'),
            el('a', { class: 'e3-btn-secondary', href: '/about' }, 'How E3 works')
          )
        )
      ),

      el('section', { class: 'e3-section' },
        el('div', { class: 'e3-container' },
          el('span', { class: 'e3-eyebrow' }, 'The model'),
          el('h2', { class: 'e3-h2' }, 'Three customer-paid vendors. Everything else is on us.'),
          el('p', { class: 'e3-lede' },
            'Every E3 affiliate runs on the same fully-managed software stack. You pay for the three vendors below. OpenGate absorbs every other platform cost — the CRM, the member portal, hosting, error monitoring, support tools — inside the per-location managed-services fee.'
          ),
          el('div', { class: 'e3-grid' },
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Google Workspace'),
              el('p', { class: 'e3-p' }, 'Business Standard — per seat. Email, eSign, Drive, SSO, Calendar, Appointment Schedule for tour bookings.')
            ),
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Kisi'),
              el('p', { class: 'e3-p' }, 'Physical access control on per-member groups. You configure your facility; the platform provisions every member automatically.')
            ),
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Stripe Connect'),
              el('p', { class: 'e3-p' }, 'Transactional fees only. Credit card fees pass to the member; ACH fees are absorbed by E3 corporate. No monthly Stripe charges.')
            )
          )
        )
      ),

      el('section', { class: 'e3-section', style: 'background:#f6f8fb;' },
        el('div', { class: 'e3-container' },
          el('span', { class: 'e3-eyebrow' }, 'What you get'),
          el('h2', { class: 'e3-h2' }, 'A fully-managed operating platform on day one.'),
          el('div', { class: 'e3-grid' },
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Member-facing'),
              el('p', { class: 'e3-p' }, 'Custom Member Portal: online signup, agreement e-sign, payment method on file, asset booking, billing history, concierge requests, message board, activity timeline. Mobile-first; iPad-ready.')
            ),
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Operator-facing'),
              el('p', { class: 'e3-p' }, 'Operator Dashboard with leads from the marketing site, tour calendar wired to Google Appointment Schedule, CRM kanban (lead, tour, sign, pay), asset booking inbox, daily 7am digest email.')
            ),
            el('div', { class: 'e3-card' },
              el('h3', { class: 'e3-h3' }, 'Corporate-facing'),
              el('p', { class: 'e3-p' }, 'Multi-location rollup at corporate, monthly Connect disbursements, per-location financial observability, QBR-ready reporting. You see your numbers; corporate sees the system.')
            )
          )
        )
      ),

      el('section', { class: 'e3-section' },
        el('div', { class: 'e3-container' },
          el('div', { class: 'e3-two-col' },
            el('div', null,
              el('span', { class: 'e3-eyebrow' }, 'What you bring'),
              el('h2', { class: 'e3-h2' }, 'Real estate. A team. Local ownership.'),
              el('ul', { class: 'e3-list' },
                el('li', null, 'A 15,000–40,000 sq ft climate-controlled facility with bay doors sized for cars, boats, and RVs.'),
                el('li', null, 'Three-phase power and the ability to install Kisi-controlled doors.'),
                el('li', null, 'A small operations team — typically a location manager plus one to three associates.'),
                el('li', null, 'Light buildout — member lounge, two-post lifts, detail bays, and the e3 wayfinding kit. We share a reference package; you control the spend.')
              )
            ),
            el('div', null,
              el('span', { class: 'e3-eyebrow' }, 'If this sounds like you'),
              el('h2', { class: 'e3-h2' }, 'You’re the right operator if…'),
              el('ul', { class: 'e3-list' },
                el('li', null, 'You already own or are buying mid-market storage real estate in a metro outside our current footprint.'),
                el('li', null, 'You want a turn-key software and operations platform instead of building one.'),
                el('li', null, 'You’re comfortable being a brand-licensed operator inside E3 standards — member experience, pricing structure, member rules.'),
                el('li', null, 'You can commit to a 24-month minimum operating term.')
              )
            )
          )
        )
      ),

      el('section', { class: 'e3-section', id: 'apply', style: 'background:#1F4D78;color:#fff;' },
        el('div', { class: 'e3-container' },
          el('span', { class: 'e3-eyebrow', style: 'color:#a9c6e2;' }, 'Apply'),
          el('h2', { class: 'e3-h2', style: 'color:#fff;' }, 'Apply to operate an E3 location.'),
          el('p', { class: 'e3-lede', style: 'color:#c9d4e2;max-width:680px;' },
            'Drop your details below. We respond within two business days with next steps — typically a 30-minute discovery call followed by a written operator brief tailored to your market.'
          ),
          (function () {
            var form = buildForm('affiliate_inquiry', {
              fields: [
                { name: 'name',    label: 'Your name', type: 'text',  required: true,  full: true },
                { name: 'email',   label: 'Work email', type: 'email', required: true },
                { name: 'phone',   label: 'Phone', type: 'tel', required: false },
                { name: 'company', label: 'Company', type: 'text', required: false },
                { name: 'market',  label: 'Target metro (e.g., Austin, TX)', type: 'text', required: true },
                { name: 'message', label: 'Tell us about your real estate and timeline', type: 'textarea', required: true, full: true }
              ],
              submitLabel: 'Submit application',
              dark: true
            });
            return form;
          })()
        )
      )
    );
  }

  // ---------------------------------------------------------------- forms
  function buildForm(source, spec) {
    var statusEl = el('div', { class: 'e3-form-status', 'aria-live': 'polite' });
    var fieldsHtml = spec.fields.map(function (f) {
      var inputEl;
      if (f.type === 'textarea') {
        inputEl = el('textarea', { name: f.name, id: 'f-' + source + '-' + f.name, required: f.required ? 'required' : false });
      } else if (f.type === 'select') {
        var options = [el('option', { value: '' }, 'Choose…')];
        f.options.forEach(function (opt) {
          options.push(el('option', { value: opt.id }, opt.label));
        });
        inputEl = el('select', { name: f.name, id: 'f-' + source + '-' + f.name, required: f.required ? 'required' : false }, options);
      } else {
        inputEl = el('input', { type: f.type, name: f.name, id: 'f-' + source + '-' + f.name, required: f.required ? 'required' : false, autocomplete: 'on' });
      }
      var labelStyle = spec.dark ? 'color:#a9c6e2;' : '';
      var inputStyle = spec.dark ? 'background:rgba(255,255,255,.96);' : '';
      if (spec.dark) inputEl.style.background = 'rgba(255,255,255,.96)';
      return el('div', { class: 'e3-field' + (f.full ? ' e3-field-full' : '') },
        el('label', { for: 'f-' + source + '-' + f.name, style: labelStyle }, f.label + (f.required ? ' *' : '')),
        inputEl
      );
    });

    var submitBtn = el('button', { type: 'submit', class: 'e3-btn-primary' }, spec.submitLabel);
    var form = el('form', {
      class: 'e3-form',
      'data-source': source,
      onsubmit: function (ev) {
        ev.preventDefault();
        statusEl.className = 'e3-form-status';
        var fd = new FormData(form);
        var payload = { source: source };
        fd.forEach(function (v, k) { payload[k] = v; });
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        fetch('https://e3-storage-platform.vercel.app/api/marketing/forms-ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
          .then(function (res) {
            if (res.ok) {
              statusEl.className = 'e3-form-status ok';
              statusEl.textContent = 'Thanks — we got it. A real person will respond within one business day.';
              form.reset();
            } else {
              statusEl.className = 'e3-form-status err';
              statusEl.textContent = 'Hmm, something went wrong. Email us at ' + (source === 'affiliate_inquiry' ? 'partner@e3storage.com' : 'tours@e3storage.com') + ' and we’ll pick it up directly.';
            }
          })
          .catch(function () {
            statusEl.className = 'e3-form-status err';
            statusEl.textContent = 'Network error. Please try again or email ' + (source === 'affiliate_inquiry' ? 'partner@e3storage.com' : 'tours@e3storage.com') + ' directly.';
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = spec.submitLabel;
          });
      }
    }, fieldsHtml,
       el('div', { class: 'e3-form-actions e3-field-full' }, submitBtn),
       el('div', { class: 'e3-field-full' }, statusEl)
    );
    return form;
  }

  // ---------------------------------------------------------------- mount
  function mount() {
    var path = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    var which = null;
    if (path === '/affiliate' || path === '/partner-with-us' || path === '/affiliate.html') which = 'affiliate';
    else if (path === '/get-in-touch' || path === '/contact' || path === '/contact-us') which = 'contact';
    if (!which) return;
    if (document.querySelector('[data-e3-page-rendered]')) return;

    document.body.classList.add('e3-page-' + which);
    injectStyles();

    // Find an insertion point AFTER the navbar/breadcrumb but BEFORE the footer.
    // The site puts Navbar component instance early in <body>; the Footer is last.
    // We'll mount inside a wrapper and let CSS hide the legacy section bodies.
    var page = (which === 'affiliate') ? buildAffiliatePage() : buildContactPage();
    var footer = document.querySelector('footer') || document.querySelector('.footer-section') || document.querySelector('[class*=\"Footer\"]');
    if (footer && footer.parentNode === document.body) {
      document.body.insertBefore(page, footer);
    } else {
      document.body.appendChild(page);
    }

    // Hide legacy sections between navbar and footer that aren't ours.
    // Mark every direct child of <body> that ISN'T our wrapper, ISN'T the navbar
    // component instance, ISN'T the breadcrumb, ISN'T the back-to-top, ISN'T the
    // footer, and ISN'T a script/style — and hide it.
    Array.prototype.forEach.call(document.body.children, function (node) {
      if (node === page) return;
      if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || node.tagName === 'NOSCRIPT') return;
      var role = (node.getAttribute('role') || '').toLowerCase();
      var cls = (node.className || '').toString().toLowerCase();
      if (cls.indexOf('navbar') >= 0 || cls.indexOf('nav-bar') >= 0 || role === 'banner' || role === 'navigation') return;
      // OPE-2300 v1.1: HIDE the Breadcrumb hero on these two pages — its
      // red car-wash background image is the most visible Washmotor leftover
      // and the page injection provides its own branded hero.
      // (other pages keep the breadcrumb as-is)
      if (cls.indexOf('back-to-top') >= 0 || cls.indexOf('backtotop') >= 0) return;
      if (cls.indexOf('footer') >= 0 || node.tagName === 'FOOTER') return;
      if (node.classLis