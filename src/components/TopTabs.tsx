"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/committee", label: "Committee" },
  { href: "/", label: "Submit" },
  { href: "/executive", label: "Executive" }
];

export default function TopTabs(){
  const pathname = usePathname();
  return (
    <nav className="top-tabs">
      {tabs.map(t => {
        const active = (t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href} className={`tab ${active ? 'active' : ''}`}>{t.label}</Link>
        );
      })}
    </nav>
  );
}

