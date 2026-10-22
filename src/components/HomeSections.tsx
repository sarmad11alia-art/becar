import {
  BadgeCheck,
  Clock3,
  FileCheck2,
  Headphones,
  Lock,
  Search,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Clock3,
    title: "عرض سعر في دقيقة",
    body: "أدخل رقم الهوية والاستمارة فقط، ونجلب لك العروض المتاحة فورًا.",
  },
  {
    icon: Wallet,
    title: "أفضل الأسعار",
    body: "نقارن بين أكثر من 20 شركة تأمين لنعرض لك السعر الأنسب لك.",
  },
  {
    icon: Lock,
    title: "دفع آمن ومشفّر",
    body: "كل عملياتك تمر عبر بوابة دفع آمنة ومتوافقة مع معايير PCI DSS.",
  },
  {
    icon: Headphones,
    title: "دعم على مدار الساعة",
    body: "فريقنا جاهز لمساعدتك في أي وقت قبل وبعد إصدار الوثيقة.",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "أدخل بياناتك",
    body: "رقم الهوية أو الإقامة مع رقم الاستمارة أو التسلسلي للمركبة.",
  },
  {
    icon: BadgeCheck,
    title: "قارن العروض",
    body: "استعرض عروض الشركات، أضف المنافع التي تحتاجها، واختر الأنسب.",
  },
  {
    icon: FileCheck2,
    title: "استلم وثيقتك",
    body: "أكمل الدفع الآمن واستلم وثيقتك الإلكترونية على بريدك فورًا.",
  },
];

const FAQS = [
  {
    q: "كم يستغرق إصدار الوثيقة؟",
    a: "بعد إتمام الدفع تصدر الوثيقة إلكترونيًا خلال دقائق وتُسجَّل تلقائيًا في نظام مركز المعلومات الوطني.",
  },
  {
    q: "ما الفرق بين التأمين الشامل وضد الغير؟",
    a: "التأمين ضد الغير يغطي الأضرار التي تسببها لأطراف أخرى، أما الشامل فيغطي مركبتك أيضًا في حالات الحادث والسرقة والحريق.",
  },
  {
    q: "هل يمكنني تأمين مركبة تحت نقل الملكية؟",
    a: "نعم، اختر تبويب «نقل ملكية» في نموذج الطلب وأدخل رقم هوية البائع مع بيانات المركبة.",
  },
  {
    q: "هل بياناتي محفوظة بشكل آمن؟",
    a: "نعم. جميع البيانات تُنقل عبر اتصال مشفّر ولا نشاركها مع أي طرف خارج شركات التأمين المعنية بطلبك.",
  },
];

export function FeatureStrip() {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bcare-card group p-5 ring-1 transition-transform hover:-translate-y-1"
            >
              <div className="bcare-gradient-blue grid h-11 w-11 place-items-center rounded-xl text-white shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-bcare-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bcare-muted">{f.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="border-y border-bcare-border bg-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-black uppercase tracking-wider text-bcare-orange">كيف يعمل؟</span>
          <h2 className="mt-2 text-2xl font-black text-bcare-ink md:text-3xl">ثلاث خطوات فقط</h2>
          <p className="mt-2 text-sm text-bcare-muted md:text-base">
            من إدخال البيانات حتى استلام الوثيقة الإلكترونية — كل شيء أونلاين.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative rounded-2xl border border-bcare-border bg-bcare-surface p-6">
                <span className="bcare-gradient-cta absolute -top-4 right-6 grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white shadow-glow-orange">
                  {i + 1}
                </span>
                <Icon className="mt-2 h-7 w-7 text-bcare-blue" />
                <h3 className="mt-3 text-base font-black text-bcare-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-bcare-muted">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="text-xs font-black uppercase tracking-wider text-bcare-orange">أسئلة شائعة</span>
          <h2 className="mt-2 text-2xl font-black text-bcare-ink md:text-3xl">كل ما تحتاج معرفته</h2>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-bcare-border bg-white p-4 shadow-soft open:shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-bcare-ink md:text-base">
                {f.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bcare-surface text-bcare-blue transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-bcare-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
