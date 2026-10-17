(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.remove('scramble-pending'); return; }

  var U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz', D = '0123456789', S = '#%&*+=<>/\\[]';
  function pick(set) { return set.charAt(Math.floor(Math.random() * set.length)); }
  function glyph(ch) {
    if (/\s/.test(ch)) return ch;
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

  function scramble(el, delay, duration) {
    if (el._scrambling) return;
    el._scrambling = true;
    var nodes = textNodes(el);
    var finals = nodes.map(function (n) { return n.nodeValue; });
    var len = finals.reduce(function (a, s) { return a + s.length; }, 0) || 1;
    var dur = duration || Math.min(1500, 260 + len * 5);
    var reveal = [], cur = [];
    for (var i = 0; i < len; i++) reveal.push(delay + (i / len) * dur * 0.8 + Math.random() * dur * 0.2);
    finals.forEach(function (f) { cur.push(Array.prototype.map.call(f, glyph)); });
    var h = el.getBoundingClientRect().height;
    if (h) el.style.minHeight = h + 'px';
    nodes.forEach(function (n, k) { n.nodeValue = cur[k].join(''); });
    el.style.visibility = 'visible';
    var start = performance.now(), last = 0;
    function frame(now) {
      var t = now - start, swap = now - last > 50, done = true, g = 0;
      if (swap) last = now;
      nodes.forEach(function (n, k) {
        var f = finals[k], c = cur[k];
        for (var j = 0; j < f.length; j++, g++) {
          if (t >= reveal[g]) c[j] = f.charAt(j);
          else { done = false; if (swap) c[j] = glyph(f.charAt(j)); }
        }
        n.nodeValue = c.join('');
      });
      if (!done) requestAnimationFrame(frame);
      else {
        nodes.forEach(function (n, k) { n.nodeValue = finals[k]; });
        el.style.minHeight = '';
        el._scrambling = false;
      }
    }
    requestAnimationFrame(frame);
  }

  function run() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-scramble]'));
    els.forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-delay') || '0');
      var dur = parseFloat(el.getAttribute('data-duration') || '0');
      scramble(el, d, dur);
    });
    root.classList.remove('scramble-pending');
    if (window.matchMedia && matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.work a').forEach(function (a) {
        var t = a.querySelector('.title');
        a.addEventListener('mouseenter', function () { scramble(t, 0, 380); });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
