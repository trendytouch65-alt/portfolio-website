/* ============================================================
   MOHAMMAD ABDULLAH — PORTFOLIO — admin.js
   Handles: password gate, GitHub token storage, and Add/Delete/
   Reorder for projects & videos + social/branding editing, all
   persisted straight to the portfolio-website GitHub repo.
   ============================================================ */
(function(){
  "use strict";

  /* ---------- Config ---------- */
  // SHA-256 hash of the admin password (never stored in plain text).
  const PASSWORD_HASH = "07ab59f4731b0790d0acfded6a52d2c53e7e3c6a1e241f6dfe3a41f3072e07fb";
  const TOKEN_KEY   = "pw_admin_gh_token";
  const SESSION_KEY = "pw_admin_session";

  const cfg = window.SITE_CONFIG || {};
  const API_BASE = `https://api.github.com/repos/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}/contents/${cfg.CONTENT_PATH}`;

  /* ---------- Helpers ---------- */
  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
  }

  function utf8ToB64(str){
    return btoa(unescape(encodeURIComponent(str)));
  }

  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }

  function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

  /* ---------- Draft state (working copy while panel is open) ---------- */
  let draft = null;

  function startDraft(){
    draft = deepClone(window.SITE_DATA);
    if(!draft.meta) draft.meta = {};
    if(!draft.social) draft.social = {};
    if(!draft.projects) draft.projects = { marquee:[], drift:[], more:[] };
    if(!draft.videos) draft.videos = [];
  }

  /* ---------- Status banner ---------- */
  function setStatus(msg, isError){
    const el = document.getElementById("adminStatus");
    if(!el) return;
    if(!msg){ el.hidden = true; return; }
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle("is-error", !!isError);
  }

  /* ============================================================
     GITHUB API
     ============================================================ */
  async function githubGetSha(){
    const token = getToken();
    const res = await fetch(API_BASE + "?ts=" + Date.now(), {
      headers: token ? { Authorization: "token " + token } : {}
    });
    if(res.status === 404) return null; // file doesn't exist yet
    if(!res.ok) throw new Error("GitHub GET failed (" + res.status + ")");
    const json = await res.json();
    return json.sha;
  }

  async function githubSaveContent(newData){
    const token = getToken();
    if(!token){
      throw new Error("No GitHub token saved. Go to the 'GitHub Setup' tab first.");
    }
    const sha = await githubGetSha();
    const body = {
      message: "Update content.json via admin panel",
      content: utf8ToB64(JSON.stringify(newData, null, 2)),
      branch: "main"
    };
    if(sha) body.sha = sha;

    const res = await fetch(API_BASE, {
      method: "PUT",
      headers: {
        Authorization: "token " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if(!res.ok){
      let detail = "";
      try{ const j = await res.json(); detail = j.message || ""; }catch(e){}
      if(res.status === 401) throw new Error("Invalid GitHub token. Please re-check it in GitHub Setup.");
      if(res.status === 403) throw new Error("Token doesn't have write access to this repo, or rate-limited. " + detail);
      if(res.status === 404) throw new Error("Repo/path not found. Check the repo name in main.js SITE_CONFIG.");
      throw new Error("GitHub save failed: " + (detail || res.status));
    }
    return res.json();
  }

  async function persist(newData, successMsg){
    setStatus("Saving to GitHub…", false);
    try{
      await githubSaveContent(newData);
      window.SITE_DATA = deepClone(newData);
      window.renderAll && window.renderAll();
      setStatus(successMsg || "Saved! Changes are live.", false);
      window.showToast && window.showToast(successMsg || "Saved successfully.");
    }catch(e){
      console.error(e);
      setStatus(e.message || "Something went wrong.", true);
      window.showToast && window.showToast(e.message || "Save failed.", true);
      throw e;
    }
  }

  /* ============================================================
     LIST MANAGERS (marquee / drift / more / videos)
     ============================================================ */
  const LIST_PANES = ["marquee", "drift", "more", "videos"];

  function listArray(pane){
    if(pane === "videos") return draft.videos;
    return draft.projects[pane];
  }

  function thumbFor(pane, value){
    if(pane === "videos") return `https://img.youtube.com/vi/${value}/hqdefault.jpg`;
    return value;
  }

  function labelFor(pane, value){
    if(pane === "videos") return value;
    try{ return decodeURIComponent(value.split("/").pop()); }catch(e){ return value; }
  }

  function renderList(pane){
    const container = document.getElementById(pane + "List");
    if(!container) return;
    const arr = listArray(pane);
    container.innerHTML = "";
    if(!arr.length){
      container.innerHTML = '<p class="admin-list__empty">No items yet. Add one above.</p>';
      return;
    }
    arr.forEach((value, i)=>{
      const row = document.createElement("div");
      row.className = "admin-list__row";
      row.innerHTML = `
        <img class="admin-list__thumb" src="${thumbFor(pane, value)}" alt="">
        <span class="admin-list__label">${labelFor(pane, value)}</span>
        <div class="admin-list__actions">
          <button type="button" class="admin-list__btn" data-act="up" title="Move up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
          <button type="button" class="admin-list__btn" data-act="down" title="Move down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          </button>
          <button type="button" class="admin-list__btn admin-list__btn--danger" data-act="del" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`;
      row.querySelector('[data-act="up"]').addEventListener("click", ()=>{
        if(i === 0) return;
        [arr[i-1], arr[i]] = [arr[i], arr[i-1]];
        renderList(pane);
      });
      row.querySelector('[data-act="down"]').addEventListener("click", ()=>{
        if(i === arr.length - 1) return;
        [arr[i+1], arr[i]] = [arr[i], arr[i+1]];
        renderList(pane);
      });
      row.querySelector('[data-act="del"]').addEventListener("click", async ()=>{
        const ok = await window.showConfirm("Delete this item? This can't be undone once you save.");
        if(!ok) return;
        arr.splice(i, 1);
        renderList(pane);
      });
      container.appendChild(row);
    });
  }

  function setupAddButtons(){
    LIST_PANES.forEach(pane=>{
      const btn = document.querySelector(`[data-add="${pane}"]`);
      const input = document.getElementById(pane + "AddInput");
      if(!btn || !input) return;
      btn.addEventListener("click", ()=>{
        const raw = input.value.trim();
        if(!raw) return;
        let value;
        if(pane === "videos"){
          value = window.extractYouTubeId ? window.extractYouTubeId(raw) : raw;
          if(!value){ window.showToast && window.showToast("Couldn't read a YouTube ID from that link.", true); return; }
        } else {
          value = window.normalizeGithubUrl ? window.normalizeGithubUrl(raw) : raw;
        }
        listArray(pane).push(value);
        input.value = "";
        renderList(pane);
      });
    });
  }

  function setupSaveButtons(){
    LIST_PANES.forEach(pane=>{
      const btn = document.querySelector(`[data-save="${pane}"]`);
      if(!btn) return;
      btn.addEventListener("click", async ()=>{
        try{ await persist(draft, "Saved! Live in a few seconds."); }catch(e){}
      });
    });

    const socialBtn = document.querySelector('[data-save="social"]');
    if(socialBtn){
      socialBtn.addEventListener("click", async ()=>{
        draft.social.whatsappNumber = document.getElementById("waNumberInput").value.trim();
        draft.social.telegramUsername = document.getElementById("tgUsernameInput").value.trim().replace(/^@/, "");
        draft.social.facebookUrl = document.getElementById("fbUrlInput").value.trim();

        const footerLogoRaw = document.getElementById("footerLogoInput").value.trim();
        const faviconRaw = document.getElementById("faviconInput").value.trim();
        draft.meta.footerLogo = footerLogoRaw ? (window.normalizeGithubUrl ? window.normalizeGithubUrl(footerLogoRaw) : footerLogoRaw) : cfg.DEFAULT_FOOTER_LOGO;
        draft.meta.favicon = faviconRaw ? (window.normalizeGithubUrl ? window.normalizeGithubUrl(faviconRaw) : faviconRaw) : cfg.DEFAULT_FAVICON;

        try{ await persist(draft, "Saved! Live in a few seconds."); }catch(e){}
      });
    }

    document.querySelectorAll("[data-reset]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const which = btn.dataset.reset;
        if(which === "footerLogo") document.getElementById("footerLogoInput").value = cfg.DEFAULT_FOOTER_LOGO || "";
        if(which === "favicon") document.getElementById("faviconInput").value = cfg.DEFAULT_FAVICON || "";
      });
    });
  }

  function fillSocialInputs(){
    const s = draft.social || {};
    const m = draft.meta || {};
    document.getElementById("waNumberInput").value = s.whatsappNumber || "";
    document.getElementById("tgUsernameInput").value = s.telegramUsername || "";
    document.getElementById("fbUrlInput").value = s.facebookUrl || "";
    document.getElementById("footerLogoInput").value = (m.footerLogo && m.footerLogo !== cfg.DEFAULT_FOOTER_LOGO) ? m.footerLogo : "";
    document.getElementById("faviconInput").value = (m.favicon && m.favicon !== cfg.DEFAULT_FAVICON) ? m.favicon : "";
  }

  function renderAllPanes(){
    LIST_PANES.forEach(renderList);
    fillSocialInputs();
  }

  /* ============================================================
     TABS
     ============================================================ */
  function setupTabs(){
    document.querySelectorAll(".admin-tab").forEach(tab=>{
      tab.addEventListener("click", ()=>{
        document.querySelectorAll(".admin-tab").forEach(t=> t.classList.remove("is-active"));
        document.querySelectorAll(".admin-pane").forEach(p=> p.classList.remove("is-active"));
        tab.classList.add("is-active");
        const pane = document.querySelector(`.admin-pane[data-pane="${tab.dataset.tab}"]`);
        if(pane) pane.classList.add("is-active");
        setStatus("");
      });
    });
  }

  /* ============================================================
     TOKEN PANE
     ============================================================ */
  function setupToken(){
    const input = document.getElementById("githubTokenInput");
    const hint = document.getElementById("tokenSavedHint");
    const saved = getToken();
    if(saved){ input.value = saved; hint.hidden = false; }

    document.getElementById("saveTokenBtn").addEventListener("click", ()=>{
      const val = input.value.trim();
      if(!val){ window.showToast && window.showToast("Paste a token first.", true); return; }
      setToken(val);
      hint.hidden = false;
      window.showToast && window.showToast("Token saved in this browser.");
    });
  }

  /* ============================================================
     LOGIN / SESSION / OVERLAY
     ============================================================ */
  function isSessionActive(){ return sessionStorage.getItem(SESSION_KEY) === "1"; }
  function setSessionActive(){ sessionStorage.setItem(SESSION_KEY, "1"); }
  function clearSession(){ sessionStorage.removeItem(SESSION_KEY); }

  function openOverlay(){
    const overlay = document.getElementById("adminOverlay");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");

    if(isSessionActive()){
      showPanel();
    }else{
      showLoginBox();
    }
  }

  function closeOverlay(){
    const overlay = document.getElementById("adminOverlay");
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function showLoginBox(){
    document.getElementById("adminLoginBox").hidden = false;
    document.getElementById("adminPanel").hidden = true;
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminLoginError").hidden = true;
  }

  function showPanel(){
    document.getElementById("adminLoginBox").hidden = true;
    document.getElementById("adminPanel").hidden = false;
    startDraft();
    renderAllPanes();
    setStatus("");
  }

  function setupLoginForm(){
    document.getElementById("adminLoginForm").addEventListener("submit", async (e)=>{
      e.preventDefault();
      const val = document.getElementById("adminPasswordInput").value;
      const hash = await sha256Hex(val);
      if(hash === PASSWORD_HASH){
        setSessionActive();
        showPanel();
      }else{
        document.getElementById("adminLoginError").hidden = false;
      }
    });
  }

  function setupOpenClose(){
    const logo = document.getElementById("footerLogoImg");
    if(logo){
      logo.style.cursor = "pointer";
      logo.addEventListener("dblclick", openOverlay);
    }
    document.querySelectorAll("[data-admin-close]").forEach(btn=>{
      btn.addEventListener("click", closeOverlay);
    });
    document.getElementById("adminOverlay").addEventListener("click", (e)=>{
      if(e.target.id === "adminOverlay") closeOverlay();
    });
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Escape" && document.getElementById("adminOverlay").classList.contains("is-open")){
        closeOverlay();
      }
    });
    document.getElementById("adminLogoutBtn").addEventListener("click", ()=>{
      clearSession();
      showLoginBox();
      window.showToast && window.showToast("Logged out.");
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    setupTabs();
    setupToken();
    setupAddButtons();
    setupSaveButtons();
    setupLoginForm();
    setupOpenClose();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }

})();
