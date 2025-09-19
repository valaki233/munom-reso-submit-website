"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, FileIcon, HomeIcon, UsersIcon } from "./Icons";

const items = [
  { href: "/home", icon: HomeIcon },
  { href: "/schedule", icon: CalendarIcon },
  { href: "/", icon: UsersIcon, primary: true },
  { href: "/documents", icon: FileIcon },
  { href: "/more", icon: FileIcon }
];

export default function BottomNav(){
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {items.map(({href, icon: Icon, primary}) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav-item ${active && primary ? 'active' : ''}`}>
            {primary ? (
              <span className="bubble"><Icon/></span>
            ) : (
              <Icon/>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

