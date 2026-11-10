(function () {
  'use strict';
  var MOD = 365.25;
  var TAU = Math.PI * 2;
  var R_OUT = 300, R_IN = 266, R_TERM = 258, R_TERM_LAB = 314;
  var R_GUA_OUT = 232, R_GUA_IN = 198;

  var MANSIONS = [
    ['角', 12, '东'], ['亢', 9, '东'], ['氐', 15, '东'], ['房', 5, '东'], ['心', 5, '东'], ['尾', 18, '东'], ['箕', 11, '东'],
    ['斗', 26.25, '北'], ['牛', 8, '北'], ['女', 12, '北'], ['虚', 10, '北'], ['危', 17, '北'], ['室', 16, '北'], ['壁', 9, '北'],
    ['奎', 16, '西'], ['娄', 12, '西'], ['胃', 14, '西'], ['昴', 11, '西'], ['毕', 16, '西'], ['觜', 2, '西'], ['参', 9, '西'],
    ['井', 33, '南'], ['鬼', 4, '南'], ['柳', 15, '南'], ['星', 7, '南'], ['张', 18, '南'], ['翼', 18, '南'], ['轸', 17, '南']
  ];
  var COLORS = {
    '东': ['#93a08e', '#a7b2a1'],
    '北': ['#7c899e', '#909caf'],
    '西': ['#b7a58d', '#c7b8a3'],
    '南': ['#ac7f75', '#bd9187']
  };
  var TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种',
    '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];
  var GUAQI = ['中孚', '复', '屯', '谦', '睽', '升', '临', '小过', '蒙', '益', '渐', '泰', '需', '随', '晋', '解',
    '大壮', '豫', '讼', '蛊', '革', '夬', '旅', '师', '比', '小畜', '乾', '大有', '家人', '井', '咸', '姤',
    '鼎', '丰', '涣', '履', '遯', '恒', '节', '同人', '损', '否', '巽', '萃', '大畜', '贲', '观', '归妹',
    '无妄', '明夷', '困', '剥', '艮', '既济', '噬嗑', '大过', '坤', '未济', '蹇', '颐'];
  var PI_GUA = { '复': 1, '临': 1, '泰': 1, '大壮': 1, '夬': 1, '乾': 1, '姤': 1, '遯': 1, '否': 1, '观': 1, '剥': 1, '坤': 1 };
  var CARDINAL = [['坎', 0], ['震', 6], ['离', 12], ['兑', 18]];

  function angle(u) { return -Math.PI / 2 + TAU * u / MOD; }
  function label(text, r, u, size, fill, weight) {
    var a = angle(u), x = r * Math.cos(a), y = r * Math.sin(a), rot = a * 180 / Math.PI + 90;
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" transform="rotate(' + rot.toFixed(1) +
      ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" text-anchor="middle" dominant-baseline="middle" font-size="' +
      size + '" fill="' + fill + '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + text + '</text>';
  }
  function sector(r1, r2, u1, u2) {
    var a1 = angle(u1), a2 = angle(u2), large = (u2 - u1) > MOD / 2 ? 1 : 0;
    var x1 = r1 * Math.cos(a1), y1 = r1 * Math.sin(a1);
    var x2 = r2 * Math.cos(a1), y2 = r2 * Math.sin(a1);
    var x3 = r2 * Math.cos(a2), y3 = r2 * Math.sin(a2);
    var x4 = r1 * Math.cos(a2), y4 = r1 * Math.sin(a2);
    return 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 1 ' +
      x4.toFixed(1) + ',' + y4.toFixed(1) + ' L' + x3.toFixed(1) + ',' + y3.toFixed(1) + ' A' + r2 + ',' + r2 +
      ' 0 ' + large + ' 0 ' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' Z';
  }

  var bounds = [], cum = 0, i;
  for (i = 0; i < MANSIONS.length; i++) { bounds.push(cum); cum += MANSIONS[i][1]; }

  function nearest(u) {
    var best = 1e9;
    for (var k = 0; k < bounds.length; k++) {
      var d = Math.abs(u - bounds[k]) % MOD;
      d = Math.min(d, MOD - d);
      if (d < best) best = d;
    }
    return best;
  }
  function rms(phi) {
    var s = 0;
    for (var k = 0; k < 24; k++) {
      var d = nearest(k * MOD / 24 + phi);
      s += d * d;
    }
    return Math.sqrt(s / 24);
  }

  var svg = '<svg viewBox="-332 -332 664 664" role="img" aria-label="二十八宿、二十四节气与六十卦气同轴圆图">';
  svg += '<circle r="' + R_OUT + '" fill="none" stroke="#d8cfc0" stroke-width="1"/>';
  svg += '<circle r="' + R_IN + '" fill="none" stroke="#d8cfc0" stroke-width="1"/>';
  svg += '<circle r="' + R_GUA_OUT + '" fill="none" stroke="#d8cfc0" stroke-width="1"/>';
  svg += '<circle r="' + R_GUA_IN + '" fill="none" stroke="#d8cfc0" stroke-width="1"/>';

  cum = 0;
  for (i = 0; i < MANSIONS.length; i++) {
    var m = MANSIONS[i], w = m[1];
    var fill = COLORS[m[2]][i % 2];
    svg += '<path d="' + sector(R_IN, R_OUT, cum, cum + w) + '" fill="' + fill + '" fill-opacity=".85" stroke="#f5f0e6" stroke-width="1.2">' +
      '<title>' + m[0] + '宿 ' + w + ' 古度</title></path>';
    svg += label(m[0], (R_IN + R_OUT) / 2 - 8, cum + w / 2, 13, '#26221e');
    cum += w;
  }

  svg += '<g id="termRing">';
  for (i = 0; i < 24; i++) {
    var u = i * MOD / 24, a = angle(u);
    var x1 = R_TERM * Math.cos(a), y1 = R_TERM * Math.sin(a);
    var x2 = (R_TERM - 12) * Math.cos(a), y2 = (R_TERM - 12) * Math.sin(a);
    svg += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
      '" stroke="#6b635a" stroke-width="1"/>';
    if (i % 3 === 0) svg += label(TERMS[i], R_TERM_LAB, u, 12, '#6b635a');
  }
  for (i = 0; i < CARDINAL.length; i++) {
    var cu = CARDINAL[i][1] * MOD / 24, ca = angle(cu);
    var cx = (R_TERM - 6) * Math.cos(ca), cy = (R_TERM - 6) * Math.sin(ca);
    svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="7" fill="#c9a227"/>';
    svg += label(CARDINAL[i][0], 242, cu, 10.5, '#8a6d12', 600);
  }
  svg += '</g>';

  for (i = 0; i < GUAQI.length; i++) {
    var g = GUAQI[i], gu1 = i * MOD / 60, gu2 = (i + 1) * MOD / 60;
    var isPi = PI_GUA[g];
    svg += '<path d="' + sector(R_GUA_IN, R_GUA_OUT, gu1, gu2) + '" fill="' + (isPi ? '#9b3b2e' : '#ece3d4') +
      '" fill-opacity="' + (isPi ? '.88' : '1') + '" stroke="#f5f0e6" stroke-width="1">' +
      '<title>' + g + '　第 ' + (i + 1) + ' 卦　' + (gu1).toFixed(2) + '–' + (gu2).toFixed(2) + ' 日</title></path>';
    if (isPi) svg += label(g, (R_GUA_IN + R_GUA_OUT) / 2, (gu1 + gu2) / 2, 11, '#f5f0e6');
  }

  svg += '<text y="-26" text-anchor="middle" font-size="34" fill="#26221e">365¼</text>';
  svg += '<text y="2" text-anchor="middle" font-size="13" fill="#7a7168" letter-spacing="2">日 · 度 · 气 同轴</text>';
  svg += '<text y="28" text-anchor="middle" font-size="11.5" fill="#7a7168">二十八宿 · 二十四气 · 六十卦气</text>';
  svg += '</svg>';

  var chart = document.getElementById('chart');
  if (!chart) return;
  chart.innerHTML = svg;

  var phi = document.getElementById('phi');
  var phiOut = document.getElementById('phiOut');
  var rmsOut = document.getElementById('rms');
  var ring = document.getElementById('termRing');

  function apply(v) {
    phi.value = v;
    phiOut.textContent = Number(v).toFixed(2);
    ring.setAttribute('transform', 'rotate(' + (v / MOD * 360).toFixed(3) + ')');
    rmsOut.textContent = rms(v).toFixed(2);
  }

  phi.addEventListener('input', function () { apply(parseFloat(phi.value)); });
  document.getElementById('btnBest').addEventListener('click', function () { apply(76.5); });
  document.getElementById('btnAnchor').addEventListener('click', function () { apply(96.25); });

  apply(parseFloat(phi.value));
})();
