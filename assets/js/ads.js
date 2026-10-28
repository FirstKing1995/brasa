/* =====================================================================
   BRASA · ads.js
   Desenha os anúncios do curso em 1080x1920 (Stories/Reels) com toda a
   informação dentro do quadrado central 1080x1080 (y 420 a 1500), para o
   mesmo arquivo servir no feed com recorte 1:1. Fora do quadrado só há
   textura, brilho e o sigilo do curso. Também monta o .zip para baixar
   (JPG + textos.csv + LEIA-ME), sem bibliotecas.
   Expõe B.ads.
   ===================================================================== */
(function (w, d) {
  'use strict';
  var B = w.B;

  var W = 1080, H = 1920, SAFE = { x: 0, y: 420, w: 1080, h: 1080 }, PAD = 84;
  var C = { bone: '#f0e6d2', dust: '#bba98c', ash: '#84725c', rust: '#e57650', ink: '#1a1206' };
  var F = {
    display: '"Bebas Neue", "Arial Narrow", Impact, sans-serif',
    tag: '"Sedgwick Ave Display", "Bebas Neue", cursive',
    hud: '"Chakra Petch", "Arial Narrow", sans-serif',
    body: 'Barlow, "Segoe UI", sans-serif'
  };

  /* ---------- fontes e imagens ---------- */
  var fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    var probe = 'ÁÉÍÓÚÃÕÇáéíóúãõç R$ 0123456789';
    fontsReady = !d.fonts || !d.fonts.load ? Promise.resolve() : Promise.all([
      '120px "Bebas Neue"', '60px "Sedgwick Ave Display"', '700 40px "Chakra Petch"', '600 40px "Chakra Petch"',
      '500 40px Barlow', '600 40px Barlow', '700 40px Barlow'
    ].map(function (f) { return d.fonts.load(f, probe).catch(function () {}); })).then(function () { return d.fonts.ready; });
    return fontsReady;
  }
  function loadImg(src, cors) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image();
      if (cors) im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  var sigilCache = {};
  function sigilImg(seed, color, mode) {
    var k = seed + '|' + color + '|' + (mode || '');
    if (sigilCache[k]) return sigilCache[k];
    var svg = B.sigil(seed, '', mode)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" color="' + color + '" ')
      .replace(/(<svg[^>]*>)/, '$1<style>*{fill:none;stroke:' + color + ';stroke-width:2.8;stroke-linecap:square}.sg-ring{stroke-width:1;opacity:.45}.sg-arc{stroke-width:2;opacity:.75}.sg-tick{stroke-width:1.3;opacity:.55}.sg-dot{fill:' + color + ';stroke:none}</style>');
    return (sigilCache[k] = loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)));
  }
  var noiseCanvas = null;
  function noise() {
    if (noiseCanvas) return noiseCanvas;
    var c = d.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), img = x.createImageData(256, 256), r = B.rng(77);
    for (var i = 0; i < img.data.length; i += 4) { var v = 150 + r() * 105; img.data[i] = v; img.data[i + 1] = v * 0.86; img.data[i + 2] = v * 0.62; img.data[i + 3] = r() * 34; }
    x.putImageData(img, 0, 0);
    return (noiseCanvas = c);
  }

  /* ---------- texto ---------- */
  function font(ctx, f, size, weight, spacing) {
    ctx.font = (weight ? weight + ' ' : '') + size + 'px ' + f;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spacing || 0) + 'px';
  }
  function wrap(ctx, text, maxW) {
    var words = String(text || '').split(/\s+/).filter(Boolean), out = [], line = '';
    words.forEach(function (wd) {
      var t = line ? line + ' ' + wd : wd;
      if (ctx.measureText(t).width <= maxW || !line) line = t;
      else { out.push(line); line = wd; }
    });
    if (line) out.push(line);
    return out;
  }
  // evita palavra sozinha na última linha estreitando a caixa até equilibrar
  function balance(ctx, text, maxW) {
    var ls = wrap(ctx, text, maxW);
    if (ls.length < 2) return ls;
    for (var k = 0.96; k >= 0.6; k -= 0.04) {
      var last = ls[ls.length - 1];
      if (last.split(' ').length > 1 && ctx.measureText(last).width > maxW * 0.3) break;
      var t = wrap(ctx, text, maxW * k);
      if (t.length > ls.length) break;
      ls = t;
    }
    return ls;
  }
  function clampLines(ctx, lines, max, maxW) {
    if (lines.length <= max) return lines;
    var keep = lines.slice(0, max), last = keep[max - 1] + '…';
    while (ctx.measureText(last).width > maxW && last.length > 2) last = last.slice(0, -2).replace(/\s+\S*$/, '') + '…';
    keep[max - 1] = last;
    return keep;
  }
  // maior tamanho que cabe em maxW x maxH sem passar de maxLines
  function fit(ctx, text, f, weight, maxW, maxH, big, small, lh, maxLines, spacing) {
    for (var s = big; s >= small; s -= 4) {
      font(ctx, f, s, weight, spacing);
      var ls = balance(ctx, text, maxW);
      if (ls.length <= maxLines && ls.length * s * lh <= maxH) return { size: s, lines: ls, lh: lh };
    }
    font(ctx, f, small, weight, spacing);
    return { size: small, lines: clampLines(ctx, wrap(ctx, text, maxW), maxLines, maxW), lh: lh };
  }
  function money(v) { return B.fmt.money(v); }
  function upper(s) { return String(s || '').toLocaleUpperCase('pt-BR'); }

  /* ---------- fundo (pode ocupar a tela toda: não tem informação) ---------- */
  function background(ctx, cx, art) {
    var pal = cx.pal, r = B.rng(B.hash('ad:' + cx.course.id + ':' + cx.ad.angle));
    ctx.fillStyle = pal.b2; ctx.fillRect(0, 0, W, H);
    if (art.photo) {
      var im = art.photo, s = Math.max(W / im.width, H / im.height), iw = im.width * s, ih = im.height * s;
      ctx.save(); ctx.globalAlpha = 0.34; ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih); ctx.restore();
    }
    var g = ctx.createRadialGradient(W / 2, 960, 40, W / 2, 960, 980);
    g.addColorStop(0, hexA(pal.b1, 0.95)); g.addColorStop(0.55, hexA(pal.b1, 0.45)); g.addColorStop(1, hexA(pal.b2, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sigilo gigante do curso, atravessando o quadro
    if (art.sigil) {
      ctx.save(); ctx.globalAlpha = 0.11; ctx.translate(W / 2 + (r() - 0.5) * 160, 960); ctx.rotate((r() - 0.5) * 0.5);
      ctx.drawImage(art.sigil, -800, -800, 1600, 1600); ctx.restore();
    }
    // brasas subindo
    for (var i = 0; i < 90; i++) {
      var y = r() * H, x = r() * W, rad = 1.5 + r() * r() * 7, a = 0.15 + r() * 0.55;
      if (y > SAFE.y + 60 && y < SAFE.y + SAFE.h - 60 && x > PAD && x < W - PAD) a *= 0.35; // menos ruído atrás do texto
      var eg = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
      eg.addColorStop(0, hexA(pal.a, a)); eg.addColorStop(1, hexA(pal.a, 0));
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(x, y, rad * 4, 0, Math.PI * 2); ctx.fill();
    }
    // escurece as pontas e o miolo para o texto respirar
    var v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, hexA(pal.b2, 0.85)); v.addColorStop(0.2, hexA(pal.b2, 0.1)); v.addColorStop(0.8, hexA(pal.b2, 0.1)); v.addColorStop(1, hexA(pal.b2, 0.9));
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hexA(pal.b2, 0.38); ctx.fillRect(0, SAFE.y, W, SAFE.h);
    ctx.save(); ctx.fillStyle = ctx.createPattern(noise(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
    // moldura HUD marcando o quadrado (decorativa)
    ctx.save(); ctx.strokeStyle = hexA(pal.a, 0.5); ctx.lineWidth = 3;
    [[36, SAFE.y + 36, 1, 1], [W - 36, SAFE.y + 36, -1, 1], [36, SAFE.y + SAFE.h - 36, 1, -1], [W - 36, SAFE.y + SAFE.h - 36, -1, -1]].forEach(function (p) {
      ctx.beginPath(); ctx.moveTo(p[0], p[1] + 44 * p[3]); ctx.lineTo(p[0], p[1]); ctx.lineTo(p[0] + 44 * p[2], p[1]); ctx.stroke();
    });
    ctx.restore();
  }
  function hexA(hex, a) {
    var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- blocos de conteúdo (todos dentro do quadrado) ---------- */
  var X0 = PAD, CW = W - PAD * 2;
  function chamfer(ctx, x, y, w2, h2, cut) {
    ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w2, y); ctx.lineTo(x + w2, y + h2 - cut); ctx.lineTo(x + w2 - cut, y + h2); ctx.lineTo(x, y + h2); ctx.lineTo(x, y + cut); ctx.closePath();
  }
  function header(ctx, cx, art) {
    var y = SAFE.y + 70;
    if (art.brand) ctx.drawImage(art.brand, X0 - 6, y - 6, 60, 60);
    font(ctx, F.hud, 30, 700, 6); ctx.fillStyle = C.bone; ctx.textBaseline = 'middle';
    ctx.fillText(upper(cx.brand), X0 + 66, y + 24);
    if (cx.ad.kicker && cx.ad.layout !== 'statement' && cx.ad.layout !== 'pain') {
      font(ctx, F.hud, 24, 600, 4);
      var t = upper(cx.ad.kicker), tw = ctx.measureText(t).width + 40;
      ctx.strokeStyle = hexA(cx.pal.a, 0.7); ctx.lineWidth = 2; chamfer(ctx, W - PAD - tw, y + 2, tw, 46, 10); ctx.stroke();
      ctx.fillStyle = cx.pal.a; ctx.fillText(t, W - PAD - tw + 20, y + 26);
    }
    ctx.textBaseline = 'alphabetic';
  }
  function footer(ctx, cx) {
    var label = upper(cx.ad.cta || 'Quero entrar'), h2 = 108, y = SAFE.y + SAFE.h - 70 - h2;
    font(ctx, F.hud, 40, 700, 5);
    var tw = ctx.measureText(label).width, bw = Math.min(CW, tw + 72 + 70);
    ctx.save(); ctx.shadowColor = hexA(cx.pal.a, 0.55); ctx.shadowBlur = 50;
    ctx.fillStyle = cx.pal.a; chamfer(ctx, X0, y, bw, h2, 18); ctx.fill(); ctx.restore();
    ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.fillText(label, X0 + 40, y + h2 / 2 + 2);
    // seta
    var ax = X0 + 40 + tw + 26, ay = y + h2 / 2;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 36, ay); ctx.moveTo(ax + 22, ay - 14); ctx.lineTo(ax + 36, ay); ctx.lineTo(ax + 22, ay + 14); ctx.stroke();
    // selo de risco ao lado do botão
    var seal = cx.free ? 'GRÁTIS' : (cx.course.guarantee_days ? cx.course.guarantee_days + ' DIAS DE GARANTIA' : '');
    if (seal && bw + 40 < CW - 160) {
      font(ctx, F.hud, 27, 600, 3); ctx.fillStyle = C.dust;
      var sl = wrap(ctx, seal, CW - bw - 40);
      sl.slice(0, 2).forEach(function (ln, i) { ctx.fillText(ln, X0 + bw + 36, ay + (i - (Math.min(sl.length, 2) - 1) / 2) * 34); });
    }
    ctx.textBaseline = 'alphabetic';
    return y;
  }

  // cada bloco devolve {h, draw(y)} para empilhar e centralizar
  function bKicker(ctx, cx) {
    if (!cx.ad.kicker) return null;
    return { h: 84, draw: function (y) {
      ctx.save(); ctx.translate(X0, y + 56); ctx.rotate(-0.045); font(ctx, F.tag, 58, '', 0); ctx.fillStyle = cx.pal.a; ctx.fillText(cx.ad.kicker, 0, 0); ctx.restore();
    } };
  }
  function bHook(ctx, cx, o) {
    o = o || {};
    var t = upper(cx.ad.hook), maxH = o.maxH || 420, f = fit(ctx, t, F.display, '', o.indent ? CW - 40 : CW, maxH, o.big || 168, o.small || 72, 0.94, o.lines || 5, 1);
    var h = f.lines.length * f.size * f.lh;
    return { h: h + 10, fit: f, draw: function (y) {
      font(ctx, F.display, f.size, '', 1);
      var x = X0 + (o.indent ? 40 : 0);
      if (o.indent) { ctx.fillStyle = C.rust; ctx.fillRect(X0, y + 8, 10, h - 12); }
      f.lines.forEach(function (ln, i) {
        ctx.fillStyle = o.accentLast && i === f.lines.length - 1 && f.lines.length > 1 ? cx.pal.a : C.bone;
        ctx.fillText(ln, x, y + (i + 1) * f.size * f.lh - f.size * 0.12);
      });
    } };
  }
  function bText(ctx, text, opt) {
    if (!text) return null;
    font(ctx, F.body, opt.size || 36, opt.weight || 500, 0);
    var ls = clampLines(ctx, wrap(ctx, text, opt.w || CW), opt.max || 3, opt.w || CW), lh = (opt.size || 36) * 1.34;
    return { h: ls.length * lh, draw: function (y) {
      font(ctx, F.body, opt.size || 36, opt.weight || 500, 0); ctx.fillStyle = opt.color || C.dust;
      ls.forEach(function (ln, i) { ctx.fillText(ln, opt.x || X0, y + (i + 1) * lh - lh * 0.28); });
    } };
  }
  function bBullets(ctx, cx, items, mark, color, strike, maxL) {
    items = (items || []).filter(Boolean); if (!items.length) return null;
    font(ctx, F.body, 46, 600, 0);
    var rows = items.map(function (t) { return clampLines(ctx, wrap(ctx, t, CW - 74), maxL || 2, CW - 74); }), lh = 58, gap = 24;
    var h = rows.reduce(function (s, r) { return s + r.length * lh + gap; }, -gap);
    return { h: h, draw: function (y) {
      rows.forEach(function (r) {
        var cyM = y + 30;
        ctx.save(); ctx.strokeStyle = color || cx.pal.a; ctx.fillStyle = color || cx.pal.a; ctx.lineWidth = 5;
        if (mark === 'x') { ctx.beginPath(); ctx.moveTo(X0 + 6, cyM - 13); ctx.lineTo(X0 + 32, cyM + 13); ctx.moveTo(X0 + 32, cyM - 13); ctx.lineTo(X0 + 6, cyM + 13); ctx.stroke(); }
        else { ctx.translate(X0 + 19, cyM); ctx.rotate(Math.PI / 4); ctx.fillRect(-11, -11, 22, 22); }
        ctx.restore();
        font(ctx, F.body, 46, 600, 0); ctx.fillStyle = strike ? C.ash : C.bone;
        r.forEach(function (ln, i) {
          var ty = y + (i + 1) * lh - 14; ctx.fillText(ln, X0 + 64, ty);
          if (strike) { ctx.fillStyle = hexA('#e57650', 0.8); ctx.fillRect(X0 + 64, ty - 17, ctx.measureText(ln).width, 4); ctx.fillStyle = C.ash; }
        });
        y += r.length * lh + gap;
      });
    } };
  }
  function bLabel(ctx, text, color) {
    return { h: 44, draw: function (y) { font(ctx, F.hud, 28, 700, 6); ctx.fillStyle = color; ctx.fillText(upper(text), X0, y + 32); } };
  }
  function bOffer(ctx, cx) {
    var c = cx.course, free = cx.free, n = Math.max(1, Number(c.max_installments) || 12);
    var anchor = !free && c.anchor_price > c.price ? 'DE ' + money(c.anchor_price) : '';
    var big = free ? 'GRÁTIS' : money(c.price).replace(/,00$/, '');
    var inst = !free && n > 1 ? 'ou ' + n + 'x de ' + money(B.installment(c.price, n, cx.rate)) : (free ? 'Acesso liberado na hora' : 'à vista no Pix');
    return { h: (anchor ? 56 : 0) + 210 + 74, draw: function (y) {
      if (anchor) {
        font(ctx, F.hud, 38, 600, 3); ctx.fillStyle = C.dust; ctx.fillText(anchor, X0, y + 40);
        ctx.fillStyle = C.rust; ctx.fillRect(X0 - 4, y + 25, ctx.measureText(anchor).width + 8, 5); y += 56;
      }
      font(ctx, F.display, 230, '', 2); ctx.save(); ctx.shadowColor = hexA(cx.pal.a, 0.5); ctx.shadowBlur = 60; ctx.fillStyle = cx.pal.a; ctx.fillText(big, X0 - 6, y + 196); ctx.restore();
      font(ctx, F.body, 38, 600, 0); ctx.fillStyle = C.bone; ctx.fillText(inst, X0, y + 270);
    } };
  }
  function bStats(ctx, cx) {
    var st = cx.course.stats || {}, items = [[st.seasons || 0, (st.seasons === 1 ? 'temporada' : 'temporadas')], [st.lessons || 0, (st.lessons === 1 ? 'aula' : 'aulas')], [Math.max(1, Math.round((st.minutes || 0) / 60)) + 'H', 'de conteúdo']];
    var cw = CW / 3;
    return { h: 230, draw: function (y) {
      items.forEach(function (it, i) {
        var x = X0 + i * cw;
        if (i) { ctx.fillStyle = hexA(cx.pal.a, 0.3); ctx.fillRect(x - 2, y + 20, 3, 190); }
        font(ctx, F.display, 170, '', 1); ctx.fillStyle = cx.pal.a; ctx.fillText(String(it[0]), x + (i ? 34 : 0), y + 156);
        font(ctx, F.hud, 28, 600, 4); ctx.fillStyle = C.dust; ctx.fillText(upper(it[1]), x + (i ? 34 : 0), y + 206);
      });
    } };
  }
  function bGuarantee(ctx, cx) {
    var n = String(cx.course.guarantee_days || 7);
    return { h: 330, draw: function (y) {
      var cxp = X0 + 150, cyp = y + 160, R = 148;
      ctx.save(); ctx.strokeStyle = cx.pal.a; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cxp, cyp, R, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.6; ctx.lineWidth = 3;
      for (var i = 0; i < 48; i++) { if (i % 2) continue; var a = i / 48 * Math.PI * 2, L = i % 6 ? 10 : 22; ctx.beginPath(); ctx.moveTo(cxp + Math.cos(a) * (R - 14), cyp + Math.sin(a) * (R - 14)); ctx.lineTo(cxp + Math.cos(a) * (R - 14 - L), cyp + Math.sin(a) * (R - 14 - L)); ctx.stroke(); }
      ctx.restore();
      font(ctx, F.display, 210, '', 0); ctx.fillStyle = cx.pal.a; ctx.textAlign = 'center'; ctx.fillText(n, cxp, cyp + 74); ctx.textAlign = 'left';
      font(ctx, F.display, 112, '', 2); ctx.fillStyle = C.bone; ctx.fillText('DIAS', X0 + 340, y + 150);
      font(ctx, F.hud, 34, 700, 6); ctx.fillStyle = cx.pal.a; ctx.fillText('DE GARANTIA', X0 + 344, y + 204);
    } };
  }
  function bQuote(ctx, cx) {
    var f = fit(ctx, cx.ad.hook, F.body, 600, CW, 400, 54, 34, 1.3, 7, 0);
    return { h: 120 + f.lines.length * f.size * f.lh + 60, draw: function (y) {
      font(ctx, F.display, 260, '', 0); ctx.fillStyle = hexA(cx.pal.a, 0.85); ctx.fillText('“', X0 - 8, y + 200);
      y += 120;
      font(ctx, F.body, f.size, 600, 0); ctx.fillStyle = C.bone;
      f.lines.forEach(function (ln, i) { ctx.fillText(ln, X0, y + (i + 1) * f.size * f.lh - f.size * 0.3); });
      y += f.lines.length * f.size * f.lh + 16;
      if (cx.ad.author) { ctx.fillStyle = cx.pal.a; ctx.fillRect(X0, y + 14, 48, 4); font(ctx, F.hud, 30, 700, 4); ctx.fillText(upper(cx.ad.author), X0 + 68, y + 28); }
    } };
  }

  function layoutBlocks(ctx, cx, room) {
    var a = cx.ad, L = a.layout, sub = function (o) { return bText(ctx, a.sub, Object.assign({ size: 38, max: 3 }, o || {})); };
    switch (L) {
      case 'pain': return [bKicker(ctx, cx), bHook(ctx, cx, { indent: true, big: 132, small: 64, maxH: room - 300, lines: 5 }), sub()];
      case 'list': return [bHook(ctx, cx, { big: 120, small: 64, maxH: 240, lines: 2 }), bBullets(ctx, cx, a.bullets)];
      case 'offer': return [bHook(ctx, cx, { big: 104, small: 60, maxH: 200, lines: 2 }), bOffer(ctx, cx), sub({ size: 32, max: 2 })];
      case 'stats': return [bHook(ctx, cx, { big: 110, small: 60, maxH: 220, lines: 2 }), bStats(ctx, cx), sub({ size: 32, max: 2 })];
      case 'guarantee': return [bGuarantee(ctx, cx), sub({ size: 42, max: 3, color: C.bone })];
      case 'versus': return [bHook(ctx, cx, { big: 96, small: 60, maxH: 110, lines: 1 }), bLabel(ctx, 'Antes', C.rust), bBullets(ctx, cx, a.before, 'x', C.rust, true, 1), bLabel(ctx, 'Depois', cx.pal.a), bBullets(ctx, cx, a.bullets, '', '', false, 1)];
      case 'quote': return [bQuote(ctx, cx)];
      default: return [bKicker(ctx, cx), bHook(ctx, cx, { accentLast: true, big: 176, small: 72, maxH: room - 290, lines: 5 }), sub()];
    }
  }

  /* ---------- desenho de um anúncio ---------- */
  function prepare(course, opts) {
    opts = opts || {};
    var pal = (course.color !== '' && course.color != null && !isNaN(course.color)) ? B.palette(Number(course.color)) : B.palette(course.id || course.title);
    var photo = opts.photo === false ? null : (course.banner || course.poster);
    return Promise.all([loadFonts(), sigilImg(course.id || course.title, pal.a), sigilImg(B.brand.name || 'brasa', pal.a, 'brand'), photo ? loadImg(B.safeUrl(photo), true) : null])
      .then(function (r) { return { pal: pal, sigil: r[1], brand: r[2], photo: r[3] }; });
  }
  function draw(canvas, ad, course, art, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var cx = { ad: ad, course: course, pal: art.pal, brand: opts.brand || B.brand.name || 'BRASA', rate: opts.rate || 0.0299, free: !(Number(course.price) > 0) };
    background(ctx, cx, art);
    header(ctx, cx, art);
    var top = SAFE.y + 170, bottom = footer(ctx, cx) - 44, room = bottom - top;
    var blocks = layoutBlocks(ctx, cx, room).filter(Boolean), gap = 34;
    var sum = blocks.reduce(function (s, b) { return s + b.h; }, 0);
    if (blocks.length > 1 && sum + gap * (blocks.length - 1) > room) gap = Math.max(12, (room - sum) / (blocks.length - 1));
    var total = sum + gap * (blocks.length - 1);
    var y = top + Math.max(0, (room - total) / 2);
    blocks.forEach(function (b) { b.draw(y); y += b.h + gap; });
    if (opts.guides) {
      ctx.save(); ctx.fillStyle = 'rgba(201,89,47,.28)'; ctx.fillRect(0, 0, W, SAFE.y); ctx.fillRect(0, SAFE.y + SAFE.h, W, H - SAFE.y - SAFE.h);
      ctx.strokeStyle = '#e57650'; ctx.setLineDash([18, 12]); ctx.lineWidth = 4; ctx.strokeRect(2, SAFE.y, W - 4, SAFE.h); ctx.restore();
    }
    return canvas;
  }
  // JPG 92%: a textura granulada deixa o PNG com 4 MB; o JPG fica perto de 500 KB com a mesma nitidez
  function toBlob(canvas) {
    return new Promise(function (res, rej) {
      try { canvas.toBlob(function (b) { b ? res(b) : rej(new Error('Falha ao gerar a imagem.')); }, 'image/jpeg', 0.92); }
      catch (e) { rej(e); }
    });
  }
  function crop(canvas) {
    var c = d.createElement('canvas'); c.width = c.height = 1080;
    c.getContext('2d').drawImage(canvas, 0, SAFE.y, 1080, 1080, 0, 0, 1080, 1080);
    return c;
  }

  /* ---------- .zip sem compressão (JPG já é comprimido) ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, now = new Date();
    var time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + (p.byteLength || p.length); }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }

  /* ---------- pacote para baixar ---------- */
  function utmLink(course, ad, i, site) {
    var n = String(i + 1).padStart(2, '0');
    return (site || B.siteUrl()) + 'lp.html?c=' + encodeURIComponent(course.slug) + '&utm_source=meta&utm_medium=paid&utm_campaign=' + encodeURIComponent(course.slug) + '&utm_content=' + encodeURIComponent('ad' + n + '-' + ad.angle);
  }
  // texto que começa com = + @ vira fórmula no Excel: o apóstrofo neutraliza
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+@\t\r]/.test(v)) v = "'" + v; return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function fileBase(ad, i) { return String(i + 1).padStart(2, '0') + '-' + (B.slug(ad.angle) || 'anuncio'); }

  // render(ads, course, opts) -> Promise<Blob[]> ; opts.photo=false força sem foto
  function renderAll(ads, course, opts) {
    return prepare(course, opts).then(function (art) {
      return ads.reduce(function (p, ad) {
        return p.then(function (acc) {
          var cv = draw(d.createElement('canvas'), ad, course, art, opts);
          return toBlob(cv).then(function (b) { acc.push({ ad: ad, canvas: cv, blob: b }); return acc; });
        });
      }, Promise.resolve([]));
    });
  }
  function pack(ads, course, opts) {
    opts = opts || {};
    var run = function (o) { return renderAll(ads, course, o); };
    // imagem enviada de outro domínio pode bloquear a exportação: refaz sem a foto
    return run(opts).catch(function () { return run(Object.assign({}, opts, { photo: false })); }).then(function (list) {
      var dir = 'anuncios-' + (course.slug || 'curso') + '/', files = [];
      var jobs = list.map(function (it, i) {
        var base = fileBase(it.ad, i);
        var main = it.blob.arrayBuffer().then(function (buf) { files.push({ name: dir + 'stories-1080x1920/' + base + '.jpg', data: new Uint8Array(buf), i: i, k: 0 }); });
        if (!opts.feed) return main;
        return main.then(function () { return toBlob(crop(it.canvas)); }).then(function (b) { return b.arrayBuffer(); }).then(function (buf) { files.push({ name: dir + 'feed-1080x1080/' + base + '.jpg', data: new Uint8Array(buf), i: i, k: 1 }); });
      });
      return Promise.all(jobs).then(function () {
        files.sort(function (a, b) { return a.k - b.k || a.i - b.i; });
        var head = ['numero', 'angulo', 'arquivo', 'texto_principal', 'titulo', 'descricao', 'botao', 'link_com_utm'];
        var rows = ads.map(function (a, i) { return [i + 1, a.label || a.angle, 'stories-1080x1920/' + fileBase(a, i) + '.jpg', a.primary, a.headline, a.description, a.cta, utmLink(course, a, i, opts.site)]; });
        var csv = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n');
        var readme = [
          'ANÚNCIOS · ' + course.title,
          '',
          'stories-1080x1920/  Stories e Reels (9:16). Toda a informação está no quadrado central 1080x1080',
          '                    (de y=420 a y=1500), então a mesma arte também serve no feed.',
          opts.feed ? 'feed-1080x1080/     O mesmo anúncio já recortado em 1:1 para o feed.' : 'Para o feed, recorte o quadrado central (y=420 a 1500) ou use o posicionamento automático do Meta.',
          'textos.csv          Texto principal, título, descrição, botão e link com UTM de cada anúncio.',
          '                    Abre no Excel e no Google Planilhas (separador ponto e vírgula).',
          '',
          'Sugestão de teste: suba os 10 no mesmo conjunto, deixe rodar até cerca de 1.000 impressões',
          'cada e pause os que tiverem CTR abaixo da média do conjunto. O utm_content mostra qual',
          'anúncio trouxe cada venda no relatório de Vendas.'
        ].join('\r\n');
        files.push({ name: dir + 'textos.csv', data: csv }, { name: dir + 'LEIA-ME.txt', data: readme });
        return zip(files);
      });
    });
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = d.createElement('a');
    a.href = url; a.download = name; d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  B.ads = { W: W, H: H, SAFE: SAFE, prepare: prepare, draw: draw, renderAll: renderAll, pack: pack, zip: zip, download: download, utmLink: utmLink, loadFonts: loadFonts };
})(window, document);
