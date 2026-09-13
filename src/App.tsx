import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Coffee,
  Percent,
  Wallet,
  Plus,
  Trash2,
  AlertTriangle,
  GripVertical,
  Store,
  User,
  Search,
  Link2,
  X,
  CupSoda,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS & PALETTE (Specialty Cafe Aesthetic)
   ============================================================ */
const C = {
  bg: "#120D0A",
  bgRadialA: "#221711",
  panel: "#1A130E",
  panelAlt: "#221913",
  panelHover: "#281E17",
  border: "#38291F",
  borderSoft: "#291E16",
  accent: "#D2E659", // Matcha Lime
  accentDim: "#96A63C",
  accentBg: "rgba(210, 230, 89, 0.10)",
  text: "#F8F3EA",
  textDim: "#B9A998",
  textFaint: "#7D6D5E",
  bad: "#E57762",
  badBg: "#341D18",
  badBorder: "#562B22",
  good: "#94CF69",
  goodBg: "#1E3317",
  shop: "#E5B342", // Warm Gold
  shopBg: "#2B2011",
  shopBorder: "#5A421C",
  personal: "#7AB2E2", // Soft Sky
  personalBg: "#142230",
  personalBorder: "#27435F",
};

const headingFont = { fontFamily: "'Fraunces', Georgia, serif" };

/* ============================================================
   STANDARD UNITS & AUTO-CONVERSION
   ============================================================ */
const UNIT_PRESETS = [
  { id: "ml", label: "มล. (ml)", packUnit: "มล.", useUnit: "มล.", factor: 1 },
  { id: "l_to_ml", label: "ลิตร ➔ มล.", packUnit: "ลิตร", useUnit: "มล.", factor: 1000 },
  { id: "g", label: "กรัม (g)", packUnit: "กรัม", useUnit: "กรัม", factor: 1 },
  { id: "kg_to_g", label: "กก. ➔ กรัม", packUnit: "กก.", useUnit: "กรัม", factor: 1000 },
  { id: "pcs", label: "ชิ้น / ซอง", packUnit: "ชิ้น", useUnit: "ชิ้น", factor: 1 },
  { id: "oz_to_ml", label: "ออนซ์ (oz ➔ มล.)", packUnit: "oz", useUnit: "มล.", factor: 30 },
];

/* ============================================================
   HELPERS & LOCALSTORAGE
   ============================================================ */
const thb = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const uid = () => Math.random().toString(36).slice(2, 10);

const roundTo = (value, nearest) => {
  if (!nearest || nearest <= 0) return value;
  return Math.ceil(value / nearest) * nearest;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];

function formatMonthYearThai(yyyyMm) {
  if (!yyyyMm || !yyyyMm.includes("-")) return "";
  const [y, m] = yyyyMm.split("-");
  return `${THAI_MONTHS[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
}

function formatDayGroupThai(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const dateObj = new Date(dateStr);
  const dayName = isNaN(dateObj.getDay()) ? "" : `วัน${THAI_DAYS[dateObj.getDay()]}, `;
  return `${dayName}${parseInt(d, 10)} ${THAI_MONTHS[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
}

/* ============================================================
   DATA MODELS & CALCULATION
   ============================================================ */
const newIngredient = (unitType = "ml") => ({
  id: uid(),
  name: "",
  unitType,
  packagePrice: "",
  packageSize: "",
  usedPerCup: "",
});

const newFixedCost = (name = "", cost = "") => ({
  id: uid(),
  name,
  cost,
});

const initialDemoMenu = () => [
  {
    id: "demo-thai-tea",
    name: "ชาไทยเย็นการันต์",
    ingredients: [
      { id: uid(), name: "ใบชาไทยคั่วเข้ม", unitType: "kg_to_g", packagePrice: "240", packageSize: "1", usedPerCup: "16" },
      { id: uid(), name: "นมสดพาสเจอร์ไรส์", unitType: "l_to_ml", packagePrice: "52", packageSize: "1", usedPerCup: "80" },
      { id: uid(), name: "นมข้นหวาน", unitType: "l_to_ml", packagePrice: "68", packageSize: "1", usedPerCup: "30" },
      { id: uid(), name: "นมข้นจืด", unitType: "l_to_ml", packagePrice: "48", packageSize: "1", usedPerCup: "30" },
    ],
    fixedCosts: [
      newFixedCost("แก้ว 16 oz + ฝาโดม + หลอด", "2.80"),
      newFixedCost("น้ำแข็งอนามัย", "1.00"),
      newFixedCost("ถุงหิ้ว / ปลอกสวม", "0.50"),
    ],
    pricingMode: "margin",
    targetPercent: 65,
    manualPrice: "",
    roundTo: 5,
  },
  {
    id: "demo-americano",
    name: "อเมริกาโน่เย็น (House Blend)",
    ingredients: [
      { id: uid(), name: "เมล็ดกาแฟ House Blend", unitType: "kg_to_g", packagePrice: "480", packageSize: "1", usedPerCup: "18" },
      { id: uid(), name: "น้ำกรอง RO", unitType: "l_to_ml", packagePrice: "15", packageSize: "18", usedPerCup: "120" },
    ],
    fixedCosts: [
      newFixedCost("แก้ว PET 16 oz + ฝายกดื่ม", "3.20"),
      newFixedCost("น้ำแข็งอนามัย", "1.00"),
    ],
    pricingMode: "margin",
    targetPercent: 70,
    manualPrice: "",
    roundTo: 5,
  },
];

const newMenuItem = (n = 1) => ({
  id: uid(),
  name: `เมนูใหม่ ${n}`,
  ingredients: [newIngredient("g")],
  fixedCosts: [
    newFixedCost("แก้ว + ฝา + หลอด", "2.50"),
    newFixedCost("น้ำแข็ง", "1.00"),
  ],
  pricingMode: "margin",
  targetPercent: 60,
  manualPrice: "",
  roundTo: 5,
});

function calcSingleIngredient(ing) {
  const price = parseFloat(ing.packagePrice) || 0;
  const size = parseFloat(ing.packageSize) || 0;
  const used = parseFloat(ing.usedPerCup) || 0;
  const unit = UNIT_PRESETS.find((u) => u.id === ing.unitType) || UNIT_PRESETS[0];
  const baseSize = size * unit.factor;

  if (baseSize <= 0) return 0;
  return (price / baseSize) * used;
}

function calcMenuItem(item) {
  const ingredientCost = item.ingredients.reduce(
    (sum, ing) => sum + calcSingleIngredient(ing),
    0
  );

  const fixedCost = item.fixedCosts.reduce(
    (sum, f) => sum + (parseFloat(f.cost) || 0),
    0
  );

  const totalCost = ingredientCost + fixedCost;

  let suggestedPrice = 0;
  const pct = (parseFloat(item.targetPercent) || 0) / 100;
  if (item.pricingMode === "margin") {
    suggestedPrice = pct < 1 ? totalCost / (1 - pct) : 0;
  } else if (item.pricingMode === "markup") {
    suggestedPrice = totalCost * (1 + pct);
  } else {
    suggestedPrice = parseFloat(item.manualPrice) || 0;
  }

  const roundedPrice = roundTo(suggestedPrice, parseFloat(item.roundTo) || 0);
  const finalPrice =
    item.pricingMode === "manual" ? suggestedPrice : roundedPrice || suggestedPrice;

  const profit = finalPrice - totalCost;
  const marginPct = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  const markupPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const costSharePct = finalPrice > 0 ? Math.min(100, (totalCost / finalPrice) * 100) : 100;

  return {
    ingredientCost,
    fixedCost,
    totalCost,
    finalPrice,
    profit,
    marginPct,
    markupPct,
    costSharePct,
  };
}

const SMART_CATEGORIES = {
  shop: [
    { label: "📦 ซื้อวัตถุดิบ/สต็อก", title: "ซื้อวัตถุดิบเข้าร้าน", type: "expense", icon: "📦" },
    { label: "🥤 แพ็กเกจจิ้ง/แก้ว", title: "ซื้อแก้ว-ฝา-หลอด", type: "expense", icon: "🥤" },
    { label: "💡 ค่าน้ำ-ค่าไฟ", title: "ค่าน้ำ/ค่าไฟร้าน", type: "expense", icon: "💡" },
    { label: "🏢 ค่าเช่าที่", title: "ค่าเช่าร้าน/พื้นที่", type: "expense", icon: "🏢" },
    { label: "👥 จ่ายค่าจ้าง", title: "ค่าแรงบาริสต้า/พนักงาน", type: "expense", icon: "👥" },
    { label: "🛵 ค่าขนส่ง/เดลิเวอรี่", title: "ค่าส่งพัสดุ/เดลิเวอรี่", type: "expense", icon: "🛵" },
    { label: "💵 ยอดขายหน้าร้าน", title: "ยอดขายประจำวัน", type: "income", icon: "💵" },
  ],
  personal: [
    { label: "🍱 ค่าอาหาร", title: "อาหารมื้อประจำวัน", type: "expense", icon: "🍱" },
    { label: "☕ กาแฟ/ของหวาน", title: "กาแฟ/ขนมส่วนตัว", type: "expense", icon: "☕" },
    { label: "⛽ ค่าน้ำมัน/เดินทาง", title: "ค่าน้ำมัน/ค่าเดินทาง", type: "expense", icon: "⛽" },
    { label: "🛍️ ช้อปปิ้ง", title: "ซื้อของใช้ส่วนตัว", type: "expense", icon: "🛍️" },
    { label: "🏠 ค่าห้อง/คอนโด", title: "ค่าเช่าห้อง/ผ่อนบ้าน", type: "expense", icon: "🏠" },
    { label: "💰 เงินเดือน/เงินโอน", title: "เงินเดือน/รายได้เสริม", type: "income", icon: "💰" },
  ],
};

/* ============================================================
   MINIMAL COMPONENT ATOMS
   ============================================================ */
function baseInputClasses() {
  return "w-full bg-[#150F0B] border border-[#3A2A1E] focus:border-[#D2E659] focus:ring-1 focus:ring-[#D2E659]/30 outline-none rounded-xl text-sm text-[#F8F3EA] placeholder-[#665445] transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
}

function NumField({
  value,
  onChange,
  placeholder,
  suffix,
  className = "",
  inputClassName = "px-3 py-2.5",
  min,
  step = "any",
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        step={step}
        inputMode="decimal"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${baseInputClasses()} ${inputClassName} ${suffix ? "pr-7" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#827161]">
          {suffix}
        </span>
      )}
    </div>
  );
}

function TextField({ value, onChange, placeholder, className = "", required, type = "text", id }) {
  return (
    <input
      id={id}
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${baseInputClasses()} px-3.5 py-2.5 ${className}`}
    />
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D2E659] ${
        danger
          ? "border-[#562B22] text-[#E57762] hover:bg-[#341D18]"
          : "border-[#3A2A1E] text-[#827161] hover:text-[#D2E659] hover:border-[#D2E659]/50 hover:bg-[#201711]"
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({ icon, title, subtotal, right, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 backdrop-blur-md ${className}`}
      style={{ background: C.panel, borderColor: C.border }}
    >
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#291E16]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{ background: C.accentBg, color: C.accent }}
          >
            {icon}
          </div>
          <h2 className="text-sm font-semibold tracking-wide text-[#F8F3EA]">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {subtotal !== undefined && (
            <div className="text-right">
              <span className="text-[10px] block uppercase tracking-wider text-[#7D6D5E]">
                รวมส่วนนี้
              </span>
              <span className="text-sm font-bold text-[#D2E659]">
                ฿{thb(subtotal)}
              </span>
            </div>
          )}
          {right}
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, strong, tone }) {
  const toneColor =
    tone === "bad" ? C.bad : tone === "good" ? C.good : strong ? C.text : C.textDim;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs sm:text-[13px] text-[#B9A998]">{label}</span>
      <span
        className={strong ? "font-bold" : "font-medium"}
        style={{ color: toneColor, fontSize: strong ? 15 : 13.5 }}
      >
        {value}
      </span>
    </div>
  );
}

