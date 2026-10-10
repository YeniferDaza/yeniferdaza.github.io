/* =============================================================
   Yenifer Daza — Portfolio
   All site behaviour. No dependencies. See ARCHITECTURE.md §7.
   ============================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ----- Pilot notice ----------------------------------------------- */
  (function pilotBar() {
    var bar = $('.pilot-bar');
    if (!bar) return;
    var KEY = 'yd-pilot-dismissed';

    try {
      if (window.localStorage.getItem(KEY) === '1') { bar.remove(); return; }
    } catch (e) { /* storage unavailable — keep the bar */ }

    var close = $('.pilot-bar__close', bar);
    if (!close) return;
    close.addEventListener('click', function () {
      bar.remove();
      try { window.localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    });
  }());

  /* ----- Header scroll state ---------------------------------------- */
  (function headerState() {
    var header = $('.site-header');
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }());

  /* ----- Mobile navigation ------------------------------------------ */
  (function mobileNav() {
    var toggle = $('.menu-toggle');
    var overlay = $('.nav-overlay');
    if (!toggle || !overlay) return;

    var links = $$('a', overlay);

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      overlay.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      overlay.setAttribute('aria-hidden', String(!open));
      if (open && links.length) { links[0].focus(); }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });

    setOpen(false);
  }());

  /* ----- Scroll spy (homepage nav and case-study index) -------------- */
  (function scrollSpy() {
    var groups = [
      { links: $$('.nav__link[href^="#"]') },
      { links: $$('.cs-toc__link[href^="#"]') }
    ].filter(function (g) { return g.links.length; });

    if (!groups.length || !('IntersectionObserver' in window)) return;

    groups.forEach(function (group) {
      var map = {};
      var targets = [];

      group.links.forEach(function (link) {
        var id = link.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        if (!el) return;
        map[id] = link;
        targets.push(el);
      });
      if (!targets.length) return;

      var visible = {};

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        var bestId = null, best = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > best) { best = visible[id]; bestId = id; }
        });

        group.links.forEach(function (link) { link.removeAttribute('aria-current'); });
        if (bestId && map[bestId]) { map[bestId].setAttribute('aria-current', 'true'); }
      }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] });

      targets.forEach(function (t) { io.observe(t); });
    });
  }());

  /* ----- Scroll reveal ---------------------------------------------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  }());

  /* ----- Work map ---------------------------------------------------
     Four areas of application around one identity. Each branch is a real
     link to the project that best evidences it, so reaching a case study
     from the circle is one click. Hover or keyboard focus previews the
     area: the branch lights, the status bar names it, and the projects
     that do not belong recede in the list below. Nothing is hidden, and
     there is no held state to undo — a click leaves the page. */
  (function workMap() {
    var map = $('.workmap');
    if (!map) return;

    var nodes = $$('.wmnode', map);
    var rows = $$('.wrow');
    if (!nodes.length || !rows.length) return;

    var marks = $$('[data-line], [data-arc]', map);
    var statusEl = $('[data-wm-status]');
    if (!statusEl) return;

    /* The All projects bar starts invisible on a hover-capable device (see the
       `@media (hover: hover)` block in main.css) so it cannot take the first click ahead
       of the four area circles. The first hover or focus on any area arms it, and it stays
       armed. On a touch device the CSS never hides it, so this is decoration there. */
    var statusBar = $('.wstatus');
    var armed = false;
    function armStatus() {
      if (armed || !statusBar) return;
      armed = true;
      statusBar.classList.add('is-armed');
    }

    var ALL = statusEl.textContent;

    function areasOf(row) {
      return (row.getAttribute('data-areas') || '').split(/\s+/);
    }

    function preview(area) {
      nodes.forEach(function (n) {
        n.classList.toggle('is-active', area !== null && n.getAttribute('data-area') === area);
      });

      marks.forEach(function (el) {
        var key = el.getAttribute('data-line') || el.getAttribute('data-arc');
        el.classList.toggle('is-active', area !== null && key === area);
      });

      rows.forEach(function (r) {
        r.classList.toggle('is-dimmed', area !== null && areasOf(r).indexOf(area) === -1);
      });

      if (area === null) { statusEl.textContent = ALL; return; }

      /* the area name alone: the circle carries no counts, so the status bar carries none either */
      var node = nodes.filter(function (n) { return n.getAttribute('data-area') === area; })[0];
      statusEl.textContent = node ? node.getAttribute('data-label') : ALL;
    }

    nodes.forEach(function (n) {
      var area = n.getAttribute('data-area');
      n.addEventListener('mouseenter', function () { armStatus(); preview(area); });
      n.addEventListener('mouseleave', function () { preview(null); });
      n.addEventListener('focus', function () { armStatus(); preview(area); });
      n.addEventListener('blur', function () { preview(null); });
    });

    preview(null);
  }());

  /* ----- Centred anchor scrolling ------------------------------------
     A bare fragment jump parks the target's first line hard against the
     header, which reads as though the page has been cut off. Instead:
     centre a target shorter than the viewport, and give a taller one a
     comfortable margin above it. Applies to the nav, the hero arrow and
     the case-study table of contents alike. */
  (function centredAnchors() {
    var links = $$('a[href^="#"]').filter(function (a) {
      return !a.classList.contains('skip-link') && a.getAttribute('href').length > 1;
    });
    if (!links.length) return;

    function headerHeight() {
      var header = $('.site-header');
      return header ? header.getBoundingClientRect().height : 0;
    }

    function targetTop(el) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      var head = headerHeight();
      var height = Math.max(el.offsetHeight, rect.height);
      var top = rect.top + window.pageYOffset;

      /* if the target fits on screen at all, centre it — that is the whole
         point of "click and see the section in one page". Only a target too
         tall to fit gets the fallback margin, which puts its heading about a
         fifth of the way down instead of flush under the header. */
      var gap = height <= vh - head - 24
        ? (vh - height) / 2
        : head + Math.max(28, vh * 0.11);

      var y = top - Math.max(gap, head + 12);

      /* A focal block may nominate one element that must never land below the fold.
         #work uses it for the "All projects" bar: that bar is the way into the list,
         so it has to be on screen however tall the block above it is. On a desktop
         window the block already fits and this changes nothing; on a narrow or short
         one it pulls the landing down instead of cutting the bar off. */
      var keep = el.querySelector && el.querySelector('[data-anchor-keep]');
      if (keep) {
        var kRect = keep.getBoundingClientRect();
        var kTop = kRect.top + window.pageYOffset;
        var kBottom = kRect.bottom + window.pageYOffset;
        y = Math.max(y, kBottom + 16 - vh);   /* bring its bottom into view */
        y = Math.min(y, kTop - head - 12);    /* but never tuck it under the header */
      }

      return y;
    }

    function focalOf(el) {
      return el.querySelector('[data-anchor-focus]') || el;
    }

    /* A block we scrolled to deliberately must not then animate in.
       The reveal observer uses `rootMargin: 0px 0px -8% 0px`, so an element sitting in
       the bottom 8% of the window never intersects and never gets `is-visible` — and
       that is exactly where a correct #work landing parks the All projects bar. The bar
       could therefore be in the right place at opacity 0, which is what the owner
       photographed. Rather than retune the observer for ordinary scrolling, everything
       inside a block we just landed is shown at once.

       It also makes the measurement honest: `.js .reveal` carries
       `transform: translateY(18px)`, and `getBoundingClientRect()` includes transforms,
       so measuring a block whose children are still translated is measuring the wrong
       geometry. `is-shown` kills the transition, so the rect is final before we read it. */
    function showAll(el) {
      if (!el) return;
      var list = el.classList && el.classList.contains('reveal') ? [el] : [];
      var inner = el.querySelectorAll ? el.querySelectorAll('.reveal') : [];
      for (var i = 0; i < inner.length; i++) list.push(inner[i]);
      list.forEach(function (node) {
        node.style.transitionDelay = '0ms';
        node.classList.add('is-visible', 'is-shown');
      });
    }

    /* the hash this page instance last landed on, set by both routes below */
    var landedHash = null;

    /* An arriving #hash — a case study's "All work" link, a bookmark, a reload —
       must land on exactly the same screen as clicking the nav link does. The
       browser's own hash jump uses scroll-padding-top and parks the section top
       under the header, so correct it once the page has settled. */
    (function incomingHash() {
      function land() {
        var id = (window.location.hash || '').slice(1);
        if (!id) return;
        var el = document.getElementById(id);
        if (!el) return;
        landedHash = window.location.hash;
        var focal = focalOf(el);
        showAll(focal);                       /* before measuring: see showAll() */
        var y = Math.max(0, Math.round(targetTop(focal)));
        try { window.scrollTo({ top: y, behavior: 'instant' }); }
        catch (err) { window.scrollTo(0, y); }
      }

      function settle() {
        land();
        window.requestAnimationFrame(land);   /* fonts and lazy images settle late */
      }

      window.addEventListener('load', settle);

      /* A hash reached by Back or Forward, or typed into the address bar, has to land
         the same screen too. Our own clicks use pushState, which fires no hashchange,
         so this never double-scrolls a click. */
      window.addEventListener('hashchange', settle);

      /* Coming back from a case study can restore this page from the bfcache, where
         `load` never fires again. Correct it only when the hash actually changed — a
         plain Back must keep the reading position the visitor left. */
      window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        if (window.location.hash === landedHash) return;
        settle();
      });
    }());

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        if (!el) return;

        e.preventDefault();

        /* a section may nominate the one thing that must be fully in view —
           #work centres `.work__lead` rather than the top of a 2,450px section */
        var focal = focalOf(el);
        showAll(focal);                       /* before measuring: see showAll() */
        var y = Math.max(0, Math.round(targetTop(focal)));

        try {
          window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
        } catch (err) {
          window.scrollTo(0, y);                      /* older syntax */
        }

        /* keep the address bar and the focus ring honest without re-jumping */
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', '#' + id);
        }
        landedHash = '#' + id;
        var focusable = el.hasAttribute('tabindex');
        if (!focusable) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
        if (!focusable) el.removeAttribute('tabindex');
      });
    });
  }());

  /* ----- Project report: split, not overlay ---------------------------
     The markup is <details>/<summary>, so with this script disabled the
     report expands under the project like any disclosure. With the script
     the report is LIFTED OUT of the <details> and placed as the second
     child of the project's stage, which lets the open state put the
     evidence in one half of the page and the report in the other — same
     type scale, no dimming, neither one subordinate to the other.

     Several projects may be open at once: nothing is modal, so closing
     one because another was opened would only lose the reader's place.   */
  (function projectSplit() {
    var cases = $$('.sh-case');
    if (!cases.length) return;
    var seq = 0;

    function lift(kase) {
      var det = $('details.sh-about', kase);
      var stage = $('.sh-stage', kase);
      if (!det || !stage) return null;

      var panel = $('.sh-panel', det);
      var summary = $('summary.sh-pill', det);
      if (!panel || !summary) return null;

      seq += 1;
      var id = 'sh-report-' + seq;
      panel.id = id;
      stage.appendChild(panel);

      /* the disclosure becomes a plain toggle once it no longer wraps
         anything — a <details> with only a <summary> would still render
         its own marker semantics to assistive technology */
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sh-pill';
      btn.innerHTML = summary.innerHTML;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      det.parentNode.replaceChild(btn, det);

      /* No close button inside the report: the control itself closes it,
         reading “About the project −”, and it stays on screen for the whole
         project so it can be reached from anywhere in the scroll. */
      return { kase: kase, btn: btn, panel: panel };
    }

    var opened = [];

    cases.forEach(function (kase) {
      var parts = lift(kase);
      if (!parts) return;

      function setOpen(on) {
        parts.kase.classList.toggle('is-split', on);
        parts.btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (on) { if (opened.indexOf(parts) < 0) opened.push(parts); }
        else {
          var i = opened.indexOf(parts);
          if (i > -1) opened.splice(i, 1);
        }
      }

      parts.setOpen = setOpen;
      parts.btn.addEventListener('click', function () {
        setOpen(!parts.kase.classList.contains('is-split'));
      });

    });

    document.addEventListener('keydown', function (ev) {
      /* the overlay is modal and owns Escape while it is up: closing the
         project underneath it would collapse the page behind the reader */
      if (document.querySelector('.sh-lb.is-open')) return;
      if (ev.key !== 'Escape' || !opened.length) return;
      opened.slice().forEach(function (p) { p.setOpen(false); });
    });
  }());

  /* ----- Evidence at full size ----------------------------------------
     In a secondary project, once the report is open, each piece of
     evidence can be clicked and seen properly. CLOSED IT CANNOT: the row
     is an index there, and a frame that enlarges would compete with the
     one thing the row is for. Each frame is a real <button> that is
     `disabled` while the project is shut, so it is neither clickable nor
     in the tab order, and assistive technology says so.

     The overlay is built once, on the first open, and it is the only
     thing on this page that stops the page scrolling. That is the
     opposite of the stepping mechanism that was removed: it is asked for
     by a click, it says what it is, and it closes on the scrim, on the
     ×, or on Escape.                                                    */
  (function evidenceZoom() {
    var cases = $$('.sh-case--sec, .sh-case--lead');
    if (!cases.length) return;

    var SVG = ' viewBox="0 0 24 24" width="24" height="24" fill="none"' +
      ' stroke="currentColor" stroke-width="1.6" stroke-linecap="round"' +
      ' stroke-linejoin="round" focusable="false" aria-hidden="true"';
    var ICON = {
      x:    '<svg' + SVG + '><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
      prev: '<svg' + SVG + '><path d="M15 4.5 7.5 12 15 19.5"/></svg>',
      next: '<svg' + SVG + '><path d="M9 4.5 16.5 12 9 19.5"/></svg>'
    };

    var lb = null, stage = null, capName = null, capLine = null, count = null;
    var prevBtn = null, nextBtn = null;
    var current = null, lastFocus = null;

    /* ---- the frames become buttons, one group per project ----

       Two evidence components feed the same viewer: the secondary
       projects' grid (.sh-eg__i) and the featured project's mosaic
       (.sh-shot). A featured cell that carries a sequence contributes one
       entry per image, so the viewer's own back/forward walks the
       sequence exactly as it walks everything else in the project.      */
    cases.forEach(function (kase) {
      var group = [];
      var lead = kase.classList.contains('sh-case--lead');

      $$('.sh-eg__i, .sh-shot', kase).forEach(function (fig) {
        var isShot = fig.classList.contains('sh-shot');
        var frame = isShot ? $('.sh-shot__frame', fig) : $('.sh-eg__f', fig);
        if (!frame) return;

        var name = '', line = '';
        if (isShot) {
          var nEl = $('.sh-shot__name', fig), lEl = $('.sh-shot__line', fig);
          name = nEl ? nEl.textContent.trim() : '';
          line = lEl ? lEl.textContent.trim() : '';
        } else {
          var cap = $('.sh-eg__c', fig);
          var b = cap ? cap.querySelector('b') : null;
          var sp = cap ? cap.querySelector('span') : null;
          name = b ? b.textContent.trim() : '';
          line = sp ? sp.textContent.trim() : '';
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = frame.className;
        btn.innerHTML = frame.innerHTML;
        btn.disabled = !lead;
        frame.parentNode.replaceChild(btn, frame);

        var imgs = $$('img', btn);
        var entries = [];
        if (imgs.length > 1) {
          imgs.forEach(function (im) {
            var e = { btn: btn, group: group, name: name, line: line, img: im };
            entries.push(e); group.push(e);
          });
        } else {
          var e1 = { btn: btn, group: group, name: name, line: line, img: imgs[0] || null };
          entries.push(e1); group.push(e1);
        }
        btn.__entries = entries;
        /* open whichever image of a sequence is the one on show */
        btn.addEventListener('click', function () {
          var pick = entries[0];
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].img && !entries[i].img.hidden) { pick = entries[i]; break; }
          }
          open(pick);
        });
      });
      if (!group.length) return;

      sync(kase, group);
      /* the frames follow the project's own open state; watching the
         class keeps this module independent of the one that sets it */
      if (!lead && 'MutationObserver' in window) {
        new MutationObserver(function () { sync(kase, group); })
          .observe(kase, { attributes: true, attributeFilter: ['class'] });
      }
    });

    function sync(kase, group) {
      /* the featured project's evidence is always on show, so it is always
         openable; a secondary row is an index until it is opened */
      var on = kase.classList.contains('sh-case--lead') || kase.classList.contains('is-split');
      group.forEach(function (e) {
        e.btn.disabled = !on;
        if (on) { e.btn.setAttribute('aria-label', 'View ' + (e.name || 'this evidence') + ' at full size'); }
        else { e.btn.removeAttribute('aria-label'); }
      });
    }

    /* ---- A bigger source for the pilot photographs, IN THE CROP THE
            READER ALREADY SAW. They are hotlinked with a width in the
            query and no height, so the file that comes back is whatever
            shape the original is — the first one is 900x1200, portrait,
            while its own width/height attributes claim 4:3. In the grid
            that never shows, because the frame has a fixed ratio and the
            photograph is cropped to fill it. Full size it would show as
            a portrait the reader never clicked on.

            So the height goes in the query too, taken from the element's
            own declared ratio, and `fit=crop` (already in every src) does
            the rest. ---- */
    function setParam(url, name, value) {
      var needle = name + '=';
      var i = url.indexOf('&' + needle);
      if (i < 0) { i = url.indexOf('?' + needle); }
      if (i < 0) { return url + (url.indexOf('?') < 0 ? '?' : '&') + needle + value; }
      var j = i + 1 + needle.length;
      var k = j;
      while (k < url.length && url.charAt(k) !== '&') { k += 1; }
      /* splice by index — a replacement string would read $ as a token */
      return url.slice(0, j) + value + url.slice(k);
    }

    function bigger(src, aw, ah) {
      if (!src) return src;
      /* local evidence is prepared for the web at a size chosen from what
         the source can actually carry — it is served as it is, never
         re-requested at some larger width it does not have */
      if (src.indexOf('//') < 0) { return src; }
      var W = 1800;
      var out = setParam(src, 'w', String(W));
      var w = parseFloat(aw), h = parseFloat(ah);
      if (w > 0 && h > 0) { out = setParam(out, 'h', String(Math.round(W * (h / w)))); }
      return out;
    }

    function build() {
      lb = document.createElement('div');
      lb.className = 'sh-lb';
      lb.innerHTML =
        '<button type="button" class="sh-lb__scrim" tabindex="-1" aria-hidden="true"></button>' +
        '<div class="sh-lb__fig" role="dialog" aria-modal="true" aria-label="Evidence at full size">' +
          '<div class="sh-lb__stage"></div>' +
          '<div class="sh-lb__cap"><b></b><span></span></div>' +
        '</div>' +
        '<button type="button" class="sh-lb__x" aria-label="Close">' + ICON.x + '</button>' +
        '<button type="button" class="sh-lb__go sh-lb__go--prev" aria-label="Previous">' + ICON.prev + '</button>' +
        '<button type="button" class="sh-lb__go sh-lb__go--next" aria-label="Next">' + ICON.next + '</button>' +
        '<p class="sh-lb__n" aria-live="polite"></p>';
      document.body.appendChild(lb);

      stage   = $('.sh-lb__stage', lb);
      capName = $('.sh-lb__cap b', lb);
      capLine = $('.sh-lb__cap span', lb);
      count   = $('.sh-lb__n', lb);
      prevBtn = $('.sh-lb__go--prev', lb);
      nextBtn = $('.sh-lb__go--next', lb);

      $('.sh-lb__scrim', lb).addEventListener('click', close);
      $('.sh-lb__x', lb).addEventListener('click', close);
      prevBtn.addEventListener('click', function () { step(-1); });
      nextBtn.addEventListener('click', function () { step(1); });
    }

    function render(entry) {
      current = entry;
      stage.innerHTML = '';

      var img = entry.img || entry.btn.querySelector('img');
      var svg = entry.img ? null : entry.btn.querySelector('svg');
      if (img) {
        var el = document.createElement('img');
        el.src = bigger(img.getAttribute('src'), img.getAttribute('width'), img.getAttribute('height'));
        el.alt = img.getAttribute('alt') || '';
        /* the intrinsic size comes with it, so the box has the right
           shape from the first frame instead of after the download */
        if (img.getAttribute('width')) { el.setAttribute('width', img.getAttribute('width')); }
        if (img.getAttribute('height')) { el.setAttribute('height', img.getAttribute('height')); }
        stage.appendChild(el);
      } else if (svg) {
        var c = svg.cloneNode(true);
        c.removeAttribute('width');
        c.removeAttribute('height');
        stage.classList.add('sh-lb__stage--doc');
        stage.appendChild(c);
      }
      if (!svg) { stage.classList.remove('sh-lb__stage--doc'); }

      capName.textContent = entry.name;
      capLine.textContent = entry.line;

      var n = entry.group.indexOf(entry) + 1;
      var of = entry.group.length;
      count.textContent = n + ' / ' + of;
      count.hidden = of < 2;
      prevBtn.hidden = of < 2;
      nextBtn.hidden = of < 2;
    }

    function open(entry) {
      if (!lb) build();
      lastFocus = document.activeElement;
      render(entry);
      lb.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('.sh-lb__x', lb).focus();
    }

    function close() {
      if (!lb || !lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      stage.innerHTML = '';
      var back = (current && current.btn) || lastFocus;
      current = null;
      if (back && !back.disabled && typeof back.focus === 'function') { back.focus(); }
    }

    function step(d) {
      if (!current) return;
      var g = current.group;
      var i = g.indexOf(current);
      if (i < 0) return;
      render(g[(i + d + g.length) % g.length]);
    }

    document.addEventListener('keydown', function (ev) {
      if (!lb || !lb.classList.contains('is-open')) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); return; }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); return; }
      if (ev.key !== 'Tab') return;
      /* the overlay is modal, so the tab order is the overlay's */
      var can = $$('button', lb).filter(function (b) { return !b.hidden && b.tabIndex >= 0; });
      if (!can.length) return;
      var first = can[0], last = can[can.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      else if (can.indexOf(document.activeElement) < 0) { ev.preventDefault(); first.focus(); }
    });
  }());


  /* ----- Footer year ------------------------------------------------- */
  /* ── EVIDENCE SEQUENCES ────────────────────────────────────────────
     Several images that are one piece of evidence — a drawing set, a
     pattern piece by piece, one room after another — shown one at a time
     in a single frame. The control language is the viewer's: back,
     forward, a counter, and the arrow keys while the frame has focus.

     The markup ships every image with all but the first `hidden`, so with
     the script off the first image stands on its own and nothing is
     broken. Nothing is added to the page that is not asked for.        */
  (function evidenceSeq() {
    var figs = $$('[data-seq]');
    if (!figs.length) return;

    var SVG = ' viewBox="0 0 24 24" width="24" height="24" fill="none"' +
      ' stroke="currentColor" stroke-width="1.7" stroke-linecap="round"' +
      ' stroke-linejoin="round" focusable="false" aria-hidden="true"';
    var PREV = '<svg' + SVG + '><path d="M15 4.5 7.5 12 15 19.5"/></svg>';
    var NEXT = '<svg' + SVG + '><path d="M9 4.5 16.5 12 9 19.5"/></svg>';

    figs.forEach(function (fig) {
      var imgs = $$('img', fig);
      if (imgs.length < 2) return;
      var cap = $('.sh-shot__cap', fig) || $('.sh-eg__c', fig) || $('.figure__cap', fig);
      if (!cap) return;

      var i = 0;
      var nav = document.createElement('p');
      nav.className = 'sh-seq__nav';
      nav.innerHTML =
        '<button type="button" class="sh-seq__go sh-seq__go--prev" aria-label="Previous item">' + PREV + '</button>' +
        '<button type="button" class="sh-seq__go sh-seq__go--next" aria-label="Next item">' + NEXT + '</button>' +
        '<span class="sh-seq__n" aria-live="polite"></span>';
      cap.appendChild(nav);

      var n = nav.querySelector('.sh-seq__n');
      function show(k) {
        i = (k + imgs.length) % imgs.length;
        imgs.forEach(function (im, j) { im.hidden = (j !== i); });
        n.textContent = (i + 1) + ' / ' + imgs.length;
      }
      nav.querySelector('.sh-seq__go--prev').addEventListener('click', function () { show(i - 1); });
      nav.querySelector('.sh-seq__go--next').addEventListener('click', function () { show(i + 1); });

      fig.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); show(i - 1); }
        else if (ev.key === 'ArrowRight') { ev.preventDefault(); show(i + 1); }
      });
      show(0);
    });
  }());

  (function year() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }());
}());
