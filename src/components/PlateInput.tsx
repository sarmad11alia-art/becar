import { useMemo, useRef, useState } from "react";

/**
 * لوحة المركبة السعودية: 4 أرقام + 3 أحرف عربية (مع مقابلها اللاتيني).
 * الأحرف المعتمدة من الإدارة العامة للمرور في المملكة العربية السعودية.
 */
export const PLATE_LETTERS: { ar: string; en: string }[] = [
  { ar: "أ", en: "A" },
  { ar: "ب", en: "B" },
  { ar: "ح", en: "J" },
  { ar: "د", en: "D" },
  { ar: "ر", en: "R" },
  { ar: "س", en: "S" },
  { ar: "ص", en: "X" },
  { ar: "ط", en: "T" },
  { ar: "ع", en: "E" },
  { ar: "ق", en: "G" },
  { ar: "ك", en: "K" },
  { ar: "ل", en: "L" },
  { ar: "م", en: "Z" },
  { ar: "ن", en: "N" },
  { ar: "هـ", en: "H" },
  { ar: "و", en: "U" },
  { ar: "ي", en: "V" },
];

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)] ?? d);
const enOf = (ar: string) => PLATE_LETTERS.find((l) => l.ar === ar)?.en ?? "";

/**
 * حقل إدخال لوحة سعودية. يُرسل القيمة النهائية في حقل مخفي باسم name
 * بالصيغة: "1234 - أ ب ح" حتى لا يتغير أي منطق في الخلفية.
 */
export function PlateInput({
  name = "plate_number",
  required = false,
}: {
  name?: string;
  required?: boolean;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [letters, setLetters] = useState(["", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const letterRefs = useRef<(HTMLInputElement | null)[]>([]);

  const numberValue = digits.join("");
  const lettersValue = letters.filter(Boolean).join(" ");
  const combined = useMemo(
    () => (numberValue || lettersValue ? `${numberValue} - ${lettersValue}`.trim() : ""),
    [numberValue, lettersValue],
  );

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 3) digitRefs.current[i + 1]?.focus();
  };

  const setLetter = (i: number, raw: string) => {
    const ch = raw.trim().slice(-1);
    const match =
      PLATE_LETTERS.find((l) => l.ar === ch || l.ar[0] === ch) ??
      PLATE_LETTERS.find((l) => l.en.toLowerCase() === ch.toLowerCase());
    const v = raw === "" ? "" : (match?.ar ?? "");
    setLetters((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 2) letterRefs.current[i + 1]?.focus();
  };

  const boxClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-black text-bcare-ink outline-none transition-all focus:border-bcare-blue focus:shadow-[0_0_0_4px_rgb(21_99_148/0.1)]";

  return (
    <div>
      <input type="hidden" name={name} value={combined} />
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={numberValue.length >= 1 && numberValue.length <= 4 && letters.filter(Boolean).length === 3 ? combined : ""}

          onChange={() => {}}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}

      {/* اللوحة السعودية */}
      <div className="overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="flex items-stretch">
          {/* الشريط الجانبي: KSA */}
          <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-0.5 bg-bcare-surface px-1 py-2">
            <span className="text-[10px] font-black leading-none text-bcare-blue">السعودية</span>
            <span className="text-[11px] font-black leading-none text-bcare-blue">KSA</span>
          </div>

          {/* الأحرف */}
          <div className="flex-1 p-2">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-400">الأحرف</span>
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400" dir="ltr">
                {letters.map(enOf).join(" ") || "— — —"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {letters.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  value={v}
                  onChange={(e) => setLetter(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !v && i > 0) letterRefs.current[i - 1]?.focus();
                  }}
                  inputMode="text"
                  autoComplete="off"
                  aria-label={`حرف اللوحة ${i + 1}`}
                  className={boxClass}
                />
              ))}
            </div>
          </div>

          {/* الأرقام */}
          <div className="flex-1 p-2">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-400">الأرقام</span>
              <span className="text-[10px] font-black tracking-[0.15em] text-slate-400">
                {toArabicDigits(numberValue) || "— — — —"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5" dir="rtl">
              {digits.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    digitRefs.current[i] = el;
                  }}
                  value={v}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !v && i > 0) digitRefs.current[i - 1]?.focus();
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-label={`رقم اللوحة ${i + 1}`}
                  className={boxClass}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-slate-400">
        أدخل ٣ أحرف إلزامية ومن ١ إلى ٤ أرقام كما هي في لوحة مركبتك (يمكنك الكتابة بالعربي أو بالإنجليزي).
      </p>

    </div>
  );
}