function Stepper({ value, onChange, min = 1 }) {
  return (
    <div className="flex items-center gap-1 bg-[#150F0B] p-1 rounded-xl border border-[#3A2A1E]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, (parseInt(value, 10) || min) - 1))}
        className="w-8 h-8 rounded-lg hover:bg-[#2A1E16] flex items-center justify-center text-[#B9A998] transition-colors"
      >
        <Minus size={13} />
      </button>
      <span className="w-9 text-center text-sm font-bold text-[#F8F3EA]">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange((parseInt(value, 10) || min) + 1)}
        className="w-8 h-8 rounded-lg hover:bg-[#2A1E16] flex items-center justify-center text-[#B9A998] transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

/* ============================================================
   PRICING TAB (ตั้งราคาและควบคุมต้นทุน)
   ============================================================ */
function PricingTab({ items, setItems, activeId, setActiveId }) {
  const active = items.find((i) => i.id === activeId) || items[0] || newMenuItem();
  const nextIndex = useRef(items.length + 1);
  const [copied, setCopied] = useState(false);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    const it = newMenuItem(nextIndex.current++);
    setItems((prev) => [...prev, it]);
    setActiveId(it.id);
  };

  const duplicateItem = (src) => {
    const cloned = {
      ...src,
      id: uid(),
      name: `${src.name} (คัดลอก)`,
      ingredients: src.ingredients.map((ing) => ({ ...ing, id: uid() })),
      fixedCosts: src.fixedCosts.map((f) => ({ ...f, id: uid() })),
    };
    setItems((prev) => [...prev, cloned]);
    setActiveId(cloned.id);
  };

  const removeItem = (id) => {
    if (items.length <= 1) return;
    if (!window.confirm("ยืนยันการลบเมนูนี้หรือไม่?")) return;
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      return next.length ? next : [newMenuItem()];
    });
    setActiveId((cur) => {
      if (cur !== id) return cur;
      const rest = items.filter((i) => i.id !== id);
      return rest.length ? rest[0].id : items[0].id;
    });
  };

  const updateIngredient = (itemId, ingId, patch) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              ingredients: it.ingredients.map((ing) =>
                ing.id === ingId ? { ...ing, ...patch } : ing
              ),
            }
      )
    );

  const addIngredient = (itemId) =>
    updateItem(itemId, {
      ingredients: [...items.find((i) => i.id === itemId).ingredients, newIngredient("ml")],
    });

  const removeIngredient = (itemId, ingId) => {
    const it = items.find((i) => i.id === itemId);
    const rest = it.ingredients.filter((i) => i.id !== ingId);
    updateItem(itemId, { ingredients: rest.length ? rest : [newIngredient("ml")] });
  };

  const updateFixed = (itemId, fId, patch) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              fixedCosts: it.fixedCosts.map((f) => (f.id === fId ? { ...f, ...patch } : f)),
            }
      )
    );

  const addFixed = (itemId) =>
    updateItem(itemId, {
      fixedCosts: [...items.find((i) => i.id === itemId).fixedCosts, newFixedCost()],
    });

  const removeFixed = (itemId, fId) => {
    const it = items.find((i) => i.id === itemId);
    updateItem(itemId, { fixedCosts: it.fixedCosts.filter((f) => f.id !== fId) });
  };

  const results = useMemo(() => {
    const map = {};
    items.forEach((it) => (map[it.id] = calcMenuItem(it)));
    return map;
  }, [items]);

  const activeResult = results[active.id] || calcMenuItem(active);

  const handleCopySummary = async () => {
    const summary = `☕ สรุปสูตรและราคาขาย: ${active.name || "เมนูเครื่องดื่ม"}
━━━━━━━━━━━━━━━━━━
• ต้นทุนวัตถุดิบ: ฿${thb(activeResult.ingredientCost)}
• ต้นทุนคงที่/แก้ว: ฿${thb(activeResult.fixedCost)}
• ต้นทุนรวมต่อแก้ว: ฿${thb(activeResult.totalCost)}
━━━━━━━━━━━━━━━━━━
★ ราคาขายแนะนำ: ฿${thb(activeResult.finalPrice)}
• กำไรต่อแก้ว: ฿${thb(activeResult.profit)} (${thb(activeResult.marginPct)}% GP)
• สัดส่วนต้นทุน: ${thb(activeResult.costSharePct)}%
(คำนวณผ่าน DrinkOps Calculator)`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div>
      {/* Menu selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {items.map((it) => {
          const r = results[it.id];
          const isActive = it.id === active.id;
          return (
            <button
              key={it.id}
              onClick={() => setActiveId(it.id)}
              className="group shrink-0 flex items-center gap-2 pl-4 pr-3 py-2 rounded-2xl text-xs sm:text-sm font-semibold border transition-all duration-150"
              style={
                isActive
                  ? {
                      background: C.accent,
                      borderColor: C.accent,
                      color: C.bg,
                      boxShadow: "0 4px 20px rgba(210, 230, 89, 0.25)",
                    }
                  : {
                      background: C.panel,
                      borderColor: C.border,
                      color: C.textDim,
                    }
              }
            >
              <span>{it.name || "เมนูใหม่"}</span>
              {r && r.finalPrice > 0 && (
                <span
                  className="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                  style={
                    isActive
                      ? { background: "rgba(18, 13, 10, 0.22)", color: C.bg }
                      : { background: C.panelAlt, color: C.accent }
                  }
                >
                  ฿{thb(r.finalPrice)}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={addItem}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold border border-dashed hover:border-[#D2E659] hover:text-[#D2E659] transition-colors"
          style={{ borderColor: C.border, color: C.textDim }}
        >
          <Plus size={15} /> เพิ่มเมนู
        </button>
      </div>

      {/* Active Menu Toolbar */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 mb-6 rounded-2xl border"
        style={{ background: C.panelAlt, borderColor: C.border }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs uppercase tracking-wider text-[#7D6D5E] shrink-0 font-bold">
            ชื่อเมนู:
          </span>
          <input
            type="text"
            value={active.name}
            onChange={(e) => updateItem(active.id, { name: e.target.value })}
            placeholder="เช่น ชาไทยเย็น, อเมริกาโน่ยูสุ"
            className="bg-transparent text-base sm:text-lg font-bold text-[#F8F3EA] focus:outline-none border-b border-transparent focus:border-[#D2E659] px-1 py-0.5 w-full max-w-md transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => duplicateItem(active)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border hover:border-[#D2E659] hover:text-[#D2E659] transition-colors"
            style={{ borderColor: C.border, color: C.textDim, background: C.panel }}
          >
            <Copy size={13} /> คัดลอกเมนู
          </button>
          {items.length > 1 && (
            <button
              onClick={() => removeItem(active.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#562B22] text-[#E57762] hover:bg-[#341D18] transition-colors"
            >
              <Trash2 size={13} /> ลบเมนู
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form Inputs + Sticky Price Summary */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Side: Recipe & Fixed Overheads (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Ingredients */}
          <SectionCard
            icon={<GripVertical size={16} />}
            title="วัตถุดิบและสูตรชง"
            subtotal={activeResult.ingredientCost}
          >
            {/* Desktop Column Header (12 Columns Synchronized) */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 mb-2.5 text-[11px] font-bold text-[#7D6D5E] uppercase tracking-wider items-center">
              <span className="col-span-3">ชื่อวัตถุดิบ</span>
              <span className="col-span-2">หน่วยวัด</span>
              <span className="col-span-2 text-center">ราคา/แพ็ค</span>
              <span className="col-span-1 text-center">ขนาด</span>
              <span className="col-span-1 text-center">ใช้/แก้ว</span>
              <span className="col-span-2 text-right pr-1">ต้นทุน</span>
              <span className="col-span-1 text-center">ลบ</span>
            </div>

            <div className="space-y-3">
              {active.ingredients.map((ing) => {
                const unitCfg =
                  UNIT_PRESETS.find((u) => u.id === ing.unitType) || UNIT_PRESETS[0];
                const rowCost = calcSingleIngredient(ing);

                return (
                  <div
                    key={ing.id}
                    className="p-3 md:p-2.5 rounded-2xl border transition-colors group"
                    style={{ background: "#150F0B", borderColor: C.borderSoft }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      {/* 1. ชื่อวัตถุดิบ (3 cols) */}
                      <div className="md:col-span-3">
                        <span className="md:hidden block text-[11px] font-medium text-[#7D6D5E] mb-1">
                          ชื่อวัตถุดิบ
                        </span>
                        <TextField
                          value={ing.name}
                          onChange={(v) =>
                            updateIngredient(active.id, ing.id, { name: v })
                          }
                          placeholder="เช่น ผงชาไทย, นมสด"
                          className="py-2 px-2.5 text-xs sm:text-sm"
                        />
                      </div>

                      {/* 2. หน่วยวัด (2 cols) */}
                      <div className="md:col-span-2">
                        <span className="md:hidden block text-[11px] font-medium text-[#7D6D5E] mb-1">
                          หน่วยวัด
                        </span>
                        <select
                          value={ing.unitType}
                          onChange={(e) =>
                            updateIngredient(active.id, ing.id, {
                              unitType: e.target.value,
                            })
                          }
                          className="w-full bg-[#150F0B] border border-[#3A2A1E] focus:border-[#D2E659] outline-none rounded-xl px-2 py-2 text-xs text-[#F8F3EA] cursor-pointer truncate"
                        >
                          {UNIT_PRESETS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. ราคาแพ็ค (2 cols) */}
                      <div className="md:col-span-2">
                        <span className="md:hidden block text-[11px] font-medium text-[#7D6D5E] mb-1">
                          ราคาแพ็ค (฿)
                        </span>
                        <NumField
                          value={ing.packagePrice}
                          onChange={(v) =>
                            updateIngredient(active.id, ing.id, { packagePrice: v })
                          }
                          placeholder="฿"
                          inputClassName="py-2 px-2 text-center text-xs sm:text-sm"
                        />
                      </div>

                      {/* 4. ขนาดบรรจุ (1 col) */}
                      <div className="md:col-span-1">
                        <span className="md:hidden block text-[11px] font-medium text-[#7D6D5E] mb-1">
                          ขนาด ({unitCfg.packUnit})
                        </span>
                        <NumField
                          value={ing.packageSize}
                          onChange={(v) =>
                            updateIngredient(active.id, ing.id, { packageSize: v })
                          }
                          placeholder={unitCfg.packUnit}
                          inputClassName="py-2 px-1 text-center text-xs sm:text-sm"
                        />
                      </div>

                      {/* 5. ปริมาณที่ใช้ (1 col) */}
                      <div className="md:col-span-1">
                        <span className="md:hidden block text-[11px] font-medium text-[#7D6D5E] mb-1">
                          ใช้ ({unitCfg.useUnit})
                        </span>
                        <NumField
                          value={ing.usedPerCup}
                          onChange={(v) =>
                            updateIngredient(active.id, ing.id, { usedPerCup: v })
                          }
                          placeholder={unitCfg.useUnit}
                          inputClassName="py-2 px-1 text-center text-xs sm:text-sm"
                        />
                      </div>

                      {/* 6. คำนวณต้นทุน (2 cols) */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end pr-1 pt-2 md:pt-0 border-t md:border-t-0 border-[#241912]">
                        <span className="md:hidden text-xs text-[#7D6D5E]">
                          ต้นทุน:
                        </span>
                        <span className="text-xs font-bold text-[#D2E659] whitespace-nowrap">
                          ฿{thb(rowCost)}
                        </span>
                      </div>

                      {/* 7. ปุ่มลบ (1 col) */}
                      <div className="md:col-span-1 flex justify-end md:justify-center">
                        <IconBtn
                          danger
                          title="ลบวัตถุดิบนี้"
                          onClick={() => removeIngredient(active.id, ing.id)}
                        >
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => addIngredient(active.id)}
              className="mt-4 text-xs font-bold flex items-center gap-1.5 py-1 text-[#D2E659] hover:opacity-80 transition-opacity"
            >
              <Plus size={15} /> เพิ่มวัตถุดิบใหม่
            </button>
          </SectionCard>

          {/* 2. Fixed Costs */}
          <SectionCard
            icon={<Wallet size={16} />}
            title="ต้นทุนคงที่และแพ็กเกจจิ้งต่อแก้ว"
            subtotal={activeResult.fixedCost}
          >
            <div className="space-y-2.5">
              {active.fixedCosts.map((f) => (
                <div
                  key={f.id}
                  className="grid grid-cols-12 gap-2.5 items-center p-2 rounded-2xl border"
                  style={{ background: "#150F0B", borderColor: C.borderSoft }}
                >
                  <div className="col-span-7 sm:col-span-8">
                    <TextField
                      value={f.name}
                      onChange={(v) => updateFixed(active.id, f.id, { name: v })}
                      placeholder="เช่น แก้ว 16 oz + ฝา, หลอด, ค่าไฟเฉลี่ย"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <NumField
                      value={f.cost}
                      onChange={(v) => updateFixed(active.id, f.id, { cost: v })}
                      placeholder="0.00"
                      suffix="฿"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <IconBtn
                      danger
                      title="ลบรายการ"
                      onClick={() => removeFixed(active.id, f.id)}
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addFixed(active.id)}
              className="mt-4 text-xs font-bold flex items-center gap-1.5 py-1 text-[#D2E659] hover:opacity-80 transition-opacity"
            >
              <Plus size={15} /> เพิ่มต้นทุนคงที่
            </button>
          </SectionCard>
        </div>

        {/* Right Side: Pricing Strategy & Sticky Live Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Pricing Mode Selector */}
            <SectionCard icon={<Percent size={16} />} title="กลยุทธ์ตั้งราคาขาย">
              <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 rounded-xl bg-[#140E0A] border border-[#2B1F16]">
                {[
                  { key: "margin", label: "% กำไร (GP)" },
                  { key: "markup", label: "บวกเพิ่ม" },
                  { key: "manual", label: "กำหนดเอง" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => updateItem(active.id, { pricingMode: m.key })}
                    className="py-2 rounded-lg text-xs font-bold transition-all text-center"
                    style={
                      active.pricingMode === m.key
                        ? { background: C.accent, color: C.bg }
                        : { color: C.textDim }
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {active.pricingMode !== "margin" ? (
                active.pricingMode === "markup" ? (
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#B9A998] mb-1.5">
                        <span>เปอร์เซ็นต์บวกเพิ่ม (% Markup)</span>
                      </div>
                      <NumField
                        value={active.targetPercent}
                        onChange={(v) => updateItem(active.id, { targetPercent: v })}
                        suffix="%"
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#B9A998] mb-1.5">
                        ปัดราคาขายขึ้นเป็นเลขทวีคูณของ:
                      </span>
                      <div className="flex items-center gap-2">
                        {[1, 5, 10].map((step) => (
                          <button
                            key={step}
                            onClick={() => updateItem(active.id, { roundTo: step })}
                            className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              Number(active.roundTo) === step
                                ? "border-[#D2E659] text-[#D2E659] bg-[#D2E659]/10"
                                : "border-[#3A2A1E] text-[#B9A998] hover:border-[#D2E659]/40"
                            }`}
                          >
                            ฿{step}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[11px] text-[#B9A998] mb-1.5">
                      ราคาขายหน้าร้านที่ต้องการตรวจสอบ (บาท)
                    </span>
                    <NumField
                      value={active.manualPrice}
                      onChange={(v) => updateItem(active.id, { manualPrice: v })}
                      placeholder="เช่น 55"
                      suffix="฿"
                    />
                  </div>
                )
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#B9A998] mb-1.5">
                      <span>เป้ากำไรขั้นต้น (% GP จากราคาขาย)</span>
                    </div>
                    <NumField
                      value={active.targetPercent}
                      onChange={(v) => updateItem(active.id, { targetPercent: v })}
                      suffix="%"
                    />
                  </div>

                  {/* Fast GP presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7D6D5E]">เป้าหมายแนะนำ:</span>
                    {[50, 60, 65, 70].map((p) => (
                      <button
                        key={p}
                        onClick={() => updateItem(active.id, { targetPercent: p })}
                        className={`text-xs px-2 py-1 rounded-lg border font-semibold transition-all ${
                          Number(active.targetPercent) === p
                            ? "border-[#D2E659] text-[#D2E659] bg-[#D2E659]/10"
                            : "border-[#3A2A1E] text-[#B9A998] hover:border-[#D2E659]/50"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>

                  <div>
                    <span className="block text-[11px] text-[#B9A998] mb-1.5">
                      ปัดราคาขายขึ้นเป็นเลขทวีคูณของ:
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 5, 10].map((step) => (
                        <button
                          key={step}
                          onClick={() => updateItem(active.id, { roundTo: step })}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            Number(active.roundTo) === step
                              ? "border-[#D2E659] text-[#D2E659] bg-[#D2E659]/10"
                              : "border-[#3A2A1E] text-[#B9A998] hover:border-[#D2E659]/40"
                          }`}
                        >
                          ฿{step}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Hero Price & Profit Card */}
            <div
              className="rounded-3xl border p-6 relative overflow-hidden shadow-2xl"
              style={{ background: C.panelAlt, borderColor: C.border }}
            >
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: C.accent }}
              />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B9A998]">
                  {active.pricingMode === "manual" ? "ราคาขายที่ตั้งไว้" : "ราคาขายแนะนำต่อแก้ว"}
                </span>
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border border-[#3A2A1E] hover:border-[#D2E659] text-[#B9A998] hover:text-[#D2E659] transition-all bg-[#150F0B]"
                >
                  {copied ? <Check size={12} className="text-[#94CF69]" /> : <Copy size={12} />}
                  {copied ? "คัดลอกแล้ว!" : "คัดลอกสรุป"}
                </button>
              </div>

              {/* Huge Price Number */}
              <div
                className="text-[44px] sm:text-[50px] leading-tight font-extrabold my-2 relative z-10"
                style={{ ...headingFont, color: C.accent }}
              >
                ฿{thb(activeResult.finalPrice)}
              </div>

              {/* Progress Bar: Cost vs Profit */}
              <div
                className="h-2.5 rounded-full overflow-hidden flex mb-2 relative z-10"
                style={{ background: "#2A1E16" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, activeResult.costSharePct))}%`,
                    background: "#7D6D5E",
                  }}
                />
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, 100 - activeResult.costSharePct))}%`,
                    background: activeResult.profit >= 0 ? C.accent : C.bad,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#7D6D5E] mb-5 relative z-10">
                <span>สัดส่วนต้นทุน {thb(activeResult.costSharePct)}%</span>
                <span>กำไรสุทธิ {thb(100 - activeResult.costSharePct)}%</span>
              </div>

              {/* Cost Rows Breakdown */}
              <div className="space-y-1.5 border-t border-[#312319] pt-4 relative z-10">
                <Row label="ต้นทุนวัตถุดิบต่อแก้ว" value={`฿${thb(activeResult.ingredientCost)}`} />
                <Row label="ต้นทุนคงที่/แพ็กเกจ" value={`฿${thb(activeResult.fixedCost)}`} />
                <Row
                  label="ต้นทุนรวมทั้งหมดต่อแก้ว"
                  value={`฿${thb(activeResult.totalCost)}`}
                  strong
                />
                <div className="h-px my-2" style={{ background: C.borderSoft }} />
                <Row
                  label="กำไรต่อแก้ว"
                  value={`฿${thb(activeResult.profit)}`}
                  tone={activeResult.profit >= 0 ? "good" : "bad"}
                  strong
                />
                <Row
                  label="อัตรากำไรขั้นต้น (GP %)"
                  value={`${thb(activeResult.marginPct)}%`}
                  tone={activeResult.marginPct >= 0 ? "good" : "bad"}
                />
                <Row
                  label="ส่วนบวกจากต้นทุน (Markup %)"
                  value={`${thb(activeResult.markupPct)}%`}
                  tone={activeResult.markupPct >= 0 ? "good" : "bad"}
                />
              </div>

              {activeResult.profit < 0 && (
                <div
                  className="mt-4 text-xs rounded-2xl p-3.5 flex items-start gap-2.5 border relative z-10"
                  style={{ color: C.bad, background: C.badBg, borderColor: C.badBorder }}
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>ขายขาดทุน!</strong> ราคาขายต่ำกว่าต้นทุนรวม กรุณาปรับราคาใหม่
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-menu comparison summary table */}
      {items.length > 1 && (
        <div
          className="mt-10 rounded-3xl border p-5 sm:p-6 overflow-x-auto"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#F8F3EA]">
              เปรียบเทียบทุกเมนู ({items.length} เมนู)
            </h2>
            <span className="text-xs text-[#7D6D5E]">คลิกแถวเพื่อเปิดดูเมนูนั้น</span>
          </div>

          <table className="w-full text-xs sm:text-sm min-w-[560px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#7D6D5E]">
                <th className="pb-3 font-semibold">ชื่อเมนู</th>
                <th className="pb-3 font-semibold text-right">ต้นทุนวัตถุดิบ</th>
                <th className="pb-3 font-semibold text-right">ต้นทุนรวม</th>
                <th className="pb-3 font-semibold text-right">ราคาขาย</th>
                <th className="pb-3 font-semibold text-right">กำไร/แก้ว</th>
                <th className="pb-3 font-semibold text-right">GP %</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const r = results[it.id] || calcMenuItem(it);
                const isActive = it.id === active.id;
                return (
                  <tr
                    key={it.id}
                    onClick={() => setActiveId(it.id)}
                    className={`cursor-pointer transition-colors border-t border-[#291E16] hover:bg-[#241A13] ${
                      isActive ? "bg-[#231812]" : ""
                    }`}
                  >
                    <td className="py-3 font-semibold flex items-center gap-2">
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
                      )}
                      <span style={{ color: isActive ? C.accent : C.text }}>
                        {it.name || "เมนูใหม่"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[#B9A998]">
                      ฿{thb(r.ingredientCost)}
                    </td>
                    <td className="py-3 text-right font-medium text-[#F8F3EA]">
                      ฿{thb(r.totalCost)}
                    </td>
                    <td className="py-3 text-right font-bold text-[#D2E659]">
                      ฿{thb(r.finalPrice)}
                    </td>
                    <td
                      className="py-3 text-right font-semibold"
                      style={{ color: r.profit >= 0 ? C.good : C.bad }}
                    >
                      ฿{thb(r.profit)}
                    </td>
                    <td
                      className="py-3 text-right font-semibold"
                      style={{ color: r.marginPct >= 0 ? C.good : C.bad }}
                    >
                      {thb(r.marginPct)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LEDGER TAB (รายรับ-รายจ่าย & POS หน้าร้าน)
   ============================================================ */
function LedgerTab({ menuItems, menuResults, txns, setTxns, sheetUrl, syncNow, onOpenSheetConfig }) {
  const [account, setAccount] = useState("shop");
  const [txnType, setTxnType] = useState("expense");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [periodFilter, setPeriodFilter] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [saleMode, setSaleMode] = useState(false);
  const [saleMenuId, setSaleMenuId] = useState(menuItems[0]?.id || "");
  const [saleQty, setSaleQty] = useState(1);

  const theme =
    account === "shop"
      ? { accent: C.shop, bg: C.shopBg, border: C.shopBorder, label: "บัญชีของร้าน", Icon: Store }
      : { accent: C.personal, bg: C.personalBg, border: C.personalBorder, label: "บัญชีส่วนตัว", Icon: User };

  useEffect(() => {
    if (account !== "shop") setSaleMode(false);
  }, [account]);

  useEffect(() => {
    if (txnType !== "income") setSaleMode(false);
  }, [txnType]);

  const saleMenu = menuItems.find((m) => m.id === saleMenuId) || menuItems[0];
  const saleResult = saleMenu ? menuResults[saleMenu.id] : null;
  const saleUnitPrice = saleResult ? saleResult.finalPrice : 0;
  const saleUnitCost = saleResult ? saleResult.totalCost : 0;
  const saleTotalPrice = saleUnitPrice * (parseInt(saleQty, 10) || 0);
  const saleTotalCost = saleUnitCost * (parseInt(saleQty, 10) || 0);
  const saleProfit = saleTotalPrice - saleTotalCost;

  useEffect(() => {
    if (!saleMode || !saleMenu) return;
    setAmount(saleTotalPrice ? String(Math.round(saleTotalPrice * 100) / 100) : "");
    setDescription(`ขาย ${saleMenu.name || "เมนู"} x${saleQty} แก้ว`);
  }, [saleMode, saleMenuId, saleQty, saleTotalPrice, saleMenu]);

  const enterSaleMode = () => {
    setTxnType("income");
    setSaleMode(true);
    if (!saleMenuId && menuItems[0]) setSaleMenuId(menuItems[0].id);
  };

  const applyQuickTag = (tag) => {
    setSaleMode(false);
    setDescription(tag.title);
    setTxnType(tag.type);
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setSaleMode(false);
  };

  const submitTxn = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0 || !date) return;

    const newTxn = {
      id: "txn_" + Date.now() + "_" + uid(),
      account,
      type: txnType,
      date,
      amount: amt,
      description: description.trim(),
      icon: saleMode ? "🥤" : txnType === "income" ? "💵" : "💸",
      createdAt: Date.now(),
      ...(saleMode && saleMenu
        ? {
            linkedMenuId: saleMenu.id,
            linkedMenuName: saleMenu.name,
            qty: parseInt(saleQty, 10) || 1,
            unitCost: saleUnitCost,
            unitPrice: saleUnitPrice,
            costTotal: saleTotalCost,
            profitTotal: saleTotalPrice - saleTotalCost,
          }
        : {}),
    };

    setTxns((prev) => [newTxn, ...prev]);
    resetForm();
    syncNow({ action: "create", data: newTxn });
  };

  const removeTxn = (id) => {
    setTxns((prev) => prev.filter((t) => t.id !== id));
    syncNow({ action: "delete", id, account });
  };

  const clearAccount = () => {
    if (!window.confirm(`ต้องการล้างรายการทั้งหมดของ "${theme.label}" หรือไม่?`)) return;
    setTxns((prev) => prev.filter((t) => t.account !== account));
    syncNow({ action: "clear", account });
  };

  const currentMonthStr = todayISO().slice(0, 7);

  const monthOptions = useMemo(() => {
    const set = new Set([currentMonthStr]);
    txns.forEach((t) => t.date && t.date.length >= 7 && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse().filter((m) => m !== currentMonthStr);
  }, [txns, currentMonthStr]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (t.account !== account) return false;
      if (periodFilter === "current") {
        if (!t.date.startsWith(currentMonthStr)) return false;
      } else if (periodFilter !== "all") {
        if (!t.date.startsWith(periodFilter)) return false;
      }
      if (
        searchQuery &&
        !t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [txns, account, periodFilter, searchQuery, currentMonthStr]);

  const totals = useMemo(() => {
    let income = 0,
      expense = 0,
      salesProfit = 0;
    filtered.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
      if (t.profitTotal != null) salesProfit += t.profitTotal;
    });
    return { income, expense, balance: income - expense, salesProfit };
  }, [filtered]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((t) => {
      if (!g[t.date]) g[t.date] = [];
      g[t.date].push(t);
    });
    return g;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort().reverse();

  const periodLabel =
    periodFilter === "current"
      ? `เดือนนี้ (${formatMonthYearThai(currentMonthStr)})`
      : periodFilter === "all"
      ? "ทุกช่วงเวลา"
      : formatMonthYearThai(periodFilter);

  const totalVolume = totals.income + totals.expense;
  const incomePct = totalVolume > 0 ? (totals.income / totalVolume) * 100 : 50;

  return (
    <div>
      {/* Segmented Account Switch */}
      <div
        className="p-1.5 rounded-2xl grid grid-cols-2 gap-2 mb-6 border"
        style={{ background: C.panel, borderColor: C.border }}
      >
        {[
          { key: "shop", label: "บัญชีของร้าน (Shop)", Icon: Store, color: C.shop },
          { key: "personal", label: "บัญชีส่วนตัว (Personal)", Icon: User, color: C.personal },
        ].map((a) => (
          <button
            key={a.key}
            onClick={() => setAccount(a.key)}
            className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={
              account === a.key
                ? {
                    background: a.key === "shop" ? C.shopBg : C.personalBg,
                    color: a.color,
                    border: `1px solid ${a.key === "shop" ? C.shopBorder : C.personalBorder}`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  }
                : { color: C.textDim }
            }
          >
            <a.Icon size={16} />
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Hero Balance Card */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-6 border shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${theme.bg}, ${C.bg})`,
          borderColor: theme.border,
        }}
      >
        <div
          className="absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: theme.accent }}
        />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <span
            className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5"
            style={{ color: theme.accent }}
          >
            <theme.Icon size={14} /> {theme.label}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              background: "rgba(0,0,0,0.25)",
              color: C.textDim,
              borderColor: C.border,
            }}
          >
            {periodLabel}
          </span>
        </div>

        <div className="relative z-10 mb-6">
          <span className="text-xs uppercase tracking-wider block text-[#7D6D5E] font-bold mb-1">
            ยอดเงินคงเหลือสุทธิ
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-light text-[#7D6D5E]">฿</span>
            <span
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ ...headingFont, color: totals.balance >= 0 ? C.text : C.bad }}
            >
              {thb(totals.balance)}
            </span>
          </div>
        </div>

        {/* Income vs Expense Grid */}
        <div
          className="relative z-10 pt-4 grid grid-cols-2 gap-4 border-t"
          style={{ borderColor: C.borderSoft }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#7D6D5E] mb-1 font-medium">
              <ArrowUpRight size={14} className="text-[#94CF69]" /> รายรับรวม
            </div>
            <span className="text-base sm:text-lg font-extrabold text-[#94CF69]">
              +฿{thb(totals.income)}
            </span>
          </div>
          <div className="pl-4 border-l" style={{ borderColor: C.borderSoft }}>
            <div className="flex items-center gap-1.5 text-xs text-[#7D6D5E] mb-1 font-medium">
              <ArrowDownRight size={14} className="text-[#E57762]" /> รายจ่ายรวม
            </div>
            <span className="text-base sm:text-lg font-extrabold text-[#E57762]">
              -฿{thb(totals.expense)}
            </span>
          </div>
        </div>

        {/* Income/Expense Meter Bar */}
        <div
          className="relative z-10 mt-4 h-2 rounded-full overflow-hidden flex"
          style={{ background: "#221710" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${incomePct}%`, background: C.good }}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${100 - incomePct}%`, background: C.bad }}
          />
        </div>

        {account === "shop" && totals.salesProfit !== 0 && (
          <div
            className="relative z-10 mt-4 pt-3 flex items-center justify-between text-xs border-t"
            style={{ borderColor: C.borderSoft }}
          >
            <span className="flex items-center gap-1.5 text-[#B9A998]">
              <CupSoda size={14} className="text-[#D2E659]" /> กำไรขั้นต้นสะสมจากยอดขายเครื่องดื่ม
            </span>
            <span className="font-bold text-[#D2E659]">
              +฿{thb(totals.salesProfit)}
            </span>
          </div>
        )}
      </div>

      {/* Quick Entry Card */}
      <div
        className="rounded-3xl p-5 sm:p-6 mb-6 border"
        style={{ background: C.panel, borderColor: C.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B9A998]">
              บันทึกรายการด่วน
            </h2>
          </div>
          <span className="text-xs font-semibold" style={{ color: theme.accent }}>
            ลงใน: {theme.label}
          </span>
        </div>

        {/* Smart Categories Chips */}
        {!saleMode && (
          <div className="flex flex-wrap gap-2 mb-4">
            {account === "shop" && (
              <button
                type="button"
                onClick={enterSaleMode}
                className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                style={{
                  background: C.accentBg,
                  color: C.accent,
                  border: `1px solid ${C.accentDim}`,
                }}
              >
                <CupSoda size={14} /> ขายเครื่องดื่มจากเมนู
              </button>
            )}
            {SMART_CATEGORIES[account].map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyQuickTag(t)}
                className="text-xs font-medium px-3 py-2 rounded-xl transition-all hover:border-[#D2E659]/40 active:scale-95"
                style={{
                  background: C.panelAlt,
                  color: C.textDim,
                  border: `1px solid ${C.borderSoft}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* POS Mode: Sell from Menu Card */}
        {saleMode && (
          <div
            className="mb-4 rounded-2xl p-4 border"
            style={{ background: C.panelAlt, borderColor: C.accentDim }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#36261A]">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#D2E659]">
                <CupSoda size={15} /> คิดยอดขายจากเมนูเครื่องดื่ม (POS Quick-Sell)
              </span>
              <button
                type="button"
                onClick={() => setSaleMode(false)}
                className="text-[#7D6D5E] hover:text-[#F8F3EA]"
              >
                <X size={16} />
              </button>
            </div>

            {menuItems.length === 0 ? (
              <p className="text-xs text-[#7D6D5E]">
                ยังไม่มีเมนูในระบบ — กรุณาไปที่แท็บ "ตั้งราคา-ต้นทุน" เพื่อเพิ่มเมนูก่อน
              </p>
            ) : (
              <>
                <div className="grid sm:grid-cols-12 gap-3 items-end mb-3">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] text-[#7D6D5E] mb-1 font-medium">
                      เลือกเมนูที่ขาย
                    </label>
                    <select
                      value={saleMenuId}
                      onChange={(e) => setSaleMenuId(e.target.value)}
                      className={baseInputClasses()}
                    >
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || "เมนูใหม่"} — ฿{thb(menuResults[m.id]?.finalPrice || 0)} / แก้ว
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-[#7D6D5E] mb-1 font-medium">
                      จำนวนแก้ว
                    </label>
                    <Stepper value={saleQty} onChange={setSaleQty} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-[#120D0A]">
                  <div className="py-1">
                    <div className="text-[10px] uppercase text-[#7D6D5E]">ยอดขายรวม</div>
                    <div className="text-sm font-bold text-[#F8F3EA]">฿{thb(saleTotalPrice)}</div>
                  </div>
                  <div className="py-1 border-x border-[#2A1E16]">
                    <div className="text-[10px] uppercase text-[#7D6D5E]">ต้นทุนรวม</div>
                    <div className="text-sm font-bold text-[#B9A998]">฿{thb(saleTotalCost)}</div>
                  </div>
                  <div className="py-1">
                    <div className="text-[10px] uppercase text-[#7D6D5E]">กำไรขั้นต้น</div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: saleProfit >= 0 ? C.good : C.bad }}
                    >
                      ฿{thb(saleProfit)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={submitTxn} className="space-y-3">
          <div className="p-1 rounded-xl grid grid-cols-2 gap-1 bg-[#140E0A] border border-[#2A1E16]">
            <button
              type="button"
              disabled={saleMode}
              onClick={() => setTxnType("expense")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                txnType === "expense"
                  ? "bg-[#341D18] text-[#E57762] shadow"
                  : "text-[#7D6D5E]"
              } disabled:opacity-40`}
            >
              รายจ่าย (เงินออก)
            </button>
            <button
              type="button"
              onClick={() => setTxnType("income")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                txnType === "income"
                  ? "bg-[#1E3317] text-[#94CF69] shadow"
                  : "text-[#7D6D5E]"
              }`}
            >
              รายรับ (เงินเข้า)
            </button>
          </div>

          <TextField
            id="description"
            value={description}
            onChange={setDescription}
            placeholder="ชื่อรายการ เช่น ซื้อนมสด, กาแฟ, ค่าไฟ"
            required
            className="py-3"
          />

          <div className="grid grid-cols-5 gap-2">
            <TextField
              type="date"
              value={date}
              onChange={setDate}
              required
              className="col-span-2 py-3"
            />
            <div className="col-span-3 flex gap-2">
              <NumField
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                suffix="฿"
                className="flex-1"
                inputClassName="py-3 px-3"
                min="0.01"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-md"
                style={{ background: theme.accent, color: C.bg }}
              >
                + บันทึก
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D6D5E]"
          />
          <TextField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="ค้นหารายการ..."
            className="pl-9 py-2 text-xs sm:text-sm"
          />
        </div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl shrink-0 cursor-pointer bg-[#221913] border border-[#38291F] text-[#B9A998] focus:outline-none"
        >
          <option value="current">เดือนนี้ ({formatMonthYearThai(currentMonthStr)})</option>
          <option value="all">รายการทั้งหมด</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              ย้อนหลัง: {formatMonthYearThai(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Feed list */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div
            className="py-16 text-center rounded-3xl border"
            style={{ background: C.panel, borderColor: C.border }}
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl bg-[#221913] text-[#7D6D5E]">
              📑
            </div>
            <p className="text-sm font-bold text-[#F8F3EA]">ยังไม่มีรายการในกระเป๋านี้</p>
            <p className="text-xs mt-1 text-[#7D6D5E]">
              เลือกปุ่มลัดด้านบนเพื่อบันทึกรายการแรกได้ทันที
            </p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dayItems = grouped[dateStr];
            let dayIn = 0,
              dayExp = 0;
            dayItems.forEach((it) =>
              it.type === "income" ? (dayIn += it.amount) : (dayExp += it.amount)
            );
            return (
              <div
                key={dateStr}
                className="rounded-2xl overflow-hidden border"
                style={{ background: C.panel, borderColor: C.border }}
              >
                {/* Date header */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between text-xs border-b"
                  style={{ background: C.panelAlt, borderColor: C.borderSoft }}
                >
                  <span className="font-bold text-[#F8F3EA]">
                    {formatDayGroupThai(dateStr)}
                  </span>
                  <div className="text-[11px] flex gap-2 font-semibold">
                    {dayExp > 0 && <span className="text-[#E57762]">-฿{thb(dayExp)}</span>}
                    {dayIn > 0 && <span className="text-[#94CF69]">+฿{thb(dayIn)}</span>}
                  </div>
                </div>

                {/* Day rows */}
                <div>
                  {dayItems.map((it) => {
                    const isInc = it.type === "income";
                    return (
                      <div
                        key={it.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 border-t first:border-t-0"
                        style={{ borderColor: C.borderSoft }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border"
                            style={{ background: C.panelAlt, borderColor: C.borderSoft }}
                          >
                            {it.icon || (isInc ? "💵" : "💸")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold truncate text-[#F8F3EA]">
                              {it.description}
                            </p>
                            <span className="text-[10px] text-[#7D6D5E]">
                              {isInc ? "เงินเข้า" : "จ่ายออก"}
                              {it.profitTotal != null && (
                                <> · กำไรขั้นต้น ฿{thb(it.profitTotal)}</>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="text-xs sm:text-sm font-extrabold"
                            style={{ color: isInc ? C.good : C.text }}
                          >
                            {isInc ? "+" : "-"}฿{thb(it.amount)}
                          </span>
                          <button
                            onClick={() => removeTxn(it.id)}
                            className="p-1 text-[#7D6D5E] hover:text-[#E57762] transition-colors"
                            title="ลบรายการ"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer toolbar */}
      <div
        className="mt-8 pt-5 flex items-center justify-between text-xs border-t text-[#7D6D5E]"
        style={{ borderColor: C.border }}
      >
        <button
          onClick={clearAccount}
          className="hover:text-[#E57762] transition-colors"
        >
          ล้างข้อมูลเฉพาะบัญชีนี้
        </button>
        <button
          onClick={onOpenSheetConfig}
          className="hover:text-[#D2E659] transition-colors flex items-center gap-1"
        >
          <Link2 size={13} />
          {sheetUrl ? "เชื่อมต่อ Google Sheets แล้ว" : "ตั้งค่า Google Sheets"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   GOOGLE SHEETS CONFIG MODAL
   ============================================================ */
function SheetConfigModal({ open, onClose, sheetUrl, onSave, onDisconnect }) {
  const [value, setValue] = useState(sheetUrl);
  useEffect(() => setValue(sheetUrl), [sheetUrl, open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="rounded-3xl p-6 max-w-md w-full border shadow-2xl"
        style={{ background: C.panel, borderColor: C.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: C.accentBg, color: C.accent }}
            >
              <Link2 size={16} />
            </div>
            <h3 className="font-bold text-base text-[#F8F3EA]">เชื่อมต่อ Google Sheets</h3>
          </div>
          <button onClick={onClose} className="text-[#7D6D5E] hover:text-[#F8F3EA]">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs mb-4 leading-relaxed text-[#B9A998]">
          นำ Web App URL (จาก Google Apps Script) มาวาง
          ข้อมูลรายรับ-รายจ่ายจะถูกส่งไปบันทึกลง Google Sheets ทันทีที่มีการเพิ่มหรือลบ
        </p>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#7D6D5E] mb-1.5">
            Web App URL (ลงท้ายด้วย /exec)
          </label>
          <TextField
            value={value}
            onChange={setValue}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => value.trim() && onSave(value.trim())}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-transform active:scale-95"
            style={{ background: C.accent, color: C.bg }}
          >
            บันทึกการเชื่อมต่อ
          </button>
          {sheetUrl && (
            <button
              onClick={onDisconnect}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-[#562B22] text-[#E57762] hover:bg-[#341D18]"
            >
              ยกเลิกการเชื่อมต่อ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP CONTROLLER
   ============================================================ */
export default function DrinkOpsApp() {
  const FONT_LOADED = useRef(false);
  const STORAGE_KEY_MENU = "drinkops_menu_v2";
  const STORAGE_KEY_TXNS = "drinkops_txns_v2";
  const STORAGE_KEY_SHEET = "drinkops_sheet_url_v2";

  useEffect(() => {
    if (FONT_LOADED.current) return;
    FONT_LOADED.current = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const [tab, setTab] = useState("pricing"); // 'pricing' | 'ledger'

  // Pricing State (Saved to LocalStorage)
  const [menuItems, setMenuItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MENU);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDemoMenu();
  });

  const [activeMenuId, setActiveMenuId] = useState(() => menuItems[0]?.id || "");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(menuItems));
    } catch {}
  }, [menuItems]);

  const menuResults = useMemo(() => {
    const map = {};
    menuItems.forEach((it) => (map[it.id] = calcMenuItem(it)));
    return map;
  }, [menuItems]);

  // Ledger State (Saved to LocalStorage + Sync Sheet)
  const [txns, setTxns] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TXNS, JSON.stringify(txns));
    } catch {}
  }, [txns]);

  const [sheetUrl, setSheetUrl] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SHEET) || "";
    } catch {
      return "";
    }
  });

  const [syncState, setSyncState] = useState("none"); // none | syncing | synced | error
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFromSheet = useCallback(async (url) => {
    if (!url) return;
    setSyncState("syncing");
    try {
      const res = await fetch(url);
      const result = await res.json();
      if (result && result.status === "success" && Array.isArray(result.data)) {
        setTxns(result.data);
        setSyncState("synced");
      } else {
        setSyncState("error");
      }
    } catch (e) {
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    if (sheetUrl) fetchFromSheet(sheetUrl);
  }, [sheetUrl, fetchFromSheet]);

  const syncNow = useCallback(
    async (payload) => {
      if (!sheetUrl) return;
      setSyncState("syncing");
      try {
        await fetch(sheetUrl, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
        setSyncState("synced");
      } catch (e) {
        setSyncState("error");
      }
    },
    [sheetUrl]
  );

  const saveSheetUrl = (url) => {
    setSheetUrl(url);
    try {
      localStorage.setItem(STORAGE_KEY_SHEET, url);
    } catch {}
    setModalOpen(false);
  };

  const disconnectSheet = () => {
    setSheetUrl("");
    setSyncState("none");
    try {
      localStorage.removeItem(STORAGE_KEY_SHEET);
    } catch {}
    setModalOpen(false);
  };

  const badge = !sheetUrl
    ? { dot: C.textFaint, text: "เชื่อมต่อ Google Sheets" }
    : syncState === "syncing"
    ? { dot: "#E5B342", text: "กำลังซิงค์..." }
    : syncState === "error"
    ? { dot: C.bad, text: "ซิงค์ไม่สำเร็จ" }
    : { dot: C.good, text: "ซิงค์ชีตแล้ว" };

  return (
    <div
      className="min-h-screen w-full p-4 sm:p-8"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: `radial-gradient(1100px 500px at 15% -10%, ${C.bgRadialA} 0%, ${C.bg} 60%)`,
        color: C.text,
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Top App Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: C.accent, boxShadow: "0 8px 25px rgba(210, 230, 89, 0.25)" }}
            >
              <Coffee size={22} color={C.bg} strokeWidth={2.3} />
            </div>
            <div>
              <h1 style={headingFont} className="text-2xl sm:text-[28px] font-bold leading-tight">
                DrinkOps คำนวณต้นทุน & บัญชีร้าน
              </h1>
              <p className="text-xs sm:text-[13px] text-[#B9A998] mt-0.5">
                จัดการต้นทุนแก้วต่อแก้ว ตั้งราคาขายอย่างแม่นยำ พร้อมระบบบันทึกรายรับ-รายจ่าย
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:border-[#D2E659]"
            style={{ borderColor: C.border, color: C.textDim, background: C.panel }}
          >
            <span
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: badge.dot }}
            />
            {badge.text}
          </button>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div
          className="p-1.5 rounded-2xl grid grid-cols-2 gap-2 mb-7 border"
          style={{ background: C.panel, borderColor: C.border }}
        >
          <button
            onClick={() => setTab("pricing")}
            className="py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={
              tab === "pricing"
                ? {
                    background: C.accent,
                    color: C.bg,
                    boxShadow: "0 4px 15px rgba(210, 230, 89, 0.25)",
                  }
                : { color: C.textDim }
            }
          >
            <Percent size={16} /> ตั้งราคา-ต้นทุนเครื่องดื่ม
          </button>
          <button
            onClick={() => setTab("ledger")}
            className="py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={
              tab === "ledger"
                ? {
                    background: C.accent,
                    color: C.bg,
                    boxShadow: "0 4px 15px rgba(210, 230, 89, 0.25)",
                  }
                : { color: C.textDim }
            }
          >
            <Wallet size={16} /> บันทึกรายรับ-รายจ่าย (POS)
          </button>
        </div>

        {/* Tab View */}
        {tab === "pricing" ? (
          <PricingTab
            items={menuItems}
            setItems={setMenuItems}
            activeId={activeMenuId}
            setActiveId={setActiveMenuId}
          />
        ) : (
          <LedgerTab
            menuItems={menuItems}
            menuResults={menuResults}
            txns={txns}
            setTxns={setTxns}
            sheetUrl={sheetUrl}
            syncNow={syncNow}
            onOpenSheetConfig={() => setModalOpen(true)}
          />
        )}

        {/* Persistent Footnote */}
        <p className="text-[11px] mt-8 text-center text-[#7D6D5E]">
          ✓ ข้อมูลเมนูและรายการบัญชีบันทึกลงในเครื่องของคุณ (Local Storage) อัตโนมัติ ปิดหน้าเว็บข้อมูลไม่สูญหาย
        </p>
      </div>

      <SheetConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sheetUrl={sheetUrl}
        onSave={saveSheetUrl}
        onDisconnect={disconnectSheet}
      />
    </div>
  );
}