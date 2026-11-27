/* Kit de escenas reutilizable (cámara, placas de interfaz real, cursor, textos, gráficas). Todo determinista. */
Object.assign(window.QX, {
  $: (s, r = document) => r.querySelector(s),
  /** Placa de captura real. o: {id,src,w,ratio,h,x,y,radius}. h por defecto = w*ratio. */
  plate(parent, o) {
    const h = o.h ?? Math.round(o.w * o.ratio);
    const el = document.createElement("div"); el.className = "plate"; el.id = o.id;
    Object.assign(el.style, { left: o.x + "px", top: o.y + "px", width: o.w + "px", height: h + "px", borderRadius: (o.radius ?? 18) + "px" });
    el.innerHTML = `<div class="pin" style="width:${o.w}px"><img src="${o.src}" style="width:${o.w}px"></div>`;
    el._o = { ...o, h }; parent.appendChild(el); return el;
  },
  /** Punto (fx,fy en fracciones de la imagen) de una placa, en coordenadas de la cámara. */
  pt(id, fx, fy, pan = 0) { const o = document.getElementById(id)._o; return { x: o.x + fx * o.w, y: o.y + fy * o.w * o.ratio + pan }; },
  /** Mueve la cámara (contenedor .cam) para centrar un punto con zoom z. */
  cam(tl, id, t, d, p, z, ease = "power3.inOut") { tl.to("#" + id, { x: 960 - p.x * z, y: 540 - p.y * z, scale: z, duration: d, ease }, t); },
  camSet(id, p, z) { gsap.set("#" + id, { x: 960 - p.x * z, y: 540 - p.y * z, scale: z }); },
  /** Desplaza el contenido de una placa alta (scroll de página). y en px de imagen mostrada. */
  pan(tl, id, t, d, y, ease = "power2.inOut", x = 0) { tl.to(document.getElementById(id).querySelector(".pin"), { y: -y, x: -x, duration: d, ease }, t); },
  /** Cursor grande con clic. Devuelve helpers. */
  cursor(parent, id) {
    parent.insertAdjacentHTML("beforeend", `<svg class="cursor" id="${id}" viewBox="0 0 24 24"><path d="M4 2l15 9.6-6.6 1.3 3.8 7-3 1.6-3.8-7.1L4 19z" fill="#fff" stroke="#0b0f17" stroke-width="1.4" stroke-linejoin="round"/></svg><div class="ripple" id="${id}-r"></div>`);
    gsap.set("#" + id, { opacity: 0 });
    return {
      move: (tl, t, d, p, ease = "power2.inOut") => tl.to("#" + id, { x: p.x - 8, y: p.y - 4, opacity: 1, duration: d, ease }, t),
      click: (tl, t, p) => {
        tl.to("#" + id, { scale: 0.86, duration: 0.07, ease: "power2.in" }, t).to("#" + id, { scale: 1, duration: 0.18, ease: "power3.out" }, t + 0.07)
          .fromTo("#" + id + "-r", { x: p.x, y: p.y, scale: 0.3, opacity: 0.95 }, { scale: 1.9, opacity: 0, duration: 0.55, ease: "power2.out" }, t);
      },
    };
  },
  /** Texto en palabras dentro de un contenedor, devuelve spans. */
  say(parent, id, html, css = "") {
    parent.insertAdjacentHTML("beforeend", `<div class="kinetic" id="${id}" style="position:absolute;${css}">${html}</div>`);
    const el = document.getElementById(id); const out = [];
    const walk = (node, cls) => { [...node.childNodes].forEach((n) => { if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((w) => { if (!w.trim()) { frag.appendChild(document.createTextNode(" ")); return; } const s = document.createElement("span"); s.className = "w " + (cls || ""); s.textContent = w; frag.appendChild(s); out.push(s); }); n.replaceWith(frag); } else walk(n, n.className); }); };
    walk(el, ""); return out;
  },
  /** Aparece palabra a palabra con desenfoque (aterriza y se queda inmóvil). */
  sayIn(tl, words, t, step = 0.1, d = 0.2) { gsap.set(words, { opacity: 0, filter: "blur(12px)" }); tl.to(words, { opacity: 1, filter: "blur(0px)", duration: d, ease: "power4.out", stagger: step }, t); },
  sayOut(tl, words, t, d = 0.22) { tl.to(words, { opacity: 0, filter: "blur(12px)", duration: d, ease: "power3.in", stagger: 0.03 }, t); },
  /** Número que rueda. */
  roll(tl, el, t, d, from, to, fmt = (v) => Math.round(v).toLocaleString("es-MX"), ease = "power2.out") {
    const o = { v: from }; el.textContent = fmt(from);
    tl.to(o, { v: to, duration: d, ease, onUpdate: () => (el.textContent = fmt(o.v)) }, t);
  },
  /** Cuadrícula de puntos (calendario). */
  dots(parent, id, cols, rows, gap, r, x0, y0) {
    let h = `<div id="${id}" style="position:absolute;left:0;top:0">`;
    for (let i = 0; i < cols * rows; i++) { const cx = x0 + (i % cols) * gap, cy = y0 + Math.floor(i / cols) * gap; h += `<div class="dot" data-i="${i}" style="position:absolute;left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:#4a7de8;"></div>`; }
    parent.insertAdjacentHTML("beforeend", h + "</div>"); return [...document.getElementById(id).querySelectorAll(".dot")];
  },
  /** Sube la barra de subtítulo (SRT en vivo no: los subtítulos se queman desde subs.js). */
  burnSubs(tl, parent, subs) {
    parent.insertAdjacentHTML("beforeend", `<div class="sub" id="subs"><span id="sub-t"></span></div>`);
    subs.forEach((s) => { tl.set("#sub-t", { textContent: s.text, opacity: 1 }, s.start); tl.set("#sub-t", { opacity: 0 }, s.end); });
    gsap.set("#sub-t", { opacity: 0 });
  },
});

Object.assign(window.QX, {
  /** Anillo de resalte sobre una región (fracciones de la imagen) de una placa, dentro de la cámara. */
  ring(cam, id, plateId, r, pan = 0, css = "") {
    const a = QX.pt(plateId, r[0], r[1], pan), b = QX.pt(plateId, r[2], r[3], pan);
    cam.insertAdjacentHTML("beforeend", `<div id="${id}" style="position:absolute;left:${a.x}px;top:${a.y}px;width:${b.x - a.x}px;height:${b.y - a.y}px;border-radius:18px;border:4px solid #8db2ff;box-shadow:0 0 50px rgba(100,150,255,.85);opacity:0;pointer-events:none;${css}"></div>`);
    return id;
  },
  glow(tl, id, t0, t1) { tl.fromTo("#" + id, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }, t0).to("#" + id, { opacity: 0, duration: 0.3 }, t1); },
  /** Rótulo superior (los subtítulos ocupan la parte baja). */
  topBanner(tl, sc, id, html, t0, t1) {
    sc.insertAdjacentHTML("beforeend", `<div class="banner" id="${id}" style="top:34px"><div class="b-in" style="font-size:54px;padding:16px 46px">${html}</div></div>`);
    gsap.set("#" + id, { opacity: 0, y: -22, filter: "blur(10px)" });
    tl.to("#" + id, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power4.out" }, t0).to("#" + id, { opacity: 0, y: -10, filter: "blur(8px)", duration: 0.25, ease: "power3.in" }, t1);
  },
});
