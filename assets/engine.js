/* ══════════════════════════════════════════════════════════════════════
   BURN1NG ENGINE — ส่วนกลางที่ทุกโปรเจกต์ในเว็บใช้ร่วมกัน
   burn1ngsphere.com

   มีแต่ของที่ไม่ผูกกับเนื้อหา  การวาดการ์ดและรูปแบบข้อมูลเป็นเรื่องของแต่ละหน้า
     · ช่องกรอกตัวแปร แล้วเติมค่าลงในข้อความอัตโนมัติ
     · คัดลอกไปคลิปบอร์ด พร้อมทางสำรองสำหรับเบราว์เซอร์เก่า
     · โหลดไฟล์ข้อมูล JSON พร้อมจัดการตอนโหลดไม่สำเร็จ

   โค้ดชุดนี้ยกมาจาก CommandRun ที่ใช้งานจริงมาแล้ว ไม่ได้เขียนใหม่
   พฤติกรรมจึงเหมือนเดิมทุกอย่าง
   ══════════════════════════════════════════════════════════════════════ */
(function (w, d) {
  'use strict';

  var CX = {
    vars: {},
    KEYS: [],
    LABELS: {},
    DEMO: {},
    _store: 'burn_vars',
    _onchange: null
  };

  /* ── ข้อความ ───────────────────────────────────────────────────────── */

  CX.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* <ตัวยึด> แบบปลอดภัยสำหรับแสดงผล และแบบดิบสำหรับคัดลอก */
  CX.slot = function (k) { return '&lt;' + k.toLowerCase() + '&gt;'; };
  CX.slotRaw = function (k) { return '<' + k.toLowerCase() + '>'; };

  /* แปลง {IP} ในข้อความเป็นค่าที่ผู้ใช้กรอก  ถ้ายังไม่กรอกจะได้ตัวยึดที่กดได้
     ตัวแปรที่ไม่ได้ประกาศไว้ถือว่าให้เติมเอง ไม่ใช่ความผิดพลาด */
  CX.paint = function (t) {
    return CX.esc(t).replace(/\{([A-Z][A-Z0-9_]*)\}/g, function (m, k) {
      if (CX.KEYS.indexOf(k) > -1) {
        return CX.vars[k]
          ? '<i class="tok on">' + CX.esc(CX.vars[k]) + '</i>'
          : '<i class="tok off" data-k="' + k + '" title="กดเพื่อกรอกค่า ' + k + '">' + CX.slot(k) + '</i>';
      }
      return '<i class="tok manual" title="เติมเอง">' + CX.slot(k) + '</i>';
    });
  };

  /* ฉบับข้อความล้วน ใช้ตอนคัดลอก */
  CX.plain = function (t) {
    return t.replace(/\{([A-Z][A-Z0-9_]*)\}/g, function (m, k) {
      return (CX.KEYS.indexOf(k) > -1 && CX.vars[k]) ? CX.vars[k] : CX.slotRaw(k);
    });
  };

  /* ── ตัวแปรที่ผู้ใช้กรอก ────────────────────────────────────────────── */

  CX.initVars = function (o) {
    CX.KEYS = o.keys || [];
    CX.LABELS = o.labels || {};
    CX.DEMO = o.demo || {};
    if (o.store) CX._store = o.store;
    CX._onchange = o.onchange || null;
    try {
      var s = localStorage.getItem(CX._store);
      if (s) CX.vars = JSON.parse(s);
    } catch (e) { /* โหมดส่วนตัว หรือปิดที่เก็บไว้ ใช้งานต่อได้โดยไม่จำค่า */ }
  };

  CX.keep = function () {
    try { localStorage.setItem(CX._store, JSON.stringify(CX.vars)); } catch (e) {}
  };

  CX.setVar = function (k, v) {
    v = String(v).trim();
    if (v) CX.vars[k] = v; else delete CX.vars[k];
    CX.keep();
    if (CX._onchange) CX._onchange(k, v);
  };

  CX.wipeVars = function () { CX.vars = {}; CX.keep(); };
  CX.demoVars = function () {
    CX.vars = {};
    for (var k in CX.DEMO) if (Object.prototype.hasOwnProperty.call(CX.DEMO, k)) CX.vars[k] = CX.DEMO[k];
    CX.keep();
  };
  CX.filled = function () {
    var n = 0;
    for (var i = 0; i < CX.KEYS.length; i++) if (CX.vars[CX.KEYS[i]]) n++;
    return n;
  };

  /* วาดช่องกรอกทั้งชุด  ผูก event ด้วย addEventListener ไม่ใช่ oninline
     จะได้ไม่ต้องพึ่ง global และหน้าที่มี CSP เข้มก็ใช้ได้ */
  CX.buildFields = function (elId) {
    var box = d.getElementById(elId);
    if (!box) return;
    box.innerHTML = CX.KEYS.map(function (k) {
      return '<div class="field' + (CX.vars[k] ? ' lit' : '') + '" id="f_' + k + '">' +
        '<label for="v_' + k + '">' + CX.esc(CX.LABELS[k] || k) + '</label>' +
        '<input id="v_' + k + '" type="text" spellcheck="false" autocomplete="off" ' +
        'placeholder="' + CX.esc(CX.slotRaw(k)) + '" value="' + (CX.vars[k] ? CX.esc(CX.vars[k]) : '') + '"' +
        ' data-var="' + k + '"></div>';
    }).join('');
    box.addEventListener('input', function (ev) {
      var k = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-var');
      if (!k) return;
      CX.setVar(k, ev.target.value);
      var f = d.getElementById('f_' + k);
      if (f) f.classList.toggle('lit', !!CX.vars[k]);
    }, false);
  };

  /* ── คัดลอก ─────────────────────────────────────────────────────────── */

  CX.copy = function (txt) {
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(txt).catch(function () { CX._copyOld(txt); });
    } else {
      CX._copyOld(txt);
    }
  };
  CX._copyOld = function (txt) {
    var a = d.createElement('textarea');
    a.value = txt;
    a.style.position = 'fixed';
    a.style.opacity = '0';
    d.body.appendChild(a);
    a.select();
    try { d.execCommand('copy'); } catch (e) {}
    d.body.removeChild(a);
  };

  /* ── โหลดไฟล์ข้อมูล ─────────────────────────────────────────────────
     ถ้าโหลดไม่ได้ต้องบอกผู้ใช้ให้รู้เรื่อง ไม่ใช่ปล่อยหน้าว่างเปล่า      */

  CX.load = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  };

  CX.loadInto = function (url, elId, onOk) {
    var box = d.getElementById(elId);
    CX.load(url).then(onOk).catch(function (err) {
      if (box) {
        box.innerHTML =
          '<div class="cx-loadfail" role="alert">' +
          '<strong>โหลดข้อมูลไม่สำเร็จ</strong>' +
          '<p>ลองรีเฟรชหน้านี้อีกครั้ง ถ้ายังไม่ได้แปลว่าไฟล์ข้อมูลหายไปหรือเน็ตมีปัญหา</p>' +
          '<p class="cx-loadfail-why">' + CX.esc(url + ' — ' + err.message) + '</p>' +
          '</div>';
      }
      if (w.console && w.console.error) w.console.error('โหลด ' + url + ' ไม่สำเร็จ', err);
    });
  };

  w.CX = CX;
})(window, document);

