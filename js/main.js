/* ============================================================
   MOHAMMAD ABDULLAH — PORTFOLIO — main.js
   ============================================================ */
(function(){
  "use strict";

  /* ---------- Config ---------- */
  const GITHUB_OWNER   = "trendytouch65-alt";
  const GITHUB_REPO    = "portfolio-website";
  const CONTENT_PATH   = "data/content.json";
  const CONTENT_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${CONTENT_PATH}?t=${Date.now()}`;

  const DEFAULT_FAVICON = "https://raw.githubusercontent.com/trendytouch65-alt/portfolio-assets/main/New%20Project%20%284%29.jpg";
  const DEFAULT_FOOTER_LOGO = DEFAULT_FAVICON;

  window.SITE_CONFIG = { GITHUB_OWNER, GITHUB_REPO, CONTENT_PATH, CONTENT_RAW_URL, DEFAULT_FAVICON, DEFAULT_FOOTER_LOGO };

  /* ---------- Utilities exposed for admin.js ---------- */

  // Convert a GitHub "blob" URL (or plain path) into a raw.githubusercontent.com URL.
  // Leaves already-raw or fully-external URLs untouched.
  function normalizeGithubUrl(input){
    if(!input) return input;
    let url = input.trim();
    try{
      const blobMatch = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i);
      if(blobMatch){
        const [, owner, repo, branch, path] = blobMatch;
        const encodedPath = path.split('/').map(seg => {
          try{ return encodeURIComponent(decodeURIComponent(seg)); }
          catch(e){ return encodeURIComponent(seg); }
        }).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
      }
      // already raw or external — return as-is
      return url;
    }catch(e){
      return url;
    }
  }
  window.normalizeGithubUrl = normalizeGithubUrl;

  function extractYouTubeId(input){
    if(!input) return null;
    const url = input.trim();
    const patterns = [
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for(const re of patterns){
      const m = url.match(re);
      if(m) return m[1];
    }
    return null;
  }
  window.extractYouTubeId = extractYouTubeId;

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg, isError){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.borderColor = isError ? '#E0554A' : 'var(--border-strong)';
    t.style.color = isError ? '#E0554A' : 'var(--text)';
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('is-visible'), 3000);
  }
  window.showToast = showToast;

  /* ---------- Confirm dialog ---------- */
  function showConfirm(message){
    return new Promise((resolve)=>{
      const overlay = document.getElementById('confirmOverlay');
      const msgEl = document.getElementById('confirmMessage');
      const okBtn = document.getElementById('confirmOk');
      const cancelBtn = document.getElementById('confirmCancel');
      msgEl.textContent = message || 'Are you sure?';
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden','false');

      function cleanup(result){
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden','true');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk(){ cleanup(true); }
      function onCancel(){ cleanup(false); }
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }
  window.showConfirm = showConfirm;

  /* ---------- Data store ---------- */
  window.SITE_DATA = {
    meta: { favicon: DEFAULT_FAVICON, footerLogo: DEFAULT_FOOTER_LOGO },
    social: { whatsappNumber: "", telegramUsername: "", facebookUrl: "" },
    projects: { marquee: [], drift: [], more: [] },
    videos: []
  };

  async function loadContent(){
    try{
      const res = await fetch(CONTENT_RAW_URL, { cache: "no-store" });
      if(!res.ok) throw new Error("Failed to fetch content.json: " + res.status);
      const data = await res.json();
      window.SITE_DATA = Object.assign({}, window.SITE_DATA, data);
    }catch(e){
      console.warn("Could not load content.json, using defaults.", e);
    }
    return window.SITE_DATA;
  }
  window.loadContent = loadContent;

  /* ============================================================
     RENDER FUNCTIONS
     ============================================================ */

  function applyMeta(){
    const d = window.SITE_DATA;
    const fav = d.meta && d.meta.favicon ? d.meta.favicon : DEFAULT_FAVICON;
    const logo = d.meta && d.meta.footerLogo ? d.meta.footerLogo : DEFAULT_FOOTER_LOGO;
    const favLink = document.getElementById('faviconLink');
    const appleFavLink = document.getElementById('appleFaviconLink');
    if(favLink) favLink.href = fav;
    if(appleFavLink) appleFavLink.href = fav;
    const footerLogoImg = document.getElementById('footerLogoImg');
    if(footerLogoImg) footerLogoImg.src = logo;
  }

  function applySocial(){
    const s = window.SITE_DATA.social || {};
    const waCard = document.getElementById('whatsappCard');
    const tgCard = document.getElementById('telegramCard');
    const fbCard = document.getElementById('facebookCard');
    const tgGraphic = document.getElementById('telegramGraphic');
    const tgHandle = document.getElementById('telegramHandle');

    if(s.whatsappNumber){
      waCard.href = `https://wa.me/${s.whatsappNumber}`;
    }
    if(s.telegramUsername){
      tgCard.href = `https://t.me/${s.telegramUsername}`;
      tgGraphic.href = `https://t.me/${s.telegramUsername}`;
      tgHandle.textContent = `@${s.telegramUsername}`;
    }
    if(s.facebookUrl){
      fbCard.href = s.facebookUrl;
      fbCard.target = "_blank";
      fbCard.rel = "noopener";
      fbCard.classList.remove('contact-card--muted');
    } else {
      fbCard.removeAttribute('href');
      fbCard.classList.add('contact-card--muted');
    }
  }

  /* ---- Lightbox ---- */
  let lightboxList = [];
  let lightboxIndex = 0;
  const lightboxEl = () => document.getElementById('lightbox');
  const lightboxImgEl = () => document.getElementById('lightboxImg');

  function openLightbox(list, index){
    lightboxList = list;
    lightboxIndex = index;
    lightboxImgEl().src = lightboxList[lightboxIndex];
    lightboxEl().classList.add('is-open');
    lightboxEl().setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }
  function closeLightbox(){
    lightboxEl().classList.remove('is-open');
    lightboxEl().setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }
  function lightboxStep(dir){
    if(!lightboxList.length) return;
    lightboxIndex = (lightboxIndex + dir + lightboxList.length) % lightboxList.length;
    lightboxImgEl().src = lightboxList[lightboxIndex];
  }
  window.openLightbox = openLightbox;

  /* ---- Marquee ---- */
  function renderMarquee(){
    const track = document.getElementById('marqueeTrack');
    const imgs = window.SITE_DATA.projects.marquee || [];
    track.innerHTML = "";
    if(!imgs.length) return;
    const doubled = imgs.concat(imgs);
    doubled.forEach((src, i)=>{
      const item = document.createElement('div');
      item.className = 'marquee__item';
      item.innerHTML = `<img src="${src}" alt="Project image" loading="lazy">`;
      item.addEventListener('click', ()=> openLightbox(getAllProjectImages(), i % imgs.length));
      track.appendChild(item);
    });
    // pause on manual drag/touch too
    const container = document.getElementById('marquee');
    setupDragPause(container, track);
  }

  /* ---- Drift ---- */
  function renderDrift(){
    const container = document.getElementById('drift');
    const imgs = window.SITE_DATA.projects.drift || [];
    container.innerHTML = "";
    if(!imgs.length) return;
    const cols = [[],[],[]];
    imgs.forEach((src,i)=> cols[i % 3].push(src));
    const durations = [34, 40, 37];
    cols.forEach((colImgs, colIdx)=>{
      if(!colImgs.length) return;
      const colEl = document.createElement('div');
      const goingUp = colIdx % 2 === 0;
      colEl.className = 'drift__col ' + (goingUp ? 'drift__col--up' : 'drift__col--down');
      colEl.style.animationDuration = durations[colIdx % durations.length] + 's';
      const doubled = colImgs.concat(colImgs);
      doubled.forEach((src)=>{
        const globalIndex = imgs.indexOf(src);
        const item = document.createElement('div');
        item.className = 'drift__item';
        item.innerHTML = `<img src="${src}" alt="Project image" loading="lazy">`;
        item.addEventListener('click', ()=>{
          const marqueeLen = (window.SITE_DATA.projects.marquee||[]).length;
          openLightbox(getAllProjectImages(), marqueeLen + globalIndex);
        });
        colEl.appendChild(item);
      });
      container.appendChild(colEl);
    });
  }

  /* ---- More work ---- */
  function renderMore(){
    const grid = document.getElementById('moreGrid');
    const block = document.getElementById('moreWorkBlock');
    const imgs = window.SITE_DATA.projects.more || [];
    grid.innerHTML = "";
    if(!imgs.length){ block.hidden = true; return; }
    block.hidden = false;
    imgs.forEach((src, i)=>{
      const item = document.createElement('div');
      item.className = 'more-grid__item';
      item.innerHTML = `<img src="${src}" alt="Project image" loading="lazy">`;
      item.addEventListener('click', ()=>{
        const marqueeLen = (window.SITE_DATA.projects.marquee||[]).length;
        const driftLen = (window.SITE_DATA.projects.drift||[]).length;
        openLightbox(getAllProjectImages(), marqueeLen + driftLen + i);
      });
      grid.appendChild(item);
    });
  }

  function getAllProjectImages(){
    const p = window.SITE_DATA.projects;
    return [].concat(p.marquee||[], p.drift||[], p.more||[]);
  }

  /* ---- Videos ---- */
  function ytThumb(id){ return `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }

  function buildVideoCard(id){
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <img src="${ytThumb(id)}" alt="Video thumbnail" loading="lazy">
      <span class="video-card__play">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </span>
      <iframe class="video-card__frame" src="" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
    card.addEventListener('click', function handler(){
      if(card.classList.contains('is-playing')) return;
      card.classList.add('is-playing');
      const frame = card.querySelector('.video-card__frame');
      frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    });
    return card;
  }

  function renderVideos(){
    const grid = document.getElementById('videoGrid');
    const ids = window.SITE_DATA.videos || [];
    grid.innerHTML = "";
    ids.slice(0,3).forEach(id => grid.appendChild(buildVideoCard(id)));
  }

  /* ---- View All modals ---- */
  function openModal(id){
    const el = document.getElementById(id);
    el.classList.add('is-open');
    el.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }
  function closeModal(el){
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }

  function renderAllProjectsModal(){
    const grid = document.getElementById('allProjectsGrid');
    grid.innerHTML = "";
    const all = getAllProjectImages();
    all.forEach((src, i)=>{
      const img = document.createElement('img');
      img.src = src; img.alt = "Project image"; img.loading = "lazy";
      img.addEventListener('click', ()=> openLightbox(all, i));
      grid.appendChild(img);
    });
  }

  function renderAllVideosModal(){
    const grid = document.getElementById('allVideosGrid');
    grid.innerHTML = "";
    const ids = window.SITE_DATA.videos || [];
    ids.forEach(id => grid.appendChild(buildVideoCard(id)));
  }

  /* ---- Master render ---- */
  function renderAll(){
    applyMeta();
    applySocial();
    renderMarquee();
    renderDrift();
    renderMore();
    renderVideos();
    setupOffscreenPause();
  }
  window.renderAll = renderAll;

  /* ============================================================
     FILTERS
     ============================================================ */
  function setupFilters(){
    const buttons = document.querySelectorAll('.filter');
    buttons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        buttons.forEach(b=> b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.proj-block[data-group], .proj-block__cta[data-group]').forEach(block=>{
          const group = block.dataset.group;
          if(filter === 'all'){ block.hidden = false; }
          else{ block.hidden = group !== filter; }
        });
      });
    });
  }

  /* ============================================================
     DRAG-TO-PAUSE for marquee (touch/mouse swipe)
     ============================================================ */
  function setupDragPause(container, track){
    let isDown = false, startX = 0, startScroll = 0;
    container.addEventListener('pointerdown', (e)=>{
      isDown = true;
      track.classList.add('is-dragging');
      startX = e.clientX;
      const style = window.getComputedStyle(track);
      const matrix = new DOMMatrixReadOnly(style.transform);
      startScroll = matrix.m41;
      container.setPointerCapture(e.pointerId);
    });
    container.addEventListener('pointermove', (e)=>{
      if(!isDown) return;
      const dx = e.clientX - startX;
      track.style.transform = `translateX(${startScroll + dx}px)`;
    });
    function release(){
      if(!isDown) return;
      isDown = false;
      // resume CSS animation from current visual spot by clearing inline transform after a tick
      setTimeout(()=>{
        track.style.transform = "";
        track.classList.remove('is-dragging');
      }, 150);
    }
    container.addEventListener('pointerup', release);
    container.addEventListener('pointerleave', release);
    container.addEventListener('pointercancel', release);
  }

  /* ============================================================
     PAUSE ANIMATIONS WHEN OFFSCREEN (perf)
     ============================================================ */
  function setupOffscreenPause(){
    const targets = [document.getElementById('marquee'), document.getElementById('drift')].filter(Boolean);
    if(!('IntersectionObserver' in window) || !targets.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        entry.target.classList.toggle('offscreen', !entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    targets.forEach(t=> io.observe(t));
  }

  /* ============================================================
     HEADER / NAV
     ============================================================ */
  function setupHeader(){
    const header = document.getElementById('header');
    function onScroll(){
      header.classList.toggle('is-scrolled', window.scrollY > 30);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });

    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    toggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true':'false');
    });
    nav.querySelectorAll('.nav__link').forEach(link=>{
      link.addEventListener('click', ()=>{
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded','false');
      });
    });
  }

  function setupSmoothScroll(){
    document.querySelectorAll('[data-scroll]').forEach(link=>{
      link.addEventListener('click', (e)=>{
        const href = link.getAttribute('href');
        if(!href || href.charAt(0) !== '#') return;
        const target = document.querySelector(href);
        if(!target) return;
        e.preventDefault();
        const headerH = document.getElementById('header').offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ============================================================
     LIGHTBOX & MODAL EVENTS
     ============================================================ */
  function setupLightboxEvents(){
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', ()=> lightboxStep(-1));
    document.getElementById('lightboxNext').addEventListener('click', ()=> lightboxStep(1));
    lightboxEl().addEventListener('click', (e)=>{ if(e.target === lightboxEl()) closeLightbox(); });
    document.addEventListener('keydown', (e)=>{
      if(!lightboxEl().classList.contains('is-open')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') lightboxStep(-1);
      if(e.key === 'ArrowRight') lightboxStep(1);
    });
  }

  function setupModalEvents(){
    document.getElementById('viewAllProjectsBtn').addEventListener('click', ()=>{
      renderAllProjectsModal();
      openModal('allProjectsModal');
    });
    document.getElementById('viewAllVideosBtn').addEventListener('click', ()=>{
      renderAllVideosModal();
      openModal('allVideosModal');
    });
    document.querySelectorAll('.modal').forEach(modal=>{
      modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(modal); });
      modal.querySelectorAll('[data-close-modal]').forEach(btn=>{
        btn.addEventListener('click', ()=> closeModal(modal));
      });
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key !== 'Escape') return;
      document.querySelectorAll('.modal.is-open').forEach(m=> closeModal(m));
    });
  }

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  function setupFooterYear(){
    const el = document.getElementById('year');
    if(el) el.textContent = new Date().getFullYear();
  }

  /* ============================================================
     SCROLL REVEAL (GSAP)
     ============================================================ */
  function setupScrollReveal(){
    if(!window.gsap){ document.querySelectorAll('[data-reveal]').forEach(el=> el.style.opacity = 1); return; }
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('[data-reveal]').forEach((el)=>{
      gsap.fromTo(el, { opacity:0, y: 30 }, {
        opacity:1, y:0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });
  }

  /* ============================================================
     LOADING SCREEN — signature draw + curtain reveal
     ============================================================ */
  function runLoader(){
    return new Promise((resolve)=>{
      const loader = document.getElementById('loader');
      const group = document.getElementById('sigGroup');
      document.body.classList.add('no-scroll');

      if(typeof SIGNATURE_PATHS === 'undefined' || !SIGNATURE_PATHS.length || !window.gsap){
        // fallback: simple fade
        setTimeout(()=>{
          gsap && gsap.to ? gsap.to(loader, { autoAlpha:0, duration:.6, onComplete: finish }) : finish();
        }, 500);
        return;
      }

      const NS = "http://www.w3.org/2000/svg";
      const pathEls = SIGNATURE_PATHS.map(d=>{
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        group.appendChild(p);
        return p;
      });

      const lengths = pathEls.map(p => {
        try{ return p.getTotalLength(); } catch(e){ return 100; }
      });
      pathEls.forEach((p,i)=>{
        p.style.strokeDasharray = lengths[i];
        p.style.strokeDashoffset = lengths[i];
      });

      const tl = gsap.timeline({ onComplete: ()=>{
        setTimeout(()=>{
          gsap.to(loader, {
            yPercent: -100, duration: 1.0, ease: 'power4.inOut',
            onComplete: finish
          });
        }, 260);
      }});

      let cursor = 0;
      lengths.forEach((len, i)=>{
        const dur = Math.max(0.14, Math.min(0.5, len / 2600));
        tl.to(pathEls[i], { strokeDashoffset: 0, duration: dur, ease: 'power1.inOut' }, cursor);
        cursor += dur * 0.72; // slight overlap between letters, like natural handwriting
      });

      function finish(){
        loader.style.display = 'none';
        document.body.classList.remove('no-scroll');
        resolve();
      }

      // Hard safety cap
      setTimeout(()=>{
        if(loader.style.display !== 'none') finish();
      }, 7000);
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', async ()=>{
    setupHeader();
    setupSmoothScroll();
    setupFilters();
    setupLightboxEvents();
    setupModalEvents();
    setupFooterYear();

    const loaderPromise = runLoader();
    const dataPromise = loadContent();

    await Promise.all([loaderPromise, dataPromise]);

    renderAll();
    setupScrollReveal();

    // Let admin.js know data is ready (for cases where it initializes independently)
    document.dispatchEvent(new CustomEvent('site-data-ready'));
  });

})();
