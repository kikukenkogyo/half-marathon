// 練習メニューの中身。メニューを変えるときは、このファイルだけを直す（index.html は画面の作りだけ）。
// long = ① 長く走る日（8.5km/h） / pace = ② 本番の速さの日 / easy = ③ つなぎの日（9.0km/h）
// out: 外で走る日 / rest: 休む週 / test: 10km全力の力だめし / fast10: 最後の10分だけ10.0km/h
window.PLAN = {
  title: "練馬こぶしハーフマラソン",
  race: "2027-03-28",
  raceInfo: "3月28日（日）8:00　光が丘公園",
  goal: "2時間切り（1km 5分40秒）",
  firstMonday: "2026-11-23",
  longSpeed: 8.5,
  easySpeed: 9.0,
  extra: { speed: 8.5, min: 35, label: "8.5km/h × 30〜40分" },
  weeks: [
    { phase: "土台づくり", long: { min: 60 },               pace: { speed: 10.5, min: 30 }, easy: { min: 45 } },
    { phase: "土台づくり", long: { min: 70 },               pace: { speed: 10.5, min: 30 }, easy: { min: 45 } },
    { phase: "土台づくり", long: { min: 80 },               pace: { speed: 10.5, min: 35 }, easy: { min: 45 } },
    { phase: "土台づくり", long: { min: 90 },               pace: { speed: 10.5, min: 40 }, easy: { min: 45 } },
    { phase: "土台づくり", long: { min: 75, rest: true },   pace: { speed: 10.5, min: 35 }, easy: { min: 45 } },
    { phase: "土台づくり", long: { min: 90 },               pace: { speed: 10.5, min: 40 }, easy: { min: 45 }, note: "年末年始。ジムが休みなら外で走る" },
    { phase: "のばす",     long: { min: 100 },              pace: { speed: 10.6, min: 40 }, easy: { min: 45, fast10: true } },
    { phase: "のばす",     long: { min: 110, out: true },   pace: { speed: 10.6, min: 45 }, easy: { min: 45, fast10: true } },
    { phase: "のばす",     long: { min: 85, rest: true },   pace: { speed: 10.6, min: 40 }, easy: { min: 45, fast10: true } },
    { phase: "のばす",     long: { min: 120, out: true },   pace: { speed: 10.6, min: 50 }, easy: { min: 45, fast10: true } },
    { phase: "仕上げ",     long: { min: 120 },              pace: { speed: 10.6, min: 50 }, easy: { min: 45, fast10: true } },
    { phase: "仕上げ",     long: { min: 130, out: true },   pace: { speed: 10.6, min: 55 }, easy: { min: 45, fast10: true } },
    { phase: "仕上げ",     long: { min: 90, rest: true },   pace: { speed: 10.6, min: 45 }, easy: { min: 45, fast10: true } },
    { phase: "仕上げ",     long: { min: 130, out: true },   pace: { test: true },           easy: { min: 45, fast10: true }, note: "②は力だめし。10kmを全力で走り、時間を記録する" },
    { phase: "まとめ",     long: { min: 140, out: true },   pace: { speed: 10.6, min: 60 }, easy: { min: 45, fast10: true } },
    { phase: "まとめ",     long: { min: 120, out: true },   pace: { speed: 10.6, min: 50 }, easy: { min: 45, fast10: true } },
    { phase: "疲れを抜く", long: { min: 90 },               pace: { speed: 10.6, min: 40 }, easy: { min: 45 } },
    { phase: "疲れを抜く", long: null,                      pace: { speed: 10.6, min: 15 }, easy: { min: 35, label: "9.0km/h × 30〜40分（軽く）" },
      restDays: ["2027-03-26", "2027-03-27"], note: "金・土は休み。28日（日）が本番" }
  ],
  rules: [
    "①と②は2日続けてやらない（続く日はどちらかを③に）",
    "①は速度を上げない。時間を延ばすだけ",
    "②は「あと10分走れる」で止める",
    "90分を超える日は、途中で水分と補給ゼリー",
    "ひざ・すねが痛い日は②を休み、①と③だけ",
    "4回目からは④軽く走る日。①と②は週1回ずつまで",
    "マシンの傾斜は1.0%"
  ]
};
