(function () {
  'use strict';
  var S = window.ShiyiCore;
  var $ = function (id) { return document.getElementById(id); };

  var session = S.createSession();

  var el = {
    status: $('status'), count: $('count'),
    bundle: $('bundle'), rodsAll: $('rodsAll'),
    piles: $('piles'), numL: $('numL'), numR: $('numR'), numH: $('numH'),
    rodsL: $('rodsL'), rodsR: $('rodsR'), rodsH: $('rodsH'),
    chipL: $('chipL'), chipR: $('chipR'),
    formula: $('formula'), check: $('check'),
    stepTitle: $('stepTitle'), stepXiang: $('stepXiang'),
    stepText: $('stepText'), stepMath: $('stepMath'),
    hex: $('hex'), hexMeta: $('hexMeta'), hexState: $('hexState'),
    textBlock: $('textBlock'), textName: $('textName'), textGuaci: $('textGuaci'),
    textBaihua: $('textBaihua'), textZhu: $('textZhu'), textZhuBody: $('textZhuBody'),
    textXiang: $('textXiang'), textXiangBaihua: $('textXiangBaihua'), textZhi: $('textZhi'),
    textModern: $('textModern'), textModernBody: $('textModernBody'),
    textLines: $('textLines'), textTuan: $('textTuan'),
    log: $('log'), stepCount: $('stepCount'),
    btnStep: $('btnStep'), btnChange: $('btnChange'),
    btnLine: $('btnLine'), btnReset: $('btnReset')
  };

  function rodEl(i, accentFrom) {
    var d = document.createElement('i');
    d.className = 'rod' + (accentFrom != null && i >= accentFrom ? ' accent' : '');
    d.style.setProperty('--i', i);
    return d;
  }

  function rods(node, n, accentFrom, grouped, entry, accentAnim) {
    node.innerHTML = '';
    node.classList.toggle('entering', !!entry);
    node.classList.toggle('tapping', !!accentAnim);
    var frag = document.createDocumentFragment();
    var i = 0;
    if (grouped) {
      while (i < n) {
        var g = document.createElement('span');
        g.className = 'rodgroup';
        for (var k = 0; k < 4 && i < n; k++, i++) g.appendChild(rodEl(i, accentFrom));
        frag.appendChild(g);
      }
    } else {
      for (; i < n; i++) frag.appendChild(rodEl(i, accentFrom));
    }
    node.appendChild(frag);
  }

  function lineRow(v, i) {
    var row = document.createElement('div');
    row.className = 'line-row';
    var shape = document.createElement('div');
    shape.className = 'line-shape';
    if (v == null) {
      row.className += ' empty';
      shape.appendChild(document.createElement('i'));
    } else {
      var yang = (v === 7 || v === 9);
      if (yang) {
        var a = document.createElement('i');
        a.className = 'bar';
        shape.appendChild(a);
      } else {
        var b1 = document.createElement('i');
        var b2 = document.createElement('i');
        b1.className = 'bar';
        b2.className = 'bar';
        shape.appendChild(b1);
        shape.appendChild(b2);
      }
      if (v === 6 || v === 9) row.className += ' old';
    }
    var label = document.createElement('span');
    label.className = 'line-label';
    label.textContent = v == null ? '第 ' + (i + 1) + ' 爻' : S.lineName(v, i) + ' · ' + S.lineLabel(v);
    row.appendChild(shape);
    row.appendChild(label);
    return row;
  }

  var renderedLines = 0;
  function renderHex() {
    el.hex.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 5; i >= 0; i--) {
      var row = lineRow(session.lines[i], i);
      if (session.lines[i] != null && i >= renderedLines) row.className += ' new';
      frag.appendChild(row);
    }
    el.hex.appendChild(frag);
    renderedLines = session.lines.length;

    var n = session.lines.length;
    el.hexState.textContent = n === 6 ? '六爻已成' : '已得 ' + n + ' 爻';

    if (n < 6) {
      el.hexMeta.textContent = n === 0 ? '自下而上，初爻在先。' : '六爻未成。爻值：' + session.lines.join(' · ');
      el.textBlock.hidden = true;
      return;
    }

    var ben = S.hexByLines(session.lines);
    var hasOld = session.lines.some(function (v) { return v === 6 || v === 9; });
    var zhi = hasOld ? S.changedLines(session.lines) : null;
    var sym = function (h) { return String.fromCodePoint(0x4DC0 + h.id - 1); };

    var html = '<strong>' + ben.name + '</strong> <span class="sym">' + sym(ben) + '</span>　第 ' + ben.id + ' 卦　下' +
      ben.lower + '上' + ben.upper + '<br>爻值 ' + session.lines.join(' ') +
      '（自初爻起）';
    if (zhi) {
      html += '<br>老变少不变，之卦：<strong>' + zhi.name + '</strong> <span class="sym">' + sym(zhi) +
        '</span>　第 ' + zhi.id + ' 卦';
    } else {
      html += '<br>六爻皆少，无之卦。';
    }
    el.hexMeta.innerHTML = html;
    renderCanon(ben, zhi);
  }

  function addZhu(li, zhu) {
    if (!zhu) return;
    var d = document.createElement('details');
    d.className = 'lz-long';
    var s = document.createElement('summary');
    s.textContent = '王弼注';
    var p = document.createElement('p');
    p.textContent = zhu;
    d.appendChild(s);
    d.appendChild(p);
    li.appendChild(d);
  }

  function renderCanon(ben, zhi) {
    var data = window.HEXTEXT && window.HEXTEXT[ben.id];
    if (!data) {
      el.textBlock.hidden = true;
      return;
    }
    el.textBlock.hidden = false;
    el.textName.textContent = '第 ' + data.id + ' 卦';
    el.textGuaci.textContent = data.guaci;
    el.textBaihua.textContent = data.baihua || '';
    if (data.zhu) {
      el.textZhu.hidden = false;
      el.textZhuBody.textContent = data.zhu;
    } else {
      el.textZhu.hidden = true;
    }
    el.textXiang.textContent = data.daxiang;
    el.textXiangBaihua.textContent = data.daxiangBaihua || '';
    var modern = window.MODERN && window.MODERN[ben.id];
    if (modern) {
      el.textModern.hidden = false;
      el.textModernBody.textContent = modern;
    } else {
      el.textModern.hidden = true;
    }
    el.textTuan.textContent = data.tuan;

    if (zhi) {
      var zi = window.HEXTEXT[zhi.id];
      el.textZhi.hidden = false;
      el.textZhi.textContent = '之卦 ' + zhi.name + '：' + (zi ? zi.guaci : '');
    } else {
      el.textZhi.hidden = true;
    }

    el.textLines.innerHTML = '';
    var frag = document.createDocumentFragment();
    data.lines.forEach(function (ln, i) {
      var v = session.lines[i];
      var li = document.createElement('li');
      li.className = 'lineitem' + (v === 6 || v === 9 ? ' old' : '');
      var name = document.createElement('span');
      name.className = 'ln';
      name.textContent = ln.name;
      var text = document.createElement('span');
      text.className = 'lt';
      text.textContent = ln.text;
      li.appendChild(name);
      li.appendChild(text);
      if (ln.baihua) {
        var bh = document.createElement('span');
        bh.className = 'lb';
        bh.textContent = ln.baihua;
        li.appendChild(bh);
      }
      if (ln.imageText) {
        var ix = document.createElement('span');
        ix.className = 'lx';
        ix.textContent = ln.imageText;
        li.appendChild(ix);
      }
      addZhu(li, ln.zhu);
      frag.appendChild(li);
    });
    (data.extra || []).forEach(function (ln) {
      var li = document.createElement('li');
      li.className = 'lineitem extra';
      var name = document.createElement('span');
      name.className = 'ln';
      name.textContent = ln.name;
      var text = document.createElement('span');
      text.className = 'lt';
      text.textContent = ln.text;
      li.appendChild(name);
      li.appendChild(text);
      if (ln.imageText) {
        var ix = document.createElement('span');
        ix.className = 'lx';
        ix.textContent = ln.imageText;
        li.appendChild(ix);
      }
      addZhu(li, ln.zhu);
      frag.appendChild(li);
    });
    el.textLines.appendChild(frag);
  }

  var prevPhase = null;
  function renderBoard() {
    var showPiles = ['split', 'hung', 'countedL', 'countedR'].indexOf(session.phase) !== -1;
    el.bundle.hidden = showPiles;
    el.piles.hidden = !showPiles;

    if (!showPiles) {
      var collect = prevPhase == null || prevPhase === 'split' || prevPhase === 'hung' ||
        prevPhase === 'countedL' || prevPhase === 'countedR' ||
        (prevPhase === 'lineDone' && session.phase === 'ready');
      rods(el.rodsAll, session.n, null, false, collect);
      var label = $('bundleLabel');
      label.textContent = session.phase === 'complete'
        ? '末变余策 ' + session.n
        : (session.n === 49 ? '四十九策' : '余 ' + session.n + ' 策');
      prevPhase = session.phase;
      return;
    }

    el.numL.textContent = session.L;
    el.numR.textContent = session.R;
    var countedL = session.phase === 'countedL' || session.phase === 'countedR';
    var countedR = session.phase === 'countedR';
    var dealing = session.phase === 'split';
    rods(el.rodsL, session.L, countedL ? session.L - session.rL : null, true,
      dealing, session.phase === 'countedL');
    rods(el.rodsR, session.R, countedR ? session.R - session.rR : null, true,
      dealing, session.phase === 'countedR');

    var hung = session.phase === 'split' ? 0 : 1;
    el.numH.textContent = hung ? '1' : '—';
    rods(el.rodsH, hung, null, false, session.phase === 'hung');

    if (session.phase === 'countedL' || session.phase === 'countedR') {
      el.chipL.hidden = false;
      el.chipL.textContent = '左余 ' + session.rL;
    } else {
      el.chipL.hidden = true;
    }
    if (session.phase === 'countedR') {
      el.chipR.hidden = false;
      el.chipR.textContent = '右余 ' + session.rR;
    } else {
      el.chipR.hidden = true;
    }
    prevPhase = session.phase;
  }

  function setText(node, text) {
    if (node.textContent === text) return;
    node.textContent = text;
    node.classList.remove('swap');
    void node.offsetWidth;
    node.classList.add('swap');
  }

  function renderStep() {
    var ev = session.steps[session.steps.length - 1];
    if (!ev) {
      el.stepTitle.textContent = '起筮';
      el.stepXiang.textContent = '虚一';
      setText(el.stepText, '四十九策在案。点击「下一步」，从分二开始。');
      setText(el.stepMath, '');
      el.formula.textContent = '四十九策在案，虚一不用。';
      el.check.hidden = true;
      return;
    }
    el.stepTitle.textContent = ev.title;
    el.stepXiang.textContent = ev.xiang || '';
    setText(el.stepText, ev.text);
    setText(el.stepMath, ev.math || '');
    if (ev.math) el.formula.textContent = ev.math;

    if (ev.check) {
      el.check.hidden = false;
      el.check.className = 'check' + (ev.check.ok ? '' : ' bad');
      setText(el.check, (ev.check.ok ? '合：' : '不合：') + ev.check.msg);
    } else {
      el.check.hidden = true;
    }
  }

  function renderLog() {
    el.log.innerHTML = '';
    var steps = session.steps.slice(-6);
    var frag = document.createDocumentFragment();
    steps.forEach(function (ev) {
      var li = document.createElement('li');
      var b = document.createElement('b');
      b.textContent = ev.title + '　';
      li.appendChild(b);
      li.appendChild(document.createTextNode(ev.text));
      frag.appendChild(li);
    });
    el.log.appendChild(frag);
    el.stepCount.textContent = session.steps.length + ' 步';
  }

  function renderStatus() {
    if (session.phase === 'complete') {
      el.status.textContent = '十八变毕';
    } else if (session.phase === 'changeDone') {
      el.status.textContent = '第 ' + (session.lineIndex + 1) + ' 爻 · 第 ' + session.change + ' 变已毕';
    } else if (session.phase === 'lineReady') {
      el.status.textContent = '第 ' + (session.lineIndex + 1) + ' 爻 · 三变已毕';
    } else if (session.phase === 'lineDone') {
      el.status.textContent = '第 ' + session.lines.length + ' 爻已成';
    } else {
      el.status.textContent = '第 ' + (session.lineIndex + 1) + ' 爻 · 第 ' + session.change + ' 变';
    }
    el.count.textContent = '余 ' + session.n + ' 策';
  }

  function render() {
    renderStatus();
    renderBoard();
    renderStep();
    renderHex();
    renderLog();
    var done = session.phase === 'complete';
    el.btnStep.disabled = done;
    el.btnChange.disabled = done;
    el.btnLine.disabled = done;
  }

  $('btnStep').addEventListener('click', function () {
    S.advance(session);
    render();
  });

  el.btnChange.addEventListener('click', function () {
    if (session.phase === 'lineReady') {
      S.advance(session);          // 三变已毕，此步定爻即止
      render();
      return;
    }
    if (session.phase === 'changeDone' || session.phase === 'lineDone') S.advance(session);
    S.runUntil(session, ['changeDone', 'lineReady', 'complete']);
    render();
  });

  el.btnLine.addEventListener('click', function () {
    if (session.phase === 'lineDone') S.advance(session);
    S.runUntil(session, ['lineDone', 'complete']);
    if (session.lines.length === 6 && session.phase !== 'complete') S.advance(session);
    render();
  });

  el.btnReset.addEventListener('click', function () {
    session = S.createSession();
    prevPhase = null;
    renderedLines = 0;
    render();
  });

  var tabs = document.querySelectorAll('#tabs button');
  Array.prototype.forEach.call(tabs, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(tabs, function (b) {
        b.classList.toggle('active', b === btn);
      });
      var view = btn.getAttribute('data-view');
      $('view-shiyi').hidden = view !== 'shiyi';
      $('view-method').hidden = view !== 'method';
      $('view-stars').hidden = view !== 'stars';
      $('toolbar').hidden = view !== 'shiyi';
      window.scrollTo(0, 0);
    });
  });

  render();
})();
