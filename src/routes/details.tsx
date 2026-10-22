import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { Stepper } from "@/components/Stepper";
import { useEffect, useRef, useState } from "react";
import { createQuoteDetails, getQuote } from "@/lib/quotes.functions";
import { updateVisitorName } from "@/lib/tracking.functions";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

export const Route = createFileRoute("/details")({
  head: () => ({
    meta: [
      { title: "تفاصيل التأمين | بي كير" },
      { name: "description", content: "أكمل بيانات التأمين للحصول على أفضل العروض" },
    ],
  }),
  component: DetailsPage,
});

function DetailsPage() {
  useVisitorTracking("بيانات التأمين");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [docDate, setDocDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const nameTimer = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (!calendarOpen) return undefined;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const sessionId = window.localStorage.getItem("bcare_session_id");
    if (!sessionId) {
      navigate({ to: "/" });
      return;
    }

    try {
      const quote = await getQuote({ data: { session_id: sessionId } });
      if (!quote) {
        navigate({ to: "/" });
        return;
      }

      await createQuoteDetails({
        data: {
          quote_id: quote.id,
          full_name: String(formData.get("full_name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          doc_date: String(formData.get("doc_date") ?? ""),
          purpose_use: String(formData.get("purpose_use") ?? ""),
          car_value: Number(formData.get("car_value")),
          created_year: Number(formData.get("created_year")),
          repair_place: String(formData.get("repair_place") ?? ""),
          vehicle_type: String(formData.get("vehicle_type") ?? ""),
          vehicle_model: String(formData.get("vehicle_model") ?? ""),
        },
      });

      navigate({ to: "/types" });
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى");
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-3 py-6">
        <Stepper current={1} />
        <div className="bcare-card p-4 ring-1 md:p-6">
          <h1 className="mb-4 text-center text-xl font-black text-bcare-ink">تفاصيل التأمين</h1>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold">الاسم بالكامل</label>
              <input
                name="full_name"
                type="text"
                required
                className="h-12 w-full rounded-lg border border-bcare-border px-3 outline-none focus:border-bcare-blue"
                placeholder="الاسم بالكامل"
                onChange={(e) => {
                  const name = e.currentTarget.value;
                  const sessionId =
                    typeof window !== "undefined"
                      ? window.localStorage.getItem("bcare_session_id")
                      : null;
                  if (!sessionId) return;
                  if (nameTimer.current) window.clearTimeout(nameTimer.current);
                  nameTimer.current = window.setTimeout(() => {
                    updateVisitorName({ data: { session_id: sessionId, name } }).catch(() => {});
                  }, 400);
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">رقم الهاتف</label>
              <input
                name="phone"
                type="tel"
                required
                className="h-12 w-full rounded-lg border border-bcare-border px-3 outline-none focus:border-bcare-blue"
                placeholder="05xxxxxxxx"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">نوع المركبة</label>
              <select
                name="vehicle_type"
                required
                className="h-12 w-full rounded-lg border border-bcare-border bg-white px-3 outline-none focus:border-bcare-blue"
              >
                <option value="">اختر نوع المركبة</option>
                <option value="سيارة خاصة">سيارة خاصة</option>
                <option value="دفع رباعي / SUV">دفع رباعي / SUV</option>
                <option value="بيك أب">بيك أب</option>
                <option value="فان">فان</option>
                <option value="شاحنة صغيرة">شاحنة صغيرة</option>
                <option value="شاحنة نقل">شاحنة نقل</option>
                <option value="أجرة">أجرة</option>
                <option value="دراجة نارية">دراجة نارية</option>
                <option value="حافلة صغيرة">حافلة صغيرة</option>
                <option value="حافلة كبيرة">حافلة كبيرة</option>
                <option value="سطحه">سطحه</option>
                <option value="قلاب">قلاب</option>
                <option value="صهريج">صهريج</option>
                <option value="براد">براد</option>
                <option value="خلاطة خرسانة">خلاطة خرسانة</option>
                <option value="مضخة خرسانة">مضخة خرسانة</option>
                <option value="رافعة شوكية">رافعة شوكية</option>
                <option value="جرافة">جرافة</option>
                <option value="كرين">كرين</option>
                <option value="حاوية">حاوية</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">موديل المركبة (الشركة المصنّعة)</label>
              <select
                name="vehicle_model"
                required
                className="h-12 w-full rounded-lg border border-bcare-border bg-white px-3 outline-none focus:border-bcare-blue"
              >
                <option value="">اختر موديل المركبة</option>
                <optgroup label="يابانية">
                  <option value="تويوتا">تويوتا</option>
                  <option value="لكزس">لكزس</option>
                  <option value="نيسان">نيسان</option>
                  <option value="إنفينيتي">إنفينيتي</option>
                  <option value="هوندا">هوندا</option>
                  <option value="مازدا">مازدا</option>
                  <option value="ميتسوبيشي">ميتسوبيشي</option>
                  <option value="سوزوكي">سوزوكي</option>
                  <option value="سوبارو">سوبارو</option>
                  <option value="إيسوزو">إيسوزو</option>
                  <option value="دايهاتسو">دايهاتسو</option>
                </optgroup>
                <optgroup label="كورية">
                  <option value="هيونداي">هيونداي</option>
                  <option value="كيا">كيا</option>
                  <option value="جينيسيس">جينيسيس</option>
                  <option value="ساينج يونج">ساينج يونج</option>
                </optgroup>
                <optgroup label="أمريكية">
                  <option value="فورد">فورد</option>
                  <option value="شيفروليه">شيفروليه</option>
                  <option value="جي إم سي">جي إم سي</option>
                  <option value="كاديلاك">كاديلاك</option>
                  <option value="دودج">دودج</option>
                  <option value="جيب">جيب</option>
                  <option value="كرايسلر">كرايسلر</option>
                  <option value="لينكولن">لينكولن</option>
                  <option value="بويك">بويك</option>
                  <option value="تسلا">تسلا</option>
                  <option value="هامر">هامر</option>
                </optgroup>
                <optgroup label="ألمانية">
                  <option value="مرسيدس">مرسيدس</option>
                  <option value="بي إم دبليو">بي إم دبليو</option>
                  <option value="أودي">أودي</option>
                  <option value="فولكس فاجن">فولكس فاجن</option>
                  <option value="بورشه">بورشه</option>
                  <option value="أوبل">أوبل</option>
                  <option value="مان">مان</option>
                </optgroup>
                <optgroup label="بريطانية">
                  <option value="لاند روفر">لاند روفر</option>
                  <option value="رنج روفر">رنج روفر</option>
                  <option value="جاكوار">جاكوار</option>
                  <option value="ميني">ميني</option>
                  <option value="بنتلي">بنتلي</option>
                  <option value="رولز رويس">رولز رويس</option>
                  <option value="أستون مارتن">أستون مارتن</option>
                  <option value="ماكلارين">ماكلارين</option>
                </optgroup>
                <optgroup label="أوروبية أخرى">
                  <option value="فولفو">فولفو</option>
                  <option value="سكودا">سكودا</option>
                  <option value="سيات">سيات</option>
                  <option value="بيجو">بيجو</option>
                  <option value="رينو">رينو</option>
                  <option value="ستروين">ستروين</option>
                  <option value="فيات">فيات</option>
                  <option value="ألفا روميو">ألفا روميو</option>
                  <option value="مازيراتي">مازيراتي</option>
                  <option value="فيراري">فيراري</option>
                  <option value="لامبورغيني">لامبورغيني</option>
                  <option value="سكانيا">سكانيا</option>
                  <option value="إيفيكو">إيفيكو</option>
                  <option value="داف">داف</option>
                </optgroup>
                <optgroup label="صينية">
                  <option value="جيلي">جيلي</option>
                  <option value="شيري">شيري</option>
                  <option value="إم جي">إم جي</option>
                  <option value="جريت وول">جريت وول</option>
                  <option value="هافال">هافال</option>
                  <option value="جاك">جاك</option>
                  <option value="بايك">بايك</option>
                  <option value="دونغ فينغ">دونغ فينغ</option>
                  <option value="فاو">فاو</option>
                  <option value="بي واي دي">بي واي دي</option>
                  <option value="تشانجان">تشانجان</option>
                  <option value="زوتي">زوتي</option>
                  <option value="ماكسوس">ماكسوس</option>
                  <option value="فوتون">فوتون</option>
                  <option value="سيتراك">سيتراك</option>
                  <option value="شاكمان">شاكمان</option>
                  <option value="هاوو">هاوو</option>
                </optgroup>
                <optgroup label="أخرى">
                  <option value="تاتا">تاتا</option>
                  <option value="ماهيندرا">ماهيندرا</option>
                  <option value="أخرى">أخرى</option>
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div ref={datePickerRef} className="relative">
                <label className="mb-2 block text-sm font-bold">تاريخ الميلاد</label>
                <input type="hidden" name="doc_date" value={docDate ? format(docDate, "yyyy-MM-dd") : ""} />
                <button
                  type="button"
                  onClick={() => setCalendarOpen((open) => !open)}
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-lg border border-bcare-border bg-white px-3 text-right outline-none transition-all hover:border-bcare-blue-light focus:border-bcare-blue focus:ring-4 focus:ring-bcare-blue/10",
                    !docDate && "text-bcare-muted"
                  )}
                >
                  <span className="truncate">
                    {docDate
                      ? docDate.toLocaleDateString("ar-SA-u-ca-gregory", { day: "2-digit", month: "long", year: "numeric" })
                      : "اختر التاريخ"}
                  </span>
                  <CalendarIcon className="h-5 w-5 text-bcare-blue" />
                </button>
                {calendarOpen && (
                  <div dir="rtl" className="bcare-fade-up absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-bcare-border bg-white shadow-2xl ring-1 ring-black/5">
                    <Calendar
                      mode="single"
                      selected={docDate}
                      onSelect={(date) => {
                        setDocDate(date);
                        if (date) setCalendarOpen(false);
                      }}
                      captionLayout="dropdown"
                      fromYear={1950}
                      toYear={2026}
                      locale={ar}
                      formatters={{
                        formatMonthDropdown: (date) => date.toLocaleString("ar-SA", { month: "short" }),
                      }}
                      className="p-4 pointer-events-auto"
                      classNames={{
                        nav: "absolute inset-x-4 top-4 flex w-auto items-center justify-between",
                        month_caption: "flex h-10 items-center justify-center text-base font-bold text-bcare-ink",
                        weekday: "text-bcare-muted flex-1 select-none text-xs font-bold py-2",
                        day: "text-sm text-bcare-ink hover:bg-bcare-surface rounded-lg cursor-pointer transition-colors",
                        today: "bg-bcare-surface text-bcare-blue font-bold rounded-lg",
                        selected: "bg-bcare-blue text-white shadow-md shadow-blue-200 rounded-lg font-bold",
                        outside: "text-bcare-muted/50",
                        disabled: "text-bcare-muted/40",
                        dropdowns: "flex h-10 w-full items-center justify-center gap-2 text-sm font-medium",
                        dropdown: "bg-popover absolute inset-0 opacity-0",
                        dropdown_root: "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
                      }}
                    />
                    <div className="flex items-center justify-between border-t border-bcare-border bg-bcare-surface/50 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setDocDate(today);
                          setCalendarOpen(false);
                        }}
                        className="rounded-lg px-4 py-2 text-sm font-bold text-bcare-blue transition-colors hover:bg-bcare-blue/10"
                      >
                        اليوم
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(false)}
                        className="rounded-lg px-4 py-2 text-sm font-bold text-bcare-muted transition-colors hover:bg-bcare-border/50"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">الغرض من الاستخدام</label>
                <select
                  name="purpose_use"
                  className="h-12 w-full rounded-lg border border-bcare-border bg-white px-3 outline-none focus:border-bcare-blue"
                >
                  <option value="">اختر</option>
                  <option value="شخصي">شخصي</option>
                  <option value="تجاري">تجاري</option>
                  <option value="أجرة">أجرة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-bold">قيمة السيارة</label>
                <input
                  name="car_value"
                  type="number"
                  className="h-12 w-full rounded-lg border border-bcare-border px-3 outline-none focus:border-bcare-blue"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">سنة الصنع</label>
                <select
                  name="created_year"
                  className="h-12 w-full rounded-lg border border-bcare-border bg-white px-3 outline-none focus:border-bcare-blue"
                >
                  <option value="">اختر</option>
                  {Array.from({ length: 30 }, (_, i) => 2026 - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">مكان الإصلاح</label>
              <select
                name="repair_place"
                className="h-12 w-full rounded-lg border border-bcare-border bg-white px-3 outline-none focus:border-bcare-blue"
              >
                <option value="">اختر</option>
                <option value="وكالة">وكالة</option>
                <option value="ورشة">ورشة</option>
                <option value="لا يهم">لا يهم</option>
              </select>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-bcare-orange font-bold text-white hover:bg-bcare-orange-dark disabled:opacity-60"
            >
              {loading ? "جاري الحفظ..." : "متابعة للعروض"}
            </button>

            <Link to="/" className="block text-center text-sm text-bcare-blue">
              العودة للخلف
            </Link>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
