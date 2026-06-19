/*!
 * e3-affiliate-contact.js — OPE-2300 v1.5
 * Affiliate page rewritten to be ABOUT THE E3 BRAND (not vendor stack internals).
 * Contact page unchanged. Forms POST to /api/marketing/forms-ingest.
 */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === undefined || v === null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (cc) { if (cc != null && cc !== false) node.appendChild(typeof cc === 'string' ? document.createTextNode(cc) : cc); });
      else if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    }
    return node;
  }

  function injectStyles() {
    if (document.getElementById('e3-affcon-styles')) return;
    var css = [
      "body.e3-page-affiliate > section:not(.back-to-top-section),",
      "body.e3-page-contact   > section:not(.back-to-top-section) { display: none !important; }",
      "body.e3-page-affiliate .e3-injected, body.e3-page-contact .e3-injected { display: block !important; }",
      "body.e3-page-affiliate .e3-injected section.e3-section,",
      "body.e3-page-contact   .e3-injected section.e3-section { display: block !important; }",
      ".e3-section { background: #fff; padding: clamp(56px, 9vw, 112px) 24px; }",
      ".e3-section + .e3-section { border-top: 1px solid #eceff3; }",
      ".e3-container { max-width: 1120px; margin: 0 auto; }",
      ".e3-eyebrow { display:inline-block; font:600 12px/1.4 'DM Sans','Inter',system-ui,sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#2E74B5; margin-bottom:16px; }",
      "body .e3-h1 { font:700 clamp(40px,5.5vw,64px)/1.05 'Oswald','Inter',system-ui,sans-serif !important; color:#1F4D78 !important; letter-spacing:-.01em !important; margin:0 0 20px !important; text-transform:none !important; }",
      "body .e3-h2 { font:700 clamp(28px,3.4vw,40px)/1.1 'Oswald','Inter',system-ui,sans-serif !important; color:#1F4D78 !important; margin:0 0 16px !important; text-transform:none !important; }",
      "body .e3-h3 { font:600 20px/1.25 'Oswald','Inter',system-ui,sans-serif !important; color:#18171a !important; margin:0 0 8px !important; text-transform:none !important; }",
      ".e3-lede { font:400 clamp(17px,1.8vw,20px)/1.55 'DM Sans','Inter',system-ui,sans-serif; color:#4a5160; max-width:720px; margin:0 0 32px; }",
      ".e3-p { font:400 16px/1.65 'DM Sans','Inter',system-ui,sans-serif; color:#4a5160; margin:0 0 12px; }",
      ".e3-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; margin-top:40px; }",
      ".e3-card { background:#fff; border:1px solid #e6eaf0; border-radius:14px; padding:28px; box-shadow:0 1px 2px rgba(15,23,42,.04); transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease; }",
      ".e3-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,.06); border-color:#c9d4e2; }",
      ".e3-stat { background:#fff; border:1px solid #e6eaf0; border-radius:14px; padding:32px 28px; text-align:center; }",
      ".e3-stat-num { font:700 clamp(42px,5vw,56px)/1 'Oswald','Inter',system-ui,sans-serif; color:#C8102E; margin-bottom:8px; display:block; }",
      ".e3-stat-label { font:500 14px/1.4 'DM Sans','Inter',system-ui,sans-serif; color:#4a5160; }",
      ".e3-list { list-style:none; padding:0; margin:16px 0 0; }",
      ".e3-list li { position:relative; padding:8px 0 8px 28px; font:400 16px/1.5 'DM Sans','Inter',system-ui,sans-serif; color:#4a5160; }",
      ".e3-list li::before { content:''; position:absolute; left:4px; top:16px; width:8px; height:8px; border-radius:50%; background:#2E74B5; }",
      ".e3-btn-primary { display:inline-flex; align-items:center; gap:10px; padding:14px 28px; background:#C8102E; color:#fff !important; font:600 15px/1 'DM Sans','Inter',system-ui,sans-serif; letter-spacing:.02em; text-transform:uppercase; text-decoration:none; border:0; border-radius:999px; cursor:pointer; transition:background .15s ease,transform .15s ease; }",
      ".e3-btn-primary:hover { background:#a40d24; transform:translateY(-1px); }",
      ".e3-btn-secondary { display:inline-flex; align-items:center; gap:10px; padding:13px 26px; background:#fff; color:#1F4D78 !important; font:600 15px/1 'DM Sans','Inter',system-ui,sans-serif; letter-spacing:.02em; text-transform:uppercase; text-decoration:none; border:1.5px solid #1F4D78; border-radius:999px; cursor:pointer; transition:background .15s ease,color .15s ease; }",
      ".e3-btn-secondary:hover { background:#1F4D78; color:#fff !important; }",
      ".e3-hero { background:linear-gradient(180deg,#f6f8fb 0%,#fff 100%); }",
      ".e3-form { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:32px; }",
      ".e3-form .e3-field-full { grid-column:1/-1; }",
      ".e3-field { display:flex; flex-direction:column; gap:6px; }",
      ".e3-field label { font:600 12px/1.3 'DM Sans','Inter',system-ui,sans-serif; letter-spacing:.08em; text-transform:uppercase; color:#4a5160; }",
      ".e3-field input,.e3-field textarea,.e3-field select { width:100%; padding:12px 14px; font:400 16px/1.4 'DM Sans','Inter',system-ui,sans-serif; color:#18171a; background:#fff; border:1px solid #d6dde6; border-radius:10px; transition:border-color .15s ease,box-shadow .15s ease; }",
      ".e3-field input:focus,.e3-field textarea:focus,.e3-field select:focus { outline:0; border-color:#2E74B5; box-shadow:0 0 0 3px rgba(46,116,181,.15); }",
      ".e3-field textarea { min-height:120px; resize:vertical; }",
      ".e3-form-actions { margin-top:24px; }",
      ".e3-form-status { margin-top:16px; padding:12px 16px; border-radius:10px; font:500 14px/1.4 'DM Sans','Inter',system-ui,sans-serif; display:none; }",
      ".e3-form-status.ok { background:#ecfdf5; color:#166534; border:1px solid #a7f3d0; display:block; }",
      ".e3-form-status.err { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; display:block; }",
      ".e3-two-col { display:grid; grid-template-columns:1.1fr 1fr; gap:48px; align-items:start; margin-top:40px; }",
      "@media (max-width:800px) { .e3-two-col { grid-template-columns:1fr; gap:32px; } .e3-form { grid-template-columns:1fr; } }",
      ".e3-locations { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-top:24px; }",
      ".e3-loc-chip { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 16px; background:#fff; border:1px solid #e6eaf0; border-radius:10px; font:500 14px/1.3 'DM Sans','Inter',system-ui,sans-serif; color:#18171a; text-decoration:none; transition:border-color .15s ease,background .15s ease; }",
      ".e3-loc-chip:hover { border-color:#2E74B5; background:#f6f8fb; color:#1F4D78; }",
      ".e3-loc-chip .go { color:#2E74B5; font-weight:700; }"
    ].join("\n");
    var style = el('style', { id: 'e3-affcon-styles' });
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  var LOCATIONS = [
    { id:'tucker-ga', label:'Tucker, GA' },{ id:'norcross-ga', label:'Norcross, GA' },{ id:'marietta-ga', label:'Marietta, GA' },
    { id:'cumming-ga', label:'Cumming, GA' },{ id:'kennesaw-ga', label:'Kennesaw, GA' },{ id:'st-augustine-fl', label:'St. Augustine, FL' },
    { id:'jacksonville-fl', label:'Jacksonville, FL' },{ id:'charlotte-nc', label:'Charlotte, NC' },{ id:'raleigh-nc', label:'Raleigh, NC' },
    { id:'charleston-sc', label:'Charleston, SC' },{ id:'austin-tx', label:'Austin, TX' }
  ];

  function buildLocationsGrid() {
    var grid = el('div', { class:'e3-locations' });
    LOCATIONS.forEach(function (loc) {
      grid.appendChild(el('a', { class:'e3-loc-chip', href:'/locations/'+loc.id }, loc.label, el('span', { class:'go' }, '→')));
    });
    return grid;
  }

  function buildForm(source, spec) {
    var statusEl = el('div', { class:'e3-form-status', 'aria-live':'polite' });
    var form = el('form', { class:'e3-form', 'data-source':source });
    spec.fields.forEach(function (f) {
      var inputEl;
      if (f.type === 'textarea') inputEl = el('textarea', { name:f.name, id:'f-'+source+'-'+f.name, required:f.required ? 'required' : undefined });
      else if (f.type === 'select') {
        inputEl = el('select', { name:f.name, id:'f-'+source+'-'+f.name, required:f.required ? 'required' : undefined });
        inputEl.appendChild(el('option', { value:'' }, 'Choose…'));
        f.options.forEach(function (opt) { inputEl.appendChild(el('option', { value:opt.id }, opt.label)); });
      }
      else inputEl = el('input', { type:f.type, name:f.name, id:'f-'+source+'-'+f.name, required:f.required ? 'required' : undefined, autocomplete:'on' });
      if (spec.dark) inputEl.style.background = 'rgba(255,255,255,.96)';
      var labelEl = el('label', { 'for':'f-'+source+'-'+f.name }, f.label + (f.required ? ' *' : ''));
      if (spec.dark) labelEl.style.color = '#a9c6e2';
      form.appendChild(el('div', { class:'e3-field'+(f.full ? ' e3-field-full' : '') }, labelEl, inputEl));
    });
    var submitBtn = el('button', { type:'submit', class:'e3-btn-primary' }, spec.submitLabel);
    form.appendChild(el('div', { class:'e3-form-actions e3-field-full' }, submitBtn));
    form.appendChild(el('div', { class:'e3-field-full' }, statusEl));
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      statusEl.className = 'e3-form-status';
      // Translate UI fields → /api/marketing/forms-ingest canonical contract.
      // 'name' → first_name+last_name (split on first space)
      // 'location' → location_id
      // 'topic'/'company'/'market' ride as referral_source / extras
      // 'source' → form_name (one of: contact, newsletter, tour-inquiry, affiliate)
      var fd = new FormData(form);
      var raw = {};
      fd.forEach(function (v, k) { raw[k] = v; });
      var payload = {};
      var formName = (source === 'affiliate_inquiry') ? 'affiliate' : 'contact';
      payload.form_name = formName;
      if (raw.email) payload.email = raw.email;
      if (raw.phone) payload.phone = raw.phone;
      if (raw.message) payload.message = raw.message;
      if (raw.location) payload.location_id = raw.location;
      if (raw.name) {
        var parts = String(raw.name).trim().split(/\s+/);
        payload.first_name = parts[0] || raw.name;
        if (parts.length > 1) payload.last_name = parts.slice(1).join(' ');
      }
      // Track the original UI source in referral_source for triage
      var extras = [];
      if (raw.topic) extras.push('topic:' + raw.topic);
      if (raw.company) extras.push('company:' + raw.company);
      if (raw.market) extras.push('market:' + raw.market);
      payload.referral_source = (source === 'affiliate_inquiry' ? 'affiliate_form' : 'contact_form') + (extras.length ? ' | ' + extras.join(' | ') : '');
      submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
      fetch('https://e3-storage-platform.vercel.app/api/marketing/forms-ingest', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
        body:JSON.stringify(payload), mode:'cors'
      }).then(function (r) { return r.json().then(function (j) { return { ok:r.ok, body:j }; }); })
        .then(function (res) {
          if (res.ok) { statusEl.className = 'e3-form-status ok'; statusEl.textContent = 'Thanks — we got it. A real person will respond within one business day.'; form.reset(); }
          else { statusEl.className = 'e3-form-status err'; statusEl.textContent = 'Something went wrong. Email us at ' + (source === 'affiliate_inquiry' ? 'partner@e3storage.com' : 'tours@e3storage.com') + '.'; }
        })
        .catch(function () { statusEl.className = 'e3-form-status err'; statusEl.textContent = 'Network error. Please email ' + (source === 'affiliate_inquiry' ? 'partner@e3storage.com' : 'tours@e3storage.com') + '.'; })
        .then(function () { submitBtn.disabled = false; submitBtn.textContent = spec.submitLabel; });
    });
    return form;
  }

  function buildContactPage() {
    var wrap = el('div', { class:'e3-injected', 'data-e3-page-rendered':'contact' });
    wrap.appendChild(el('section', { class:'e3-section e3-hero' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow' }, 'Contact'),
        el('h1', { class:'e3-h1' }, 'Talk to us.'),
        el('p', { class:'e3-lede' }, 'Email is the fastest way to reach us. For tours, click any location below — each location has its own live booking calendar.'),
        el('div', { style:'display:flex;gap:12px;flex-wrap:wrap;' },
          el('a', { class:'e3-btn-primary', href:'mailto:tours@e3storage.com' }, 'Email tours@e3storage.com'),
          el('a', { class:'e3-btn-secondary', href:'/locations' }, 'See all locations')
        )
      )
    ));
    wrap.appendChild(el('section', { class:'e3-section' },
      el('div', { class:'e3-container' },
        el('div', { class:'e3-two-col' },
          el('div', null,
            el('span', { class:'e3-eyebrow' }, 'Send a message'),
            el('h2', { class:'e3-h2' }, 'Tell us how we can help.'),
            el('p', { class:'e3-p' }, 'Membership questions, press, ops requests, or anything else — fill out the form and a real person responds within one business day.'),
            el('p', { class:'e3-p' }, 'For an active membership question, sign in to the Member Portal so the operator at your home location can see your account context.')
          ),
          buildForm('contact_inquiry', {
            fields: [
              { name:'name', label:'Your name', type:'text', required:true, full:true },
              { name:'email', label:'Email', type:'email', required:true },
              { name:'phone', label:'Phone', type:'tel', required:false },
              { name:'location', label:'Nearest e3 location', type:'select', required:false, full:true, options:LOCATIONS },
              { name:'topic', label:'Topic', type:'select', required:true, full:true, options:[
                { id:'membership', label:'Membership question' },{ id:'press', label:'Press / media' },{ id:'general', label:'General inquiry' },{ id:'other', label:'Something else' }
              ]},
              { name:'message', label:'Message', type:'textarea', required:true, full:true }
            ],
            submitLabel:'Send message'
          })
        )
      )
    ));
    wrap.appendChild(el('section', { class:'e3-section' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow' }, 'Visit a location'),
        el('h2', { class:'e3-h2' }, '11 locations across the Southeast and Texas.'),
        el('p', { class:'e3-lede' }, 'Tour bookings happen at the location level — click a location to schedule a visit on its operator’s live calendar.'),
        buildLocationsGrid()
      )
    ));
    return wrap;
  }

  function buildAffiliatePage() {
    var wrap = el('div', { class:'e3-injected', 'data-e3-page-rendered':'affiliate' });

    // HERO — E3 brand-led, no platform-internals
    wrap.appendChild(el('section', { class:'e3-section e3-hero' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow' }, 'Partner with e3storage'),
        el('h1', { class:'e3-h1' }, 'Operate an E3 location in your market.'),
        el('p', { class:'e3-lede' }, 'E3 storage is the largest DIY automotive club in the country. We license the brand, the member experience, and the operating model to qualified operators with the right real estate. You join the network; we make sure your members get the e3 experience.'),
        el('div', { style:'display:flex;gap:12px;flex-wrap:wrap;' },
          el('a', { class:'e3-btn-primary', href:'#apply' }, 'Apply to operate'),
          el('a', { class:'e3-btn-secondary', href:'/locations' }, 'See the network')
        )
      )
    ));

    // WHY E3 — brand stats
    wrap.appendChild(el('section', { class:'e3-section', style:'background:#f6f8fb;' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow' }, 'Why partner with E3'),
        el('h2', { class:'e3-h2' }, 'A national brand. A devoted membership. Recurring revenue.'),
        el('p', { class:'e3-lede' }, 'Members join e3 because they want secure climate-controlled storage, the DIY shop they cannot get at home, and the community of fellow enthusiasts. That demand exists in every metro we have not opened yet.'),
        el('div', { class:'e3-grid' },
          el('div', { class:'e3-stat' },
            el('span', { class:'e3-stat-num' }, '11'),
            el('span', { class:'e3-stat-label' }, 'Locations across 5 states')
          ),
          el('div', { class:'e3-stat' },
            el('span', { class:'e3-stat-num' }, '2010'),
            el('span', { class:'e3-stat-label' }, 'Year established')
          ),
          el('div', { class:'e3-stat' },
            el('span', { class:'e3-stat-num' }, '24/7'),
            el('span', { class:'e3-stat-label' }, 'Reserved member access')
          )
        )
      )
    ));

    // WHAT YOU GET — brand benefits, not vendor stack
    wrap.appendChild(el('section', { class:'e3-section' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow' }, 'What you get'),
        el('h2', { class:'e3-h2' }, 'The E3 brand, the playbook, and the system to run it.'),
        el('div', { class:'e3-grid' },
          el('div', { class:'e3-card' },
            el('h3', { class:'e3-h3' }, 'The e3storage® brand'),
            el('p', { class:'e3-p' }, 'License the brand members already trust. National marketing, the e3 visual identity, and inclusion in the locations directory drive members to your facility on day one.')
          ),
          el('div', { class:'e3-card' },
            el('h3', { class:'e3-h3' }, 'The operating playbook'),
            el('p', { class:'e3-p' }, 'The member experience, pricing structure, amenities standard, and operating procedures that scale — refined across 11 locations.')
          ),
          el('div', { class:'e3-card' },
            el('h3', { class:'e3-h3' }, 'Operator + member software'),
            el('p', { class:'e3-p' }, 'A managed operator dashboard for leads, tours, members, and bookings. A branded member portal for signup, billing, access, and asset reservations. Nothing to build; nothing to maintain.')
          ),
          el('div', { class:'e3-card' },
            el('h3', { class:'e3-h3' }, 'Onboarding + ongoing support'),
            el('p', { class:'e3-p' }, 'Buildout reference package, vendor relationships, location onboarding wizard, and a corporate point of contact for the lifetime of your operation.')
          )
        )
      )
    ));

    // WHAT YOU BRING + WHO FITS
    wrap.appendChild(el('section', { class:'e3-section' },
      el('div', { class:'e3-container' },
        el('div', { class:'e3-two-col' },
          el('div', null,
            el('span', { class:'e3-eyebrow' }, 'What you bring'),
            el('h2', { class:'e3-h2' }, 'Real estate. A team. Local ownership.'),
            el('ul', { class:'e3-list' },
              el('li', null, 'A 15,000–40,000 sq ft climate-controlled facility with bay doors sized for cars, boats, and RVs.'),
              el('li', null, 'Three-phase power and the ability to install secure access doors.'),
              el('li', null, 'A small operations team — typically a location manager plus one to three associates.'),
              el('li', null, 'Light buildout — member lounge, two-post lifts, detail bays, e3 wayfinding kit. We share a reference package; you control the spend.')
            )
          ),
          el('div', null,
            el('span', { class:'e3-eyebrow' }, 'Who fits'),
            el('h2', { class:'e3-h2' }, 'You’re the right operator if…'),
            el('ul', { class:'e3-list' },
              el('li', null, 'You own or are buying mid-market storage real estate in a metro outside our current footprint.'),
              el('li', null, 'You want a turn-key operating model instead of building one from scratch.'),
              el('li', null, 'You’re comfortable being a brand-licensed operator inside the e3 standards.'),
              el('li', null, 'You can commit to a 24-month minimum operating term.')
            )
          )
        )
      )
    ));

    // APPLY
    wrap.appendChild(el('section', { class:'e3-section', id:'apply', style:'background:#1F4D78;color:#fff;' },
      el('div', { class:'e3-container' },
        el('span', { class:'e3-eyebrow', style:'color:#a9c6e2;' }, 'Apply'),
        el('h2', { class:'e3-h2', style:'color:#fff;' }, 'Apply to operate an E3 location.'),
        el('p', { class:'e3-lede', style:'color:#c9d4e2;max-width:680px;' }, 'Drop your details below. We respond within two business days with next steps — typically a 30-minute discovery call followed by a written operator brief tailored to your market.'),
        buildForm('affiliate_inquiry', {
          dark:true,
          fields: [
            { name:'name', label:'Your name', type:'text', required:true, full:true },
            { name:'email', label:'Work email', type:'email', required:true },
            { name:'phone', label:'Phone', type:'tel', required:false },
            { name:'company', label:'Company', type:'text', required:false },
            { name:'market', label:'Target metro (e.g., Austin, TX)', type:'text', required:true },
            { name:'message', label:'Tell us about your real estate and timeline', type:'textarea', required:true, full:true }
          ],
          submitLabel:'Submit application'
        })
      )
    ));
    return wrap;
  }

  function mount() {
    var path = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    var which = null;
    if (path === '/affiliate' || path === '/partner-with-us' || path === '/affiliate.html') which = 'affiliate';
    else if (path === '/get-in-touch' || path === '/contact' || path === '/contact-us') which = 'contact';
    if (!which) return;
    if (document.querySelector('[data-e3-page-rendered]')) return;
    document.body.classList.add('e3-page-' + which);
    injectStyles();
    var page = (which === 'affiliate') ? buildAffiliatePage() : buildContactPage();
    var footer = document.querySelector('footer') || document.querySelector('.footer-section') || document.querySelector('[class*="Footer"]');
    if (footer && footer.parentNode === document.body) document.body.insertBefore(page, footer);
    else document.body.appendChild(page);
  }

  ready(mount);
})();
