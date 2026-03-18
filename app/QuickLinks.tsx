import Link from "next/link";
import { Camera, MessageCircle, BookOpen, User } from "lucide-react";

export default function QuickLinks() {
  return (
    <section className="border-t border-black/6 bg-[#f7f5f2]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="grid grid-cols-4 gap-3 md:max-w-xl">
          <QuickLink
            href="/portfolio"
            icon={<Camera size={20} />}
            label="갤러리"
          />
          <QuickLink
            href="/contact"
            icon={<MessageCircle size={20} />}
            label="문의"
          />
          <QuickLink
            href="/guide"
            icon={<BookOpen size={20} />}
            label="가이드"
          />
          <QuickLink
            href="/about"
            icon={<User size={20} />}
            label="소개"
          />
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-[20px] border border-black/8 bg-white py-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-black/5"
    >
      <div className="mb-2 text-black">{icon}</div>
      <span className="text-xs font-medium text-black/70">{label}</span>
    </Link>
  );
}