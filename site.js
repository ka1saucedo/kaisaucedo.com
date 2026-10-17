(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.remove('scramble-pending'); return; }

  var U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz', D = '0123456789', S = '#%&*+=<>/\\';
  function pick(set) { return set.charAt(Math.floor(Math.random() * set.length)); }
  function glyph(ch) {
    if (ch >= 'A' && ch <= 'Z') return pick(U);
    if (ch >= 'a' && ch <= 'z') return pick(L);
    if (ch >= '0' && ch <= '9') return pick(D);
    return pick(S);
  }
  function textNodes(el) {
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) { if (w.currentNode.nodeValue.trim()) out.push(w.currentNode); }
    return out;
  }

  // Each character gets a box locked to its real width, so scrambled glyphs
  // never change line breaks, heights, or the spacing of anything around them.
  function lockText(el) {
    var cells = [], swaps = [];
    textNodes(el).forEach(function (node) {
      var frag = document.createDocumentFragment(), made = [];
      node.nodeValue.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { var t = document.createTextNode(tok); frag.appendChild(t); made.push(t); return; }
        // Keep the browser's own break points: split after hyphens and slashes
        // so a word like "Indo-Pacific" wraps exactly as it does when finished.
        tok.split(/(?<=[-\u2010-\u2014\/])/).forEach(function (seg) {
          var word = document.createElement('span');
          word.style.whiteSpace = 'nowrap';
          Array.prototype.forEach.call(seg, function (ch) {
            var c = document.createElement('span');
            c.textContent = ch;
            word.appendChild(c);
            cells.push({ el: c, ch: ch });
          });
          frag.appendChild(word); made.push(word);
        });
      });
      swaps.push({ node: node, made: made });
      node.parentNode.replaceChild(frag, node);
    });
    cells.forEach(function (c) { c.w = c.el.getBoundingClientRect().width; });
    cells.forEach(function (c) {
      var st = c.el.style;
      st.display = 'inline-block'; st.width = c.w + 'px'; st.textAlign = 'center'; st.overflow = 'visible';
    });
    return { cells: cells, restore: function () {
      swaps.forEach(function (s) {
        var first = s.made[0];
        if (first && first.parentNode) first.parentNode.insertBefore(s.node, first);
        s.made.forEach(function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
      });
    } };
  }

  function scramble(el, delay, duration) {
    if (el._scrambling) return;
    el._scrambling = true;
    var lock = lockText(el), cells = lock.cells, len = cells.length || 1;
    var dur = duration || Math.min(1500, 260 + len * 5);
    cells.forEach(function (c, i) {
      c.at = delay + (i / len) * dur * 0.8 + Math.random() * dur * 0.2;
      c.el.textContent = glyph(c.ch);
    });
    el.style.visibility = 'visible';
    var start = performance.now(), last = 0;
    function frame(now) {
      var t = now - start, swap = now - last > 50, done = true;
      if (swap) last = now;
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (c.done) continue;
        if (t >= c.at) { c.el.textContent = c.ch; c.done = true; }
        else { done = false; if (swap) c.el.textContent = glyph(c.ch); }
      }
      if (!done) requestAnimationFrame(frame);
      else { lock.restore(); el._scrambling = false; }
    }
    requestAnimationFrame(frame);
  }

  function run() {
    document.querySelectorAll('[data-scramble]').forEach(function (el) {
      scramble(el, parseFloat(el.getAttribute('data-delay') || '0'), parseFloat(el.getAttribute('data-duration') || '0'));
    });
    root.classList.remove('scramble-pending');
    if (window.matchMedia && matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.work a').forEach(function (a) {
        var t = a.querySelector('.title');
        a.addEventListener('mouseenter', function () { scramble(t, 0, 380); });
      });
    }
  }
  function ready(fn) {
    var go = false, once = function () { if (!go) { go = true; fn(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(once);
    setTimeout(once, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { ready(run); });
  else ready(run);
})();
