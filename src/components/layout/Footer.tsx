import Link from "next/link";
import { MapPin, Phone, Mail, ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#181A1F] text-slate-300 border-t border-white/10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0D2B22] flex items-center justify-center">
              <div className="h-3.5 w-3.5 rounded-xs bg-[#A3E635] rotate-12" />
            </div>
            <span className="text-lg font-extrabold text-white">ReBuild</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Казахстанский стартап циркулярной экономики в строительстве. То, что для одного
            человека отходы после ремонта, для другого — полезный ресурс.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Платформа</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/catalog" className="hover:text-[#A3E635] transition-colors">
                Каталог стройматериалов
              </Link>
            </li>
            <li>
              <Link href="/warehouse" className="hover:text-[#A3E635] transition-colors">
                Интерактивный склад 2D
              </Link>
            </li>
            <li>
              <Link href="/map" className="hover:text-[#A3E635] transition-colors">
                Карта города Жезказган
              </Link>
            </li>
            <li>
              <Link href="/impact" className="hover:text-[#A3E635] transition-colors">
                ReBuild Impact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Пилотный город</h3>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#A3E635] shrink-0 mt-0.5" />
              <span>г. Жезказган, Улытауская область, Казахстан</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#A3E635] shrink-0" />
              <span>+7 (702) 800-11-00 (демо)</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#A3E635] shrink-0" />
              <span>hello@rebuild.kz</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#A3E635] text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>Демонстрационный MVP</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Все объекты, остатки, цены в тенге (₸) и точки на карте Жезказгана в текущей
            версии являются тестовыми данными для демонстрации концепции проекта.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ReBuild — Стройматериалам вторую жизнь. Пилот г. Жезказган.
      </div>
    </footer>
  );
}

