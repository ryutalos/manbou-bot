import { useState, useEffect, useRef } from "react";
import { LogoMark, TYPE_SRC } from "./assets/logos";

// ── ミチノリ v9 ──
// UX/ロジックは v8 のまま、デザインをモックに合わせて刷新
// ・ソフトグラス(ほぼ白)のパネル + ピル型ボタン + SVGアイコン
// ・ホーム: 上部に書き出し/読み込み、中央に大きなロゴ、サムネ付き旅程カード
// ・編集: カード右にドラッグハンドル、経由/滞在ピル、点線の追加ボタン
// ・当日: ヘッダーカード化、青トグル、タイムラインは移動区間が破線

const C = {
  ink: "#16181D",
  sub: "#8A93A6",
  key: "#2000FF",
  keySoft: "#2000FF14",
  danger: "#E5484D",
  border: "#DCE1EC",
  black: "#111111",
};

// 大きめの面(パネル): 白寄りのガラス + ふんわり影
const PANEL = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.85)",
  borderRadius: 32,
  boxShadow:
    "0 18px 40px rgba(96,106,160,0.13), inset 0 1.5px 1px rgba(255,255,255,0.95)",
};

// スポットカード: ほぼ不透明の白
const CARD = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.95)",
  borderRadius: 24,
  boxShadow: "0 10px 24px rgba(96,106,160,0.10), inset 0 1px 1px #fff",
};

const MODES = [
  { id: "transit", icon: "🚃", label: "電車" },
  { id: "walking", icon: "🚶", label: "徒歩" },
  { id: "driving", icon: "🚗", label: "車" },
];

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

const uid = () => Math.random().toString(36).slice(2, 9);

const newSpot = (name) => ({
  id: uid(),
  name,
  stay: 60,
  memo: "",
  photos: [],
  fixedArrival: null,
  travel: { mode: "transit", minutes: 20 },
});

const newDay = () => ({ startTime: "09:00", spots: [] });

const newTrip = () => ({
  title: "無題の旅",
  startDate: "",
  endDate: "",
  days: { 0: newDay() },
});

function addMin(hhmm, minutes) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const day = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  const pad = (n) => String(n).padStart(2, "0");
  return { text: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, nextDay: day > 0 };
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function dayCount(trip) {
  if (!trip.startDate || !trip.endDate) return 1;
  const s = new Date(trip.startDate + "T00:00:00");
  const e = new Date(trip.endDate + "T00:00:00");
  return Math.min(Math.max(Math.round((e.getTime() - s.getTime()) / 86400000) + 1, 1), 14);
}

function dateOfDay(trip, i) {
  if (!trip.startDate) return null;
  const d = new Date(trip.startDate + "T00:00:00");
  d.setDate(d.getDate() + i);
  return d;
}

function dateLabel(trip, i) {
  const d = dateOfDay(trip, i);
  return d ? `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})` : "";
}

function isoOfDay(trip, i) {
  const d = dateOfDay(trip, i);
  if (!d) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangeLabel(t) {
  if (!t.startDate) return "日付未定";
  const f = (x) => x.replaceAll("-", "/").slice(5);
  return t.endDate && t.endDate !== t.startDate
    ? `${f(t.startDate)}〜${f(t.endDate)}`
    : f(t.startDate);
}

function firstPhoto(t) {
  if (!t?.days) return null;
  const keys = Object.keys(t.days).sort((a, b) => Number(a) - Number(b));
  for (const k of keys) {
    for (const s of t.days[k].spots || []) {
      if (s.photos?.length) return s.photos[0];
    }
  }
  return null;
}

function mapsUrl(from, to, mode) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    from
  )}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;
}