/* ══════════════════════════════════════════════════════════════════════
   ลูกเล่นหน้าเว็บ — ส่วนที่ต้องใช้ JS จริงๆ เท่านั้น
   ทุกตัวเช็ค prefers-reduced-motion ก่อนเสมอ และไม่มีตัวไหนที่ถ้าพังแล้ว
   ทำให้เนื้อหาหายไป
   ══════════════════════════════════════════════════════════════════════ */
(function (w, d) {
  'use strict';
  var CX = w.CX || (w.CX = {});
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* บอก CSS ว่า JS ทำงานอยู่  ของที่ซ่อนไว้รอ reveal จะได้ไม่หายถาวรถ้า JS พัง */
  d.documentElement.classList.add('cx-js');

  /* ── โผล่ขึ้นมาตอนเลื่อนถึง ── */
  CX.reveal = function (sel) {
    var els = d.querySelectorAll(sel || '.cx-reveal');
    if (!els.length) return;
    if (reduce || !w.IntersectionObserver) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('cx-in');
      return;
    }
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        r.target.classList.add('cx-in');
        io.unobserve(r.target);          /* โผล่แล้วเลิกเฝ้า ไม่ให้เปลืองแรงเครื่อง */
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    for (var j = 0; j < els.length; j++) {
      els[j].style.setProperty('--cx-d', (j % 6) * 55 + 'ms');   /* ไล่กันทีละใบ */
      io.observe(els[j]);
    }
  };

  /* ── แสงตามเมาส์ ──
     ดักที่ document ชั้นเดียว ไม่ผูก listener ทีละใบ จะได้ไม่หน่วงตอนมีการ์ดเป็นร้อย
     ข้ามเครื่องที่ใช้นิ้ว เพราะไม่มีเมาส์ให้ตาม */
  CX.lamp = function () {
    if (reduce) return;
    if (!(w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    var tick = false, lastEv = null;
    d.addEventListener('pointermove', function (e) {
      lastEv = e;
      if (tick) return;
      tick = true;
      w.requestAnimationFrame(function () {
        tick = false;
        var el = lastEv.target && lastEv.target.closest ? lastEv.target.closest('.cx-lamp') : null;
        if (!el) return;
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (lastEv.clientX - r.left) + 'px');
        el.style.setProperty('--my', (lastEv.clientY - r.top) + 'px');
      });
    }, { passive: true });
  };

  /* ── ตัวอักษรไล่สุ่มก่อนลงตัว ──
     เล่นครั้งเดียวตอนโหลด  ถ้าเล่นวนจะกวนสายตาและอ่านยาก */
  var GLYPH = '01<>[]{}/\\|=+*#$%&_-~^アカサタナハマヤラABCDEF';
  CX.scramble = function (sel, ms) {
    if (reduce) return;
    var els = d.querySelectorAll(sel || '.cx-scramble');
    for (var i = 0; i < els.length; i++) (function (el) {
      var real = el.textContent, len = real.length, step = 0;
      var total = Math.max(14, Math.min(34, len * 2));
      var t = setInterval(function () {
        step++;
        var shown = Math.floor(len * (step / total));
        var out = real.slice(0, shown);
        for (var k = shown; k < len; k++) {
          out += real[k] === ' ' ? ' ' : GLYPH[(Math.random() * GLYPH.length) | 0];
        }
        el.textContent = out;
        if (step >= total) { clearInterval(t); el.textContent = real; }
      }, (ms || 700) / total);
    })(els[i]);
  };

  /* ── เปิดลูกเล่นทั้งหมดด้วยคำสั่งเดียว ── */
  CX.fx = function () {
    CX.reveal();
    CX.lamp();
    CX.scramble();
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', CX.fx);
  else CX.fx();
})(window, document);
