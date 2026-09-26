/* Opens a sealed invitation (see tools/publish.mjs). The page's words travel encrypted (AES-GCM) and the key only in
   the link, after #k=, which browsers never send to the server. With the right link, the invitation is decrypted in
   the phone and the usual script takes over; without it, the doors stay closed. */
(() => {
  'use strict';
  const root = document.documentElement;
  const sealed = document.getElementById('sealed');
  const fail = () => { window.INVITE_BOOTED = true; root.classList.add('sealed-fail'); };
  const m = /(?:^#|&)k=([A-Za-z0-9_-]{22})(?:&|$)/.exec(location.hash);
  if (!sealed || !m || !window.crypto || !crypto.subtle || !window.TextDecoder) { fail(); return; }
  const bytes = (s) => {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    s += '='.repeat((4 - (s.length % 4)) % 4);
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  };
  let raw;
  try { raw = bytes(sealed.textContent.trim()); } catch (e) { fail(); return; }
  crypto.subtle.importKey('raw', bytes(m[1]), 'AES-GCM', false, ['decrypt'])
    .then((key) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12)))
    .then((buf) => {
      const d = JSON.parse(new TextDecoder().decode(buf));
      document.title = d.title;
      document.getElementById('invite').outerHTML = d.main;
      window.INVITE_CONFIG = d.config;
      const s = document.createElement('script');
      s.src = sealed.dataset.app;
      document.body.appendChild(s);
    })
    .catch(fail);
})();