function compressImage(file, maxSize = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ロゴマークは branding モジュールの SVG を薄くラップ(旧 Logo API を維持)
function Logo({ size = 32 }) {
  return <LogoMark size={size} />;
}

// ロゴタイプ「ミチノリ」。height で高さ指定、幅は自動
function LogoType({ height = 22 }) {
  return (
    <img
      src={TYPE_SRC}
      alt="ミチノリ"
      draggable={false}
      style={{ display: "block", height, width: "auto", flex: "none" }}
    />
  );
}

// ── SVGアイコン(線画・currentColor) ──
function Ic({ d, size = 16, sw = 1.8, className = undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
const IC = {
  upload: "M12 15V4 M8 7.5 12 3.5l4 4 M4.5 14v4.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V14",
  download: "M12 4v11 M8 11.5l4 4 4-4 M4.5 14v4.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V14",
  copy:
    "M9.5 9.5h9a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 19v-8a1.5 1.5 0 0 1 1.5-1.5Z M5.5 15H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 4h8a1.5 1.5 0 0 1 1.5 1.5V6",
  trash:
    "M4 7h16 M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7 M6.5 7l.8 12A1.6 1.6 0 0 0 8.9 20.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.8-12 M10 11v6 M14 11v6",
  warn: "M12 4.5 3.5 19.5h17L12 4.5Z M12 10.5v4 M12 17.4v.1",
  x: "M6.5 6.5l11 11 M17.5 6.5l-11 11",
  plus: "M12 5.5v13 M5.5 12h13",
  arrow: "M7.5 16.5 16.5 7.5 M9 7.5h7.5V15",
  clock: "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Z M12 7.6V12l3 2.2",
};

function IcHandle({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.6" />
          <circle cx="15" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  );
}

function PickerField({ type, value, onChange, min = undefined, placeholder, icon }) {
  return (
    <label
      className="pill relative inline-flex items-center gap-1.5 rounded-full select-none"
      style={{ padding: "7px 12px" }}
    >
      <span aria-hidden="true" className="inline-flex text-sm" style={{ color: C.sub }}>
        {icon}
      </span>
      <span className="tabular-nums text-sm font-medium" style={{ color: value ? C.ink : C.sub }}>
        {value ? (type === "date" ? value.replaceAll("-", "/") : value) : placeholder}
      </span>
      <span className="text-[10px]" style={{ color: C.sub }}>▾</span>
      <input
        type={type}
        value={value || ""}
        min={min}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0"
        style={{ fontSize: 16 }}
        aria-label={placeholder}
      />
    </label>
  );
}

// 分ステッパー
// ※コンポーネント内で定義すると再レンダーごとに再マウントされ、
//   入力中にフォーカスが外れるバグになるため必ずモジュールスコープに置く
// ※type=number だと "011" のような先頭ゼロがReactに上書きされず残るため、
//   テキスト入力+数字サニタイズで管理する
function Stepper({ value, onChange, step = 5, suffix }) {
  const [editing, setEditing] = useState(null); // フォーカス中の生テキスト
  const commit = (raw) => {
    const digits = raw.replace(/[^0-9]/g, "").replace(/^0+(?=[0-9])/, "").slice(0, 4);
    setEditing(digits);
    onChange(Math.max(0, parseInt(digits || "0", 10)));
  };
  const bump = (delta) => {
    setEditing(null);
    onChange(Math.max(0, (Number(value) || 0) + delta));
  };
  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={() => bump(-step)}
        className="pill w-8 h-8 rounded-full text-base leading-none shrink-0"
        style={{ color: C.ink }}
        aria-label="減らす"
      >
        −
      </button>
      <span className="inline-flex items-baseline whitespace-nowrap">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={editing !== null ? editing : String(value)}
          placeholder={String(value)}
          onFocus={() => setEditing("")}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(null)}
          className="w-8 text-center tabular-nums bg-transparent font-bold"
          style={{ color: C.ink }}
          aria-label="分を入力"
        />
        <span className="text-sm font-medium" style={{ color: C.ink }}>{suffix}</span>
      </span>
      <button
        onClick={() => bump(step)}
        className="pill w-8 h-8 rounded-full text-base leading-none shrink-0"
        style={{ color: C.ink }}
        aria-label="増やす"
      >
        ＋
      </button>
    </span>
  );
}

// 編集/当日トグル: 編集=黒、当日=青のピル
function ModeToggle({ mode, onSelect }) {
  return (
    <div className="pill flex rounded-full p-1">
      {[
        { id: "edit", label: "編集" },
        { id: "day", label: "当日" },
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="px-5 py-2 rounded-full text-sm font-bold"
          style={
            mode === m.id
              ? {
                  background: m.id === "day" ? C.key : C.black,
                  color: "#fff",
                  boxShadow:
                    m.id === "day"
                      ? "0 6px 14px rgba(32,0,255,0.3)"
                      : "0 6px 14px rgba(17,17,17,0.25)",
                }
              : { color: C.sub }
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// 注意バナー: 丸いアイコン + テキスト
function Notice({ children }) {
  return (
    <div className="flex items-center gap-4 p-4 mb-5" style={{ ...PANEL, borderRadius: 26 }}>
      <span
        className="pill w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ color: C.key }}
      >
        <Ic d={IC.warn} size={22} />
      </span>
      <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
        {children}
      </p>
    </div>
  );
}

export default function TabiShiori() {
  const [index, setIndex] = useState([]); // 旅程一覧メタ
  const [currentId, setCurrentId] = useState(null);
  const [trip, setTrip] = useState(null);
  const [mode, setMode] = useState("edit"); // 'edit' | 'day'
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [addingDay, setAddingDay] = useState(null); // 追加入力を開いている日
  const [copied, setCopied] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [viewerSrc, setViewerSrc] = useState(null); // 写真の拡大表示

  const [storageOk, setStorageOk] = useState(true);
  const [bkCopied, setBkCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState(false);
  const [deleteArm, setDeleteArm] = useState(null); // 削除の2段階確認
  const tripsCache = useRef({});

  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef(null);
  const pressTimer = useRef(null); // 長押し判定タイマー
  const rowRefs = useRef({});
  const fileRefs = useRef({});

  // ── 初期ロード(旧単一旅程データからの移行含む) ──
  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          let idx = null;
          try {
            const r = await window.storage.get("tabi-index");
            if (r?.value) idx = JSON.parse(r.value);
          } catch (_) {}
          if (!idx) {
            // 旧形式からの移行
            let legacy = null;
            try {
              const r = await window.storage.get("tabi-trip");
              if (r?.value) legacy = JSON.parse(r.value);
            } catch (_) {}
            if (legacy) {
              const t = legacy.days
                ? legacy
                : {
                    title: legacy.title || "無題の旅",
                    startDate: legacy.date || "",
                    endDate: legacy.date || "",
                    days: {
                      0: { startTime: legacy.startTime || "09:00", spots: legacy.spots || [] },
                    },
                  };
              const id = uid();
              await window.storage.set(`trip:${id}`, JSON.stringify(t));
              idx = [
                {
                  id,
                  title: t.title,
                  startDate: t.startDate,
                  endDate: t.endDate,
                  thumb: firstPhoto(t),
                  updatedAt: Date.now(),
                },
              ];
              await window.storage.set("tabi-index", JSON.stringify(idx));
            } else {
              idx = [];
            }
          }
          setIndex(idx);
          // 保存が実際に効くかテスト書き込み
          try {
            await window.storage.set("tabi-probe", String(Date.now()));
          } catch (_) {
            setStorageOk(false);
          }
        } else {
          setStorageOk(false);
        }
      } catch (_) {
        setStorageOk(false);
      }
      setLoaded(true);
    })();
  }, []);

  // ── 旅程の保存 + 一覧メタの更新 ──
  useEffect(() => {
    if (!loaded || !currentId || !trip) return;
    tripsCache.current[currentId] = trip;
    (async () => {
      try {
        if (window.storage) {
          await window.storage.set(`trip:${currentId}`, JSON.stringify(trip));
          setSaveErr(false);
          setStorageOk(true);
        }
      } catch (_) {
        setSaveErr(JSON.stringify(trip).length > 200000);
        setStorageOk(false);
      }
    })();
    setIndex((idx) => {
      const next = idx.map((m) =>
        m.id === currentId
          ? {
              ...m,
              title: trip.title,
              startDate: trip.startDate,
              endDate: trip.endDate,
              thumb: firstPhoto(trip),
              updatedAt: Date.now(),
            }
          : m
      );
      return next;
    });
  }, [trip, currentId, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        if (window.storage) await window.storage.set("tabi-index", JSON.stringify(index));
      } catch (_) {}
    })();
  }, [index, loaded]);

  // ── 当日モード用: 30秒ごとに現在時刻を更新 ──
  useEffect(() => {
    if (mode !== "day") return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [mode]);

  // ── 旅程一覧の操作 ──
  const openTrip = async (id) => {
    try {
      if (window.storage) {
        const r = await window.storage.get(`trip:${id}`);
        if (r?.value) {
          setTrip(JSON.parse(r.value));
          setCurrentId(id);
          setMode("edit");
          setOpenId(null);
          return;
        }
      }
    } catch (_) {}
    // storageから読めなければメモリ内キャッシュ、それもなければ空で開く
    setTrip(tripsCache.current[id] || newTrip());
    setCurrentId(id);
    setMode("edit");
  };

  const createTrip = async () => {
    const id = uid();
    const t = newTrip();
    tripsCache.current[id] = t;
    try {
      if (window.storage) await window.storage.set(`trip:${id}`, JSON.stringify(t));
    } catch (_) {}
    setIndex((idx) => [
      { id, title: t.title, startDate: "", endDate: "", thumb: null, updatedAt: Date.now() },
      ...idx,
    ]);
    setTrip(t);
    setCurrentId(id);
    setMode("edit");
  };

  const duplicateTrip = async (id) => {
    try {
      let src = tripsCache.current[id] || null;
      if (!src && window.storage) {
        try {
          const r = await window.storage.get(`trip:${id}`);
          if (r?.value) src = JSON.parse(r.value);
        } catch (_) {}
      }
      if (!src) return;
      const copy = { ...src, title: `${src.title} のコピー` };
      const nid = uid();
      tripsCache.current[nid] = copy;
      try {
        if (window.storage) await window.storage.set(`trip:${nid}`, JSON.stringify(copy));
      } catch (_) {}
      setIndex((idx) => [
        {
          id: nid,
          title: copy.title,
          startDate: copy.startDate,
          endDate: copy.endDate,
          thumb: firstPhoto(copy),
          updatedAt: Date.now(),
        },
        ...idx,
      ]);
    } catch (_) {}
  };

  const deleteTrip = async (id) => {
    if (deleteArm !== id) {
      setDeleteArm(id);
      setTimeout(() => setDeleteArm((v) => (v === id ? null : v)), 3000);
      return;
    }
    setDeleteArm(null);
    try {
      if (window.storage) await window.storage.delete(`trip:${id}`);
    } catch (_) {}
    setIndex((idx) => idx.filter((m) => m.id !== id));
    if (currentId === id) {
      setCurrentId(null);
      setTrip(null);
    }
  };

  const exportBackup = async () => {
    const trips = { ...tripsCache.current };
    for (const m of index) {
      if (!trips[m.id] && window.storage) {
        try {
          const r = await window.storage.get(`trip:${m.id}`);
          if (r?.value) trips[m.id] = JSON.parse(r.value);
        } catch (_) {}
      }
    }
    const payload = JSON.stringify({ v: 1, index, trips });
    navigator.clipboard?.writeText(payload).then(() => {
      setBkCopied(true);
      setTimeout(() => setBkCopied(false), 1800);
    });
  };

  const importBackup = async () => {
    try {
      const d = JSON.parse(importText.trim());
      if (!d.index || !d.trips) throw new Error("bad");
      setIndex(d.index);
      tripsCache.current = { ...tripsCache.current, ...d.trips };
      for (const m of d.index) {
        try {
          if (window.storage && d.trips[m.id])
            await window.storage.set(`trip:${m.id}`, JSON.stringify(d.trips[m.id]));
        } catch (_) {}
      }
      setImportOpen(false);
      setImportText("");
      setImportErr(false);
    } catch (_) {
      setImportErr(true);
    }
  };

  const backToHome = () => {
    setCurrentId(null);
    setTrip(null);
    setOpenId(null);
    setAddingDay(null);
  };

  const switchMode = (id) => {
    setMode(id);
    setOpenId(null);
    setNow(Date.now());
  };

  // ── 旅程内の操作 ──
  const nDays = trip ? dayCount(trip) : 1;
  const getDay = (t, i) => t.days[i] || newDay();

  const set = (patch) => setTrip((t) => ({ ...t, ...patch }));
  const setDay = (i, patch) =>
    setTrip((t) => ({ ...t, days: { ...t.days, [i]: { ...getDay(t, i), ...patch } } }));
  const setSpot = (dayIdx, id, patch) =>
    setTrip((t) => {
      const d = getDay(t, dayIdx);
      return {
        ...t,
        days: {
          ...t.days,
          [dayIdx]: { ...d, spots: d.spots.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
        },
      };
    });

  const addSpot = (dayIdx) => {
    const name = (drafts[dayIdx] || "").trim();
    if (!name) return;
    setTrip((t) => {
      const d = getDay(t, dayIdx);
      return { ...t, days: { ...t.days, [dayIdx]: { ...d, spots: [...d.spots, newSpot(name)] } } };
    });
    setDrafts((d) => ({ ...d, [dayIdx]: "" }));
  };

  const removeSpot = (dayIdx, id) =>
    setTrip((t) => {
      const d = getDay(t, dayIdx);
      return {
        ...t,
        days: { ...t.days, [dayIdx]: { ...d, spots: d.spots.filter((s) => s.id !== id) } },
      };
    });

  const moveSpotToDay = (from, id, to) => {
    if (from === to) return;
    setTrip((t) => {
      const fd = getDay(t, from);
      const spot = fd.spots.find((s) => s.id === id);
      if (!spot) return t;
      const td = getDay(t, to);
      return {
        ...t,
        days: {
          ...t.days,
          [from]: { ...fd, spots: fd.spots.filter((s) => s.id !== id) },
          [to]: { ...td, spots: [...td.spots, spot] },
        },
      };
    });
  };

  const addPhoto = async (dayIdx, id, files) => {
    const spot = getDay(trip, dayIdx).spots.find((s) => s.id === id);
    if (!spot) return;
    const room = 6 - spot.photos.length;
    const picked = Array.from(files).slice(0, room);
    const urls = [];
    for (const f of picked) {
      try {
        urls.push(await compressImage(f));
      } catch (_) {}
    }
    if (urls.length) setSpot(dayIdx, id, { photos: [...spot.photos, ...urls] });
  };

  // ── D&D: 誤タッチ防止のため長押し(250ms)でドラッグ開始 ──
  // 確定後は window でイベントを拾うため、指がハンドルから外れても追従する
  // (iOS では小さな要素の setPointerCapture が不安定で、move を取りこぼすため)
  const detachDrag = () => {
    const d = dragRef.current;
    if (d?.moveHandler) {
      window.removeEventListener("pointermove", d.moveHandler);
      window.removeEventListener("pointerup", d.upHandler);
      window.removeEventListener("pointercancel", d.upHandler);
    }
  };

  const onDragStart = (e, dayIdx, id) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const moveHandler = (ev) => {
      const d = dragRef.current;
      if (!d || !d.armed) return;
      ev.preventDefault?.();
      const y = ev.clientY;
      d.lastY = y;
      const offset = y - d.startY;
      setDragOffset(offset);
      setTrip((t) => {
        const day = getDay(t, d.dayIdx);
        const idx = day.spots.findIndex((s) => s.id === d.id);
        if (idx < 0) return t;
        const check = (dir) => {
          const j = idx + dir;
          if (j < 0 || j >= day.spots.length) return false;
          const el = rowRefs.current[day.spots[j].id];
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return dir < 0 ? y < r.top + r.height / 2 : y > r.top + r.height / 2;
        };
        let dir = 0;
        if (offset < 0 && check(-1)) dir = -1;
        else if (offset > 0 && check(1)) dir = 1;
        if (dir === 0) return t;
        const arr = [...day.spots];
        [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
        d.startY = y;
        setDragOffset(0);
        return { ...t, days: { ...t.days, [d.dayIdx]: { ...day, spots: arr } } };
      });
    };
    const upHandler = () => onDragEnd();

    dragRef.current = {
      id,
      dayIdx,
      startY,
      sx: startX,
      sy: startY,
      lastY: startY,
      armed: false,
      moveHandler,
      upHandler,
    };

    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      const d = dragRef.current;
      if (!d || d.id !== id) return;
      d.armed = true;
      d.startY = d.lastY;
      setDragId(id);
      setDragOffset(0);
      setOpenId(null);
      window.addEventListener("pointermove", moveHandler, { passive: false });
      window.addEventListener("pointerup", upHandler);
      window.addEventListener("pointercancel", upHandler);
    }, 250);
  };

  // 長押し成立前のプレ移動: 大きく動いたらスクロール等とみなしキャンセル
  const onHandleMove = (e) => {
    const d = dragRef.current;
    if (!d || d.armed) return;
    d.lastY = e.clientY;
    if (Math.abs(e.clientY - d.sy) > 10 || Math.abs(e.clientX - d.sx) > 10) {
      clearTimeout(pressTimer.current);
      detachDrag();
      dragRef.current = null;
    }
  };

  const onDragEnd = () => {
    clearTimeout(pressTimer.current);
    detachDrag();
    dragRef.current = null;
    setDragId(null);
    setDragOffset(0);
  };

  // ── 時刻カスケード ──
  const dayTimes = (day) => {
    const times = [];
    let cursor = day.startTime || "09:00";
    let carry = false;
    day.spots.forEach((s) => {
      if (s.fixedArrival) {
        cursor = s.fixedArrival;
        carry = false;
      }
      const arr = { text: cursor, nextDay: carry };
      const dep = addMin(cursor, Number(s.stay) || 0);
      times.push({ arrive: arr, depart: { text: dep.text, nextDay: carry || dep.nextDay } });
      const next = addMin(dep.text, Number(s.travel.minutes) || 0);
      carry = carry || dep.nextDay || next.nextDay;
      cursor = next.text;
    });
    return times;
  };

  // ── テキスト共有 ──
  const shareText = () => {
    const range = trip.startDate
      ? `（${trip.startDate.replaceAll("-", "/")}${
          trip.endDate && trip.endDate !== trip.startDate
            ? `〜${trip.endDate.replaceAll("-", "/")}`
            : ""
        }）`
      : "";
    const lines = [`📖 ${trip.title}${range}`];
    for (let i = 0; i < nDays; i++) {
      const day = getDay(trip, i);
      const times = dayTimes(day);
      lines.push("", `── Day ${i + 1} ${dateLabel(trip, i)} ──`);
      day.spots.forEach((s, j) => {
        const t = times[j];
        lines.push(
          (Number(s.stay) || 0) > 0
            ? `${t.arrive.nextDay ? "翌" : ""}${t.arrive.text}〜${t.depart.nextDay ? "翌" : ""}${t.depart.text}　${s.name}`
            : `${t.arrive.nextDay ? "翌" : ""}${t.arrive.text}　${s.name}（経由）`
        );
        if (s.memo) lines.push(`　✎ ${s.memo}`);
        if (j < day.spots.length - 1) {
          const m = MODES.find((m) => m.id === s.travel.mode);
          lines.push(`　↓ ${m.icon}${m.label} ${s.travel.minutes}分`);
        }
      });
      if (day.spots.length === 0) lines.push("（予定なし）");
    }
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const nowDate = new Date(now);
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const nowText = `${String(nowDate.getHours()).padStart(2, "0")}:${String(
    nowDate.getMinutes()
  ).padStart(2, "0")}`;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        color: C.ink,
        background: `linear-gradient(165deg, #F3F5FC 0%, #EAEDF8 45%, #F1EBF7 100%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="fixed -top-24 -left-16 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "#7FA8FF", opacity: 0.2, filter: "blur(80px)" }}
      />
      <div
        aria-hidden="true"
        className="fixed top-1/3 -right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "#FFB37F", opacity: 0.16, filter: "blur(90px)" }}
      />
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-1/4 w-96 h-72 rounded-full pointer-events-none"
        style={{ background: "#2000FF", opacity: 0.08, filter: "blur(100px)" }}
      />

      <style>{`
        .shiori, .shiori * {
          font-family: "Yu Gothic", "YuGothic", "游ゴシック", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
        }
        .shiori input, .shiori textarea { font-size: 16px; outline: none; }
        .shiori input:focus, .shiori textarea:focus { box-shadow: 0 0 0 2px ${C.keySoft}; border-radius: 6px; }
        .shiori .pill {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.95);
          box-shadow: 0 6px 16px rgba(99,110,160,0.13), inset 0 1px 1px #fff;
        }
        .shiori button.pill:active {
          box-shadow: inset 2px 2px 6px rgba(99,110,160,0.2), inset -2px -2px 6px rgba(255,255,255,0.9);
        }
        .shiori .handle {
          touch-action: none;
          cursor: grab;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .shiori .handle:active { cursor: grabbing; }
        /* ドラッグ中はページ全体の選択・スクロールを止める(iOSの誤爆防止) */
        .shiori.dragging-active, .shiori.dragging-active * {
          -webkit-user-select: none;
          user-select: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          .shiori .row { transition: transform .12s ease; }
          .shiori .row.dragging { transition: none; }
        }
      `}</style>

      <div
        className={`shiori relative max-w-md mx-auto px-5 pt-7 pb-20 ${
          dragId ? "dragging-active" : ""
        }`}
      >
        {/* ════════ ホーム: 旅程一覧 ════════ */}
        {!trip && (
          <>
            <div className="text-center pt-6 mb-9">
              <h1 className="flex items-center justify-center gap-3">
                <Logo size={56} />
                <LogoType height={40} />
              </h1>
              <p className="text-sm mt-4" style={{ color: C.sub, letterSpacing: "0.18em" }}>
                旅の計画を、時間からデザインする。
              </p>
            </div>

            {importOpen && (
              <div className="p-4 mb-5" style={{ ...PANEL, borderRadius: 26 }}>
                <p className="text-sm mb-2">「書き出し」でコピーしたテキストを貼り付けてください</p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={3}
                  placeholder='{"v":1,"index":[...],"trips":{...}}'
                  className="w-full p-3 rounded-2xl resize-none"
                  style={{ background: "rgba(255,255,255,0.8)", color: C.ink, border: `1px solid ${C.border}` }}
                />
                {importErr && (
                  <p className="text-xs mt-1 font-bold">
                    ⚠ 読み込めませんでした。書き出したテキストをそのまま貼り付けてください。
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={importBackup}
                    disabled={!importText.trim()}
                    className="px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-40"
                    style={{ background: C.key, color: "#fff", boxShadow: "0 8px 18px rgba(32,0,255,0.28)" }}
                  >
                    復元する
                  </button>
                  <button
                    onClick={() => {
                      setImportOpen(false);
                      setImportText("");
                      setImportErr(false);
                    }}
                    className="pill px-5 py-2.5 rounded-full text-sm font-medium"
                    style={{ color: C.ink }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {!storageOk && loaded && (
              <div className="p-4 mb-5" style={{ ...PANEL, borderRadius: 26 }}>
                <div className="flex items-center gap-4">
                  <span
                    className="pill w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ color: C.key }}
                  >
                    <Ic d={IC.warn} size={22} />
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
                    この環境ではデータの保存が動作していません。アプリを閉じると旅程が消えるため、作業後に「書き出し」でバックアップをコピーし、メモ帳などに貼って保管してください。次回「読み込み」で復元できます。
                  </p>
                </div>
                <div className="flex gap-2.5 mt-3.5 pl-16">
                  <button
                    onClick={exportBackup}
                    className="pill px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5"
                    style={{ color: C.ink }}
                  >
                    <Ic d={IC.upload} size={14} />
                    {bkCopied ? "コピーした ✓" : "書き出し"}
                  </button>
                  <button
                    onClick={() => {
                      setImportOpen((v) => !v);
                      setImportErr(false);
                    }}
                    className="pill px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5"
                    style={{
                      color: C.ink,
                      ...(importOpen ? { border: `1px solid ${C.ink}` } : {}),
                    }}
                  >
                    <Ic d={IC.download} size={14} />
                    読み込み
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={createTrip}
              className="w-full py-5 mb-7 text-lg font-bold rounded-full inline-flex items-center justify-center gap-2.5"
              style={{
                background: C.key,
                color: "#fff",
                boxShadow:
                  "0 16px 34px rgba(32,0,255,0.32), inset 0 1.5px 1px rgba(255,255,255,0.4)",
              }}
            >
              <Ic d={IC.plus} size={20} sw={2.4} />
              新しい旅をつくる
            </button>

            {loaded && index.length === 0 && (
              <p className="text-center text-sm py-10" style={{ color: C.sub }}>
                まだ旅程がありません。最初の旅をつくってみてください
              </p>
            )}

            {index.map((m) => (
              <div
                key={m.id}
                onClick={() => openTrip(m.id)}
                className="p-5 mb-5 cursor-pointer"
                style={PANEL}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(145deg,#EDF0FB,#DFE4F4)",
                      border: "2px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 6px 14px rgba(96,106,160,0.15)",
                    }}
                  >
                    {m.thumb ? (
                      <img src={m.thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Logo size={36} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xl leading-snug line-clamp-2">{m.title}</div>
                    <div className="text-sm mt-1.5" style={{ color: C.sub }}>
                      {rangeLabel(m)}
                      {m.startDate &&
                        m.endDate &&
                        m.endDate !== m.startDate &&
                        ` ・ ${dayCount(m) - 1}泊${dayCount(m)}日`}
                    </div>
                  </div>
                </div>
                <div
                  className="border-t border-dashed my-4"
                  style={{ borderColor: "rgba(138,147,166,0.4)" }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTrip(m.id);
                    }}
                    className="pill flex-1 py-3 rounded-full text-sm font-medium inline-flex items-center justify-center gap-1.5"
                    style={{ color: C.ink }}
                  >
                    <Ic d={IC.copy} size={15} />
                    複製
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrip(m.id);
                    }}
                    className={`flex-1 py-3 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      deleteArm === m.id ? "" : "pill"
                    }`}
                    style={
                      deleteArm === m.id
                        ? {
                            background: C.danger,
                            color: "#fff",
                            boxShadow: "0 8px 18px rgba(229,72,77,0.3)",
                          }
                        : { color: C.danger }
                    }
                  >
                    <Ic d={IC.trash} size={15} />
                    {deleteArm === m.id ? "もう一度タップ" : "削除"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ════════ 旅程画面 ════════ */}
        {trip && (
          <>
            {/* 上部バー: ×＋ロゴ｜テキストで共有 */}
            <div className="relative flex items-center justify-between gap-2 mb-7">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={backToHome}
                  className="pill w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ color: C.ink }}
                  aria-label="一覧へ戻る"
                >
                  <Ic d={IC.x} size={18} sw={2} />
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Logo size={26} />
                  <LogoType height={20} />
                </div>
              </div>
              <button
                onClick={shareText}
                className="pill h-11 px-4 rounded-full flex items-center gap-1.5 shrink-0 text-sm font-medium whitespace-nowrap"
                style={{ color: copied ? C.key : C.ink }}
                aria-label="テキストで共有"
              >
                {copied ? (
                  <>
                    <span className="text-base font-bold leading-none">✓</span>
                    コピーした
                  </>
                ) : (
                  <>
                    <Ic d={IC.upload} size={16} />
                    テキストで共有
                  </>
                )}
              </button>
            </div>

            {/* ヘッダー: 編集=素のまま / 当日=カードにまとめる */}
            {mode === "edit" ? (
              <header className="mb-5">
                <input
                  value={trip.title}
                  onChange={(e) => set({ title: e.target.value })}
                  className="text-3xl font-bold bg-transparent w-full min-w-0"
                  style={{ color: C.ink }}
                  placeholder="旅のタイトル"
                />

                <div className="flex items-center gap-2 mt-5 flex-wrap">
                  <PickerField
                    type="date"
                    icon="📅"
                    placeholder="----/--/--"
                    value={trip.startDate}
                    onChange={(e) =>
                      set({
                        startDate: e.target.value,
                        endDate:
                          trip.endDate && trip.endDate >= e.target.value
                            ? trip.endDate
                            : e.target.value,
                      })
                    }
                  />
                  <span style={{ color: C.sub }}>〜</span>
                  <PickerField
                    type="date"
                    icon="📅"
                    placeholder="----/--/--"
                    value={trip.endDate}
                    min={trip.startDate || undefined}
                    onChange={(e) => set({ endDate: e.target.value })}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <ModeToggle mode={mode} onSelect={switchMode} />
                </div>
              </header>
            ) : (
              <header className="p-5 mb-5" style={PANEL}>
                <div className="text-2xl font-bold leading-snug break-words">{trip.title}</div>
                <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
                  <span className="text-base font-medium" style={{ color: C.sub }}>
                    {rangeLabel(trip)}
                  </span>
                  <ModeToggle mode={mode} onSelect={switchMode} />
                </div>
              </header>
            )}

            {saveErr && (
              <Notice>保存に失敗しました（容量オーバーの可能性）。写真を減らしてみてください。</Notice>
            )}

            {/* 編集モードは大きなパネルにまとめ、当日モードは背景に直接置く */}
            <div style={mode === "edit" ? { ...PANEL, padding: "0 16px 24px" } : undefined}>
              {Array.from({ length: nDays }).map((_, dayIdx) => {
                const day = getDay(trip, dayIdx);
                const times = dayTimes(day);
                const isToday = isoOfDay(trip, dayIdx) === todayIso();

                // 当日モードの現在地: いま滞在中のスポット / 現在時刻ラインの位置
                let activeIdx = -1;
                let lineIdx = -1;
                if (mode === "day" && isToday) {
                  activeIdx = day.spots.findIndex((s, i) => {
                    const a = toMin(times[i].arrive.text);
                    const d2 = toMin(times[i].depart.text);
                    return a <= nowMin && nowMin < Math.max(d2, a + 1);
                  });
                  if (activeIdx < 0) {
                    lineIdx = day.spots.findIndex((s, i) => toMin(times[i].arrive.text) > nowMin);
                  }
                }

                return (
                  <section key={dayIdx}>
                    {/* 日区切り */}
                    <div className="flex items-center gap-x-2.5 gap-y-2 pt-7 pb-4 flex-wrap">
                      <span
                        className={`font-bold text-white whitespace-nowrap shrink-0 ${
                          mode === "day" ? "text-base px-3.5 py-1 rounded-xl" : "text-sm px-3 py-0.5 rounded-lg"
                        }`}
                        style={{
                          background: isToday && mode === "day" ? C.key : C.ink,
                          boxShadow:
                            isToday && mode === "day"
                              ? "0 6px 14px rgba(32,0,255,0.3)"
                              : "none",
                        }}
                      >
                        Day {dayIdx + 1}
                      </span>
                      <span
                        className={`whitespace-nowrap ${
                          mode === "day" ? "text-2xl font-bold" : "text-base font-bold"
                        }`}
                      >
                        {dateLabel(trip, dayIdx)}
                      </span>
                      {mode === "edit" && (
                        <span
                          className="ml-auto flex items-center gap-2 text-xs whitespace-nowrap"
                          style={{ color: C.sub }}
                        >
                          この日の出発
                          <PickerField
                            type="time"
                            icon={<Ic d={IC.clock} size={15} />}
                            placeholder="--:--"
                            value={day.startTime}
                            onChange={(e) => setDay(dayIdx, { startTime: e.target.value })}
                          />
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      {/* 編集モード: 通しの細いタイムライン */}
                      {mode === "edit" && day.spots.length > 0 && (
                        <div
                          className="absolute left-[11px] top-4 bottom-4 w-[2px] rounded-full"
                          style={{ background: "rgba(32,0,255,0.25)" }}
                        />
                      )}

                      {day.spots.map((s, i) => {
                        const t = times[i];
                        const isOpen = openId === s.id;
                        const isLast = i === day.spots.length - 1;
                        const isDragging = dragId === s.id;
                        const isActive = i === activeIdx;
                        const nextName = !isLast ? day.spots[i + 1].name : null;
                        const travelMode = MODES.find((m) => m.id === s.travel.mode);
                        const isVia = (Number(s.stay) || 0) === 0;
                        // 当日モードの点の色: 通過済み/滞在中=青、未来=グレー
                        const passed =
                          mode === "day" && isToday && toMin(t.arrive.text) <= nowMin;
                        const ringColor =
                          mode === "day"
                            ? isActive || passed
                              ? C.key
                              : "#B9C2D8"
                            : C.key;

                        return (
                          <div key={s.id} ref={(el) => (rowRefs.current[s.id] = el)}>
                            {/* ── 現在時刻ライン ── */}
                            {mode === "day" && i === lineIdx && (
                              <div className="relative pl-9 my-3 flex items-center gap-2">
                                <div
                                  className="absolute left-[3px] w-[12px] h-[12px] rounded-full"
                                  style={{ background: C.key }}
                                />
                                <div className="flex-1 h-[2px] rounded" style={{ background: C.key }} />
                                <span className="text-sm font-bold shrink-0" style={{ color: C.key }}>
                                  いま {nowText}
                                </span>
                              </div>
                            )}

                            {/* ════ 当日モードのスポット ════ */}
                            {mode === "day" ? (
                              <div className="relative pl-9">
                                {/* 滞在区間は実線 */}
                                <div
                                  className="absolute left-[8px] w-[2px]"
                                  style={{
                                    background: "rgba(32,0,255,0.22)",
                                    top: i === 0 ? 30 : 0,
                                    bottom: isLast ? undefined : 0,
                                    height: isLast ? (i === 0 ? 0 : 30) : undefined,
                                  }}
                                />
                                <div
                                  className="absolute left-0 top-4 w-[18px] h-[18px] rounded-full"
                                  style={{
                                    background: isActive ? C.key : "#fff",
                                    border: `3px solid ${ringColor}`,
                                    boxShadow: "0 2px 6px rgba(96,106,160,0.25)",
                                  }}
                                />
                                <div
                                  className="mb-3 p-5"
                                  style={{
                                    ...CARD,
                                    ...(isActive ? { border: `2px solid ${C.key}` } : {}),
                                  }}
                                >
                                  <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold tabular-nums shrink-0">
                                      {t.arrive.nextDay ? "翌" : ""}
                                      {t.arrive.text}
                                    </span>
                                    <span className="text-lg font-medium min-w-0">{s.name}</span>
                                  </div>
                                  <div className="text-base mt-1.5" style={{ color: C.sub }}>
                                    {isVia
                                      ? "経由"
                                      : `滞在 ${s.stay}分（〜${t.depart.nextDay ? "翌" : ""}${t.depart.text}）`}
                                    {isActive && (
                                      <span
                                        className="ml-2 text-sm font-bold px-2.5 py-0.5 rounded-full"
                                        style={{ background: C.key, color: "#fff" }}
                                      >
                                        いまここ
                                      </span>
                                    )}
                                  </div>
                                  {s.memo && <p className="text-base mt-2 whitespace-pre-wrap">{s.memo}</p>}
                                  {s.photos.length > 0 && (
                                    <div className="flex gap-2.5 mt-3 flex-wrap">
                                      {s.photos.map((p, pi) => (
                                        <img
                                          key={pi}
                                          src={p}
                                          alt=""
                                          className="w-36 h-28 object-cover rounded-2xl"
                                          style={{ boxShadow: "0 6px 14px rgba(96,106,160,0.18)" }}
                                          onClick={() => setViewerSrc(p)}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* 移動区間は破線(レールは外側paddingぶん左へ) */}
                                {!isLast && (
                                  <div className="relative mb-3">
                                    <div
                                      className="absolute top-0 bottom-0"
                                      style={{ left: -28, borderLeft: "2px dashed rgba(32,0,255,0.3)" }}
                                    />
                                    <div
                                      className="flex items-center gap-2.5 py-2 pl-1 pr-1 text-base"
                                      style={{ color: C.ink }}
                                    >
                                      {(Number(s.travel.minutes) || 0) > 0 ? (
                                        <>
                                          <span className="text-xl">{travelMode.icon}</span>
                                          <span className="font-medium">
                                            {travelMode.label} {s.travel.minutes}分
                                          </span>
                                          <a
                                            href={mapsUrl(s.name, nextName, s.travel.mode)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ml-auto underline font-bold py-2 pl-4 inline-flex items-center gap-0.5 whitespace-nowrap shrink-0"
                                            style={{ color: C.key }}
                                          >
                                            経路
                                            <Ic d={IC.arrow} size={15} sw={2.2} />
                                          </a>
                                        </>
                                      ) : (
                                        <span className="text-sm font-medium" style={{ color: C.sub }}>
                                          移動なし
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* ════ 編集モードのスポット ════ */
                              <>
                                <div
                                  className={`row relative pl-8 ${isDragging ? "dragging" : ""}`}
                                  onPointerDown={() => {
                                    if (openId && openId !== s.id) setOpenId(null);
                                  }}
                                  style={{
                                    transform: isDragging ? `translateY(${dragOffset}px)` : "none",
                                    zIndex: isDragging ? 20 : 1,
                                    position: "relative",
                                  }}
                                >
                                  <div
                                    className="absolute left-[6px] top-[26px] w-[12px] h-[12px] rounded-full"
                                    style={{
                                      background: C.key,
                                      border: "2px solid #fff",
                                      boxShadow: "0 2px 5px rgba(32,0,255,0.35)",
                                    }}
                                  />
                                  <div
                                    className="mb-3 overflow-hidden"
                                    style={{
                                      ...CARD,
                                      ...(isDragging
                                        ? {
                                            border: `1.5px solid ${C.key}`,
                                            boxShadow: "0 12px 28px rgba(32,0,255,0.2)",
                                          }
                                        : {}),
                                    }}
                                  >
                                    {/* 1行目: 時刻+スポット名 / 2行目: 経由・滞在ピル(入力欄を潰さない) */}
                                    <div className="flex items-stretch">
                                      <div className="flex-1 min-w-0 pl-4 py-3.5">
                                        <div className="flex items-baseline gap-2.5">
                                          <span
                                            className="tabular-nums text-xl font-bold shrink-0"
                                            onClick={() => setOpenId(isOpen ? null : s.id)}
                                          >
                                            {s.fixedArrival ? "📌" : ""}
                                            {t.arrive.nextDay ? "翌" : ""}
                                            {t.arrive.text}
                                          </span>
                                          <input
                                            value={s.name}
                                            onChange={(e) => setSpot(dayIdx, s.id, { name: e.target.value })}
                                            placeholder="スポット名"
                                            className="flex-1 min-w-0 bg-transparent text-base font-medium"
                                            style={{ color: C.ink }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                          <button
                                            onClick={() =>
                                              setSpot(dayIdx, s.id, { stay: s.stay > 0 ? 0 : 60 })
                                            }
                                            className="shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium"
                                            style={
                                              isVia
                                                ? { background: C.black, color: "#fff" }
                                                : {
                                                    border: `1px solid ${C.border}`,
                                                    color: C.sub,
                                                    background: "rgba(255,255,255,0.7)",
                                                  }
                                            }
                                            aria-label="経由に切り替え"
                                          >
                                            経由
                                          </button>
                                          <button
                                            onClick={() => setOpenId(isOpen ? null : s.id)}
                                            className="shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium tabular-nums"
                                            style={{
                                              border: `1px solid ${C.border}`,
                                              color: C.sub,
                                              background: "rgba(255,255,255,0.7)",
                                            }}
                                          >
                                            {isVia ? "滞在なし" : `滞在 ${s.stay}分`}
                                          </button>
                                          <button
                                            onClick={() => setOpenId(isOpen ? null : s.id)}
                                            className="shrink-0 text-xs px-2.5 py-1.5 rounded-full font-bold"
                                            style={{
                                              border: `1px solid ${isOpen ? C.key : C.border}`,
                                              color: C.key,
                                              background: isOpen ? C.keySoft : "rgba(255,255,255,0.7)",
                                            }}
                                            aria-label="メモ・写真・時刻指定を開閉"
                                          >
                                            詳細 {isOpen ? "▴" : "▾"}
                                          </button>
                                        </div>
                                        {!isOpen && (s.memo || s.photos.length > 0) && (
                                          <div
                                            className="mt-2 text-sm truncate"
                                            style={{ color: C.sub }}
                                            onClick={() => setOpenId(isOpen ? null : s.id)}
                                          >
                                            {s.photos.length > 0 && `📷${s.photos.length} `}
                                            {s.memo}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className="handle flex items-center px-3 py-1 select-none shrink-0"
                                        style={{ color: "#B9C2D8", touchAction: "none" }}
                                        onPointerDown={(e) => onDragStart(e, dayIdx, s.id)}
                                        onPointerMove={onHandleMove}
                                        onPointerUp={onDragEnd}
                                        onPointerCancel={onDragEnd}
                                        aria-label="ドラッグして並び替え"
                                      >
                                        <IcHandle />
                                      </div>
                                    </div>

                                    {isOpen && (
                                      <div className="px-4 pb-4 border-t" style={{ borderColor: "#EAEDF5" }}>
                                        <div className="flex items-center justify-between mt-3.5">
                                          <span className="text-sm" style={{ color: C.sub }}>到着時刻を指定</span>
                                          <span className="flex items-center gap-2">
                                            <PickerField
                                              type="time"
                                              icon={<Ic d={IC.clock} size={15} />}
                                              placeholder="--:--"
                                              value={s.fixedArrival}
                                              onChange={(e) =>
                                                setSpot(dayIdx, s.id, {
                                                  fixedArrival: e.target.value || null,
                                                })
                                              }
                                            />
                                            {s.fixedArrival && (
                                              <button
                                                onClick={() => setSpot(dayIdx, s.id, { fixedArrival: null })}
                                                className="text-xs underline"
                                                style={{ color: C.sub }}
                                              >
                                                解除
                                              </button>
                                            )}
                                          </span>
                                        </div>
                                        <p className="text-xs mt-1.5" style={{ color: C.sub }}>
                                          未指定なら「この日の出発＋滞在＋移動」で自動計算。指定するとここを起点に以降を再計算します。
                                        </p>
                                        <div className="flex items-center justify-between mt-3.5">
                                          <span className="text-sm" style={{ color: C.sub }}>滞在時間</span>
                                          <Stepper
                                            value={s.stay}
                                            suffix="分"
                                            step={5}
                                            onChange={(v) => setSpot(dayIdx, s.id, { stay: v })}
                                          />
                                        </div>

                                        <textarea
                                          value={s.memo}
                                          onChange={(e) => setSpot(dayIdx, s.id, { memo: e.target.value })}
                                          placeholder="メモ（予約番号、食べたいもの…）"
                                          rows={2}
                                          className="w-full mt-3.5 p-3 rounded-2xl resize-none"
                                          style={{
                                            background: "rgba(240,242,250,0.7)",
                                            color: C.ink,
                                            border: "1px solid rgba(255,255,255,0.9)",
                                          }}
                                        />

                                        <div className="flex gap-2 mt-2.5 flex-wrap">
                                          {s.photos.map((p, pi) => (
                                            <div key={pi} className="relative">
                                              <img
                                                src={p}
                                                alt=""
                                                className="w-16 h-16 object-cover rounded-xl"
                                                onClick={() => setViewerSrc(p)}
                                              />
                                              <button
                                                onClick={() =>
                                                  setSpot(dayIdx, s.id, {
                                                    photos: s.photos.filter((_, x) => x !== pi),
                                                  })
                                                }
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs leading-none"
                                                style={{ background: C.black, color: "#fff" }}
                                                aria-label="写真を削除"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                          {s.photos.length < 6 && (
                                            <button
                                              onClick={() => fileRefs.current[s.id]?.click()}
                                              className="w-16 h-16 rounded-xl text-xl"
                                              style={{
                                                border: `1.5px dashed ${C.border}`,
                                                color: C.sub,
                                                background: "rgba(255,255,255,0.5)",
                                              }}
                                              aria-label="写真を追加"
                                            >
                                              ＋
                                            </button>
                                          )}
                                          <input
                                            ref={(el) => (fileRefs.current[s.id] = el)}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                              addPhoto(dayIdx, s.id, e.target.files);
                                              e.target.value = "";
                                            }}
                                          />
                                        </div>

                                        <div className="flex items-center gap-2 mt-3.5 text-xs">
                                          {nDays > 1 && (
                                            <label className="flex items-center gap-1.5" style={{ color: C.sub }}>
                                              日を移動:
                                              <select
                                                value={dayIdx}
                                                onChange={(e) =>
                                                  moveSpotToDay(dayIdx, s.id, Number(e.target.value))
                                                }
                                                className="px-2.5 py-1.5 rounded-full"
                                                style={{
                                                  background: "#fff",
                                                  border: `1px solid ${C.border}`,
                                                  color: C.ink,
                                                }}
                                              >
                                                {Array.from({ length: nDays }).map((_, di) => (
                                                  <option key={di} value={di}>
                                                    Day {di + 1}
                                                  </option>
                                                ))}
                                              </select>
                                            </label>
                                          )}
                                          <button
                                            onClick={() => removeSpot(dayIdx, s.id)}
                                            className="ml-auto px-3.5 py-2 rounded-full font-bold inline-flex items-center gap-1.5"
                                            style={{
                                              color: C.danger,
                                              border: `1px solid ${C.danger}`,
                                              background: "#fff",
                                            }}
                                          >
                                            <Ic d={IC.trash} size={13} />
                                            削除
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!isLast && (
                                  <div className="relative pl-8 pr-1 py-1.5 mb-3">
                                    <div className="flex items-center gap-1.5 text-sm" style={{ color: C.sub }}>
                                      <div className="pill flex rounded-full p-1 shrink-0">
                                        {MODES.map((m) => (
                                          <button
                                            key={m.id}
                                            onClick={() =>
                                              setSpot(dayIdx, s.id, { travel: { ...s.travel, mode: m.id } })
                                            }
                                            className="px-2 py-1.5 rounded-full"
                                            style={{
                                              background: s.travel.mode === m.id ? C.black : "transparent",
                                            }}
                                            aria-label={m.label}
                                          >
                                            {m.icon}
                                          </button>
                                        ))}
                                      </div>
                                      <Stepper
                                        value={s.travel.minutes}
                                        suffix="分"
                                        onChange={(v) =>
                                          setSpot(dayIdx, s.id, { travel: { ...s.travel, minutes: v } })
                                        }
                                      />
                                      {(Number(s.travel.minutes) || 0) > 0 && (
                                        <a
                                          href={mapsUrl(s.name, nextName, s.travel.mode)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ml-auto font-bold inline-flex items-center gap-0.5 whitespace-nowrap shrink-0"
                                          style={{ color: C.key }}
                                        >
                                          経路
                                          <Ic d={IC.arrow} size={15} sw={2.2} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* 予定終了後の現在時刻ライン */}
                      {mode === "day" &&
                        isToday &&
                        activeIdx < 0 &&
                        lineIdx < 0 &&
                        day.spots.length > 0 && (
                          <div className="relative pl-9 my-3 flex items-center gap-2">
                            <div
                              className="absolute left-[3px] w-[12px] h-[12px] rounded-full"
                              style={{ background: C.key }}
                            />
                            <div className="flex-1 h-[2px] rounded" style={{ background: C.key }} />
                            <span className="text-sm font-bold shrink-0" style={{ color: C.key }}>
                              いま {nowText}
                            </span>
                          </div>
                        )}

                      {/* 追加行(編集モードのみ): 点線ピル → タップで入力欄。
                          左インデントをスポットカードに揃える(pl-8) */}
                      {mode === "edit" && (
                        <div className="pt-1 pb-1 pl-8">
                          {addingDay === dayIdx ? (
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                value={drafts[dayIdx] || ""}
                                onChange={(e) => setDrafts((d) => ({ ...d, [dayIdx]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && addSpot(dayIdx)}
                                onFocus={() => setOpenId(null)}
                                onBlur={(e) => {
                                  const v = e.target.value.trim();
                                  if (!v)
                                    setTimeout(
                                      () => setAddingDay((a) => (a === dayIdx ? null : a)),
                                      120
                                    );
                                }}
                                placeholder="スポット名・やること"
                                className="flex-1 min-w-0 px-4 py-3 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.8)",
                                  border: "1px solid rgba(255,255,255,0.95)",
                                  boxShadow: "0 6px 16px rgba(99,110,160,0.13), inset 0 1px 1px #fff",
                                  color: C.ink,
                                }}
                              />
                              <button
                                onClick={() => addSpot(dayIdx)}
                                className="px-5 py-3 rounded-full text-sm font-bold shrink-0"
                                style={{
                                  background: C.key,
                                  color: "#fff",
                                  boxShadow:
                                    "0 8px 18px rgba(32,0,255,0.28), inset 0 1px 1px rgba(255,255,255,0.35)",
                                }}
                              >
                                追加
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingDay(dayIdx)}
                              className="w-full py-3.5 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2"
                              style={{
                                border: "1.5px dashed rgba(32,0,255,0.35)",
                                color: C.key,
                                background: "rgba(255,255,255,0.3)",
                              }}
                            >
                              <Ic d={IC.plus} size={15} sw={2.4} />
                              立ち寄り先を追加
                            </button>
                          )}
                        </div>
                      )}

                      {mode === "day" && day.spots.length === 0 && (
                        <p className="text-sm py-3" style={{ color: C.sub }}>
                          この日の予定はまだありません
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 写真の拡大ビューア ── */}
      {viewerSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,10,22,0.88)", backdropFilter: "blur(6px)" }}
          onClick={() => setViewerSrc(null)}
        >
          <img src={viewerSrc} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button
            className="absolute top-5 right-5 w-11 h-11 rounded-full text-xl leading-none"
            style={{ background: "rgba(255,255,255,0.92)", color: C.ink }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
