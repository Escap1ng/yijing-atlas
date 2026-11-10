// 揲蓍核心：四营状态机 + 六十四卦表
// 初爻为最低位，阳=1，阴=0；卦值 h = 下卦 + 上卦 * 8
(function (root) {
  'use strict';

  var TRIGRAM = { 乾: 7, 兑: 3, 离: 5, 震: 1, 巽: 6, 坎: 2, 艮: 4, 坤: 0 };

  // [文王序, 卦名, 上卦, 下卦]
  var HEX = [
    [1, '乾', '乾', '乾'], [2, '坤', '坤', '坤'], [3, '屯', '坎', '震'], [4, '蒙', '艮', '坎'],
    [5, '需', '坎', '乾'], [6, '讼', '乾', '坎'], [7, '师', '坤', '坎'], [8, '比', '坎', '坤'],
    [9, '小畜', '巽', '乾'], [10, '履', '乾', '兑'], [11, '泰', '坤', '乾'], [12, '否', '乾', '坤'],
    [13, '同人', '乾', '离'], [14, '大有', '离', '乾'], [15, '谦', '坤', '艮'], [16, '豫', '震', '坤'],
    [17, '随', '兑', '震'], [18, '蛊', '艮', '巽'], [19, '临', '坤', '兑'], [20, '观', '巽', '坤'],
    [21, '噬嗑', '离', '震'], [22, '贲', '艮', '离'], [23, '剥', '艮', '坤'], [24, '复', '坤', '震'],
    [25, '无妄', '乾', '震'], [26, '大畜', '艮', '乾'], [27, '颐', '艮', '震'], [28, '大过', '兑', '巽'],
    [29, '坎', '坎', '坎'], [30, '离', '离', '离'], [31, '咸', '兑', '艮'], [32, '恒', '震', '巽'],
    [33, '遯', '乾', '艮'], [34, '大壮', '震', '乾'], [35, '晋', '离', '坤'], [36, '明夷', '坤', '离'],
    [37, '家人', '巽', '离'], [38, '睽', '离', '兑'], [39, '蹇', '坎', '艮'], [40, '解', '震', '坎'],
    [41, '损', '艮', '兑'], [42, '益', '巽', '震'], [43, '夬', '兑', '乾'], [44, '姤', '乾', '巽'],
    [45, '萃', '兑', '坤'], [46, '升', '坤', '巽'], [47, '困', '兑', '坎'], [48, '井', '坎', '巽'],
    [49, '革', '兑', '离'], [50, '鼎', '离', '巽'], [51, '震', '震', '震'], [52, '艮', '艮', '艮'],
    [53, '渐', '巽', '艮'], [54, '归妹', '震', '兑'], [55, '丰', '震', '离'], [56, '旅', '离', '艮'],
    [57, '巽', '巽', '巽'], [58, '兑', '兑', '兑'], [59, '涣', '巽', '坎'], [60, '节', '坎', '兑'],
    [61, '中孚', '巽', '兑'], [62, '小过', '震', '艮'], [63, '既济', '坎', '离'], [64, '未济', '离', '坎']
  ];

  var BY_VALUE = {};
  HEX.forEach(function (row) {
    var h = TRIGRAM[row[3]] + TRIGRAM[row[2]] * 8;
    BY_VALUE[h] = { id: row[0], name: row[1], upper: row[2], lower: row[3], value: h };
  });

  function hexByValue(h) { return BY_VALUE[h] || null; }
  function hexByLines(lines) {
    var h = 0, i;
    for (i = 0; i < 6; i++) if (lines[i] === 7 || lines[i] === 9) h += (1 << i);
    return hexByValue(h);
  }
  function changedLines(lines) {
    var h = 0, i;
    for (i = 0; i < 6; i++) {
      var yang = lines[i] === 7 || lines[i] === 9;
      if (lines[i] === 6 || lines[i] === 9) yang = !yang;
      if (yang) h += (1 << i);
    }
    return hexByValue(h);
  }
  function lineName(v, i) {
    var yi = ['初', '二', '三', '四', '五', '上'][i];
    var num = (v === 7 || v === 9) ? '九' : '六';
    return i === 0 ? yi + num : (i === 5 ? yi + num : num + yi);
  }
  function lineLabel(v) {
    return v === 9 ? '老阳' : v === 6 ? '老阴' : v === 7 ? '少阳' : '少阴';
  }

  function randomInt(n) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var a = new Uint32Array(1);
      var limit = Math.floor(0xFFFFFFFF / n) * n;
      do { crypto.getRandomValues(a); } while (a[0] >= limit);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  // 一变之中，左堆 L 与右堆 R 均非空；挂一取右堆，故 R >= 2
  function split(n, rng) {
    var pick = rng(n - 2);          // 0 .. n-3
    return { L: pick + 1, R: n - pick - 1 };
  }

  function createSession(rng) {
    var r = rng || randomInt;
    return {
      rng: r,
      lineIndex: 0,
      change: 1,
      n: 49,
      phase: 'ready',
      L: null, R: null, rL: null, rR: null, take: null,
      lines: [],
      steps: [],
      done: false
    };
  }

  function invariant(change, n) {
    var ok;
    if (change === 1) ok = (n === 44 || n === 40);
    else if (change === 2) ok = (n === 40 || n === 36 || n === 32);
    else ok = (n === 36 || n === 32 || n === 28 || n === 24);
    return { ok: ok, msg: '第' + change + '变后余策应为 ' +
      (change === 1 ? '44 / 40' : change === 2 ? '40 / 36 / 32' : '36 / 32 / 28 / 24') + '，实得 ' + n };
  }

  // 推进一步，返回一个事件；事件同时写入 session.steps
  function advance(s) {
    var ev = null;
    if (s.phase === 'complete') return null;

    if (s.phase === 'ready') {
      var p = split(s.n, s.rng);
      s.L = p.L; s.R = p.R;
      s.before = s.n;
      s.phase = 'split';
      ev = {
        title: '分二', xiang: '象两',
        text: '将 ' + s.n + ' 策随手分为两堆：左 ' + s.L + ' 策，右 ' + s.R + ' 策。',
        math: s.n + ' = ' + s.L + ' + ' + s.R
      };
    } else if (s.phase === 'split') {
      s.R = s.R - 1;
      s.phase = 'hung';
      ev = {
        title: '挂一', xiang: '象三才',
        text: '从右堆取一策，挂在指间。右堆余 ' + s.R + ' 策。',
        math: '右 ' + (s.R + 1) + ' − 1 = ' + s.R
      };
    } else if (s.phase === 'hung') {
      s.rL = s.L % 4 || 4;
      s.phase = 'countedL';
      ev = {
        title: '揲四（左）', xiang: '象四时',
        text: '左堆 ' + s.L + ' 策，四四数之，得 ' + Math.floor((s.L - 1) / 4) + ' 组，余 ' + s.rL + '。',
        math: s.L + ' = 4 × ' + Math.floor((s.L - 1) / 4) + ' + ' + s.rL
      };
    } else if (s.phase === 'countedL') {
      s.rR = s.R % 4 || 4;
      s.phase = 'countedR';
      ev = {
        title: '揲四（右）', xiang: '象四时',
        text: '右堆 ' + s.R + ' 策，四四数之，得 ' + Math.floor((s.R - 1) / 4) + ' 组，余 ' + s.rR + '。',
        math: s.R + ' = 4 × ' + Math.floor((s.R - 1) / 4) + ' + ' + s.rR
      };
    } else if (s.phase === 'countedR') {
      s.take = s.rL + s.rR + 1;
      s.n = s.n - s.take;
      s.phase = (s.change === 3) ? 'lineReady' : 'changeDone';
      var inv = invariant(s.change, s.n);
      ev = {
        title: '归奇', xiang: '象闰',
        text: '挂一与两余合为一堆：1 + ' + s.rL + ' + ' + s.rR + ' = ' + s.take + '。余 ' + s.n + ' 策。',
        math: s.before + ' − ' + s.take + ' = ' + s.n,
        check: inv
      };
    } else if (s.phase === 'changeDone') {
      s.change += 1;
      s.phase = 'ready';
      ev = {
        title: '接下一变', xiang: '续变',
        text: '合拢余策 ' + s.n + '，作第 ' + s.change + ' 变。',
        math: '余 ' + s.n + ' 策'
      };
    } else if (s.phase === 'lineReady') {
      var v = s.n / 4;
      s.lines.push(v);
      s.phase = 'lineDone';
      ev = {
        title: '定爻', xiang: '老少阴阳',
        text: '三变已毕，余 ' + s.n + ' 策，四约之得 ' + v + '，是为' + lineLabel(v) +
          (v === 6 || v === 9 ? '，为变爻。' : '，为静爻。'),
        math: s.n + ' ÷ 4 = ' + v,
        value: v,
        lineIndex: s.lineIndex
      };
    } else if (s.phase === 'lineDone') {
      if (s.lines.length >= 6) {
        s.phase = 'complete';
        s.done = true;
        ev = { title: '成卦', xiang: '卦成', text: '六爻已备，十八变毕。', math: '六爻：' + s.lines.join(' ') };
      } else {
        s.lineIndex += 1;
        s.change = 1;
        s.n = 49;
        s.phase = 'ready';
        ev = {
          title: '下一爻', xiang: '起爻',
          text: '复取四十九策，起第 ' + (s.lineIndex + 1) + ' 爻（自下而上）。',
          math: '49 策'
        };
      }
    }

    if (ev) {
      ev.phase = s.phase;
      ev.snapshot = snapshot(s);
      s.steps.push(ev);
    }
    return ev;
  }

  function snapshot(s) {
    return {
      lineIndex: s.lineIndex, change: s.change, n: s.n, phase: s.phase,
      L: s.L, R: s.R, rL: s.rL, rR: s.rR, take: s.take,
      lines: s.lines.slice()
    };
  }

  function runUntil(s, phases) {
    var guard = 0, last = null;
    while (guard++ < 20 && phases.indexOf(s.phase) === -1 && s.phase !== 'complete') {
      last = advance(s);
      if (!last) break;
    }
    return last;
  }

  function validate() {
    var errs = [], seen = {};
    if (HEX.length !== 64) errs.push('HEX length != 64');
    HEX.forEach(function (row) {
      if (!(row[2] in TRIGRAM) || !(row[3] in TRIGRAM)) errs.push('bad trigram: ' + row[1]);
      var h = TRIGRAM[row[3]] + TRIGRAM[row[2]] * 8;
      if (seen[h]) errs.push('duplicate hexagram value ' + h + ': ' + row[1]);
      seen[h] = true;
    });
    for (var i = 0; i < 64; i++) if (!seen[i]) errs.push('missing value ' + i);
    // 已知点抽查
    var qian = hexByLines([7, 7, 7, 7, 7, 7]);
    var kun = hexByLines([8, 8, 8, 8, 8, 8]);
    var jiji = hexByLines([7, 8, 7, 8, 7, 8]);
    var weiji = hexByLines([8, 7, 8, 7, 8, 7]);
    if (!qian || qian.name !== '乾') errs.push('qian mismatch');
    if (!kun || kun.name !== '坤') errs.push('kun mismatch');
    if (!jiji || jiji.name !== '既济') errs.push('jiji mismatch: ' + (jiji && jiji.name));
    if (!weiji || weiji.name !== '未济') errs.push('weiji mismatch: ' + (weiji && weiji.name));
    return errs;
  }

  var api = {
    TRIGRAM: TRIGRAM, HEX: HEX,
    hexByValue: hexByValue, hexByLines: hexByLines, changedLines: changedLines,
    lineName: lineName, lineLabel: lineLabel,
    createSession: createSession, advance: advance, runUntil: runUntil,
    snapshot: snapshot, validate: validate, randomInt: randomInt
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ShiyiCore = api;
})(typeof window !== 'undefined' ? window : null);
