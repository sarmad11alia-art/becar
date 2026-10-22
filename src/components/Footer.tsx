import { Link } from "@tanstack/react-router";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import bcareLogo from "@/assets/bcare-logo.png";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-bcare-ink text-white" dir="rtl">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={bcareLogo}
              alt="شعار بي كير للتأمين"
              className="h-12 w-auto rounded-lg bg-white object-contain p-1"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed opacity-80">
            وسيط تأمين إلكتروني يوفّر عليك المقارنة بين أكثر من 20 شركة تأمين معتمدة في المملكة العربية السعودية.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black">منتجاتنا</h3>
          <ul className="space-y-2 text-sm opacity-85">
            <li><Link to="/" className="hover:text-bcare-orange">تأمين المركبات</Link></li>
            <li><Link to="/medical" className="hover:text-bcare-orange">التأمين الطبي</Link></li>
            <li><Link to="/travel" className="hover:text-bcare-orange">تأمين السفر</Link></li>
            <li><Link to="/medical-mis" className="hover:text-bcare-orange">الأخطاء الطبية</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black">الشركة</h3>
          <ul className="space-y-2 text-sm opacity-85">
            <li><a href="#" className="hover:text-bcare-orange">من نحن</a></li>
            <li><a href="#" className="hover:text-bcare-orange">الأسئلة الشائعة</a></li>
            <li><a href="#" className="hover:text-bcare-orange">الشروط والأحكام</a></li>
            <li><a href="#" className="hover:text-bcare-orange">سياسة الخصوصية</a></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black">تواصل معنا</h3>
          <ul className="space-y-2 text-sm opacity-85">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-bcare-orange" />
              <a href="mailto:info@bcare.sa" className="hover:text-bcare-orange" dir="ltr">info@bcare.sa</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-bcare-orange" />
              <span>الرياض، المملكة العربية السعودية</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-xs opacity-80 md:flex-row">
          <p>© {year} بي كير للتأمين. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-bcare-orange" />
            <span>مرخّص من قِبل البنك المركزي السعودي — SAMA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
