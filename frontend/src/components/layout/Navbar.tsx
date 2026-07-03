"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { PaintFan } from "@/components/ui/PaintFan";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Colours", href: "/colours" },
  { label: "Products", href: "/products" },
  { label: "AI Studio", href: "/ai-studio" },
  { label: "Site Survey", href: "/survey" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const mobileOpen = useUiStore((s) => s.mobileMenuOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileMenuOpen);
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-[100] h-nav text-ink transition-[background-color,border-color,backdrop-filter] duration-[400ms] ease-out border-b",
          scrolled
            ? "bg-ivory/95 backdrop-blur-[20px] border-[rgba(201,168,76,0.2)]"
            : "bg-transparent border-transparent",
        )}
      >
        <div className="mx-auto flex h-full items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3" aria-label="Kamlesh Paints & Hardware — home">
            <PaintFan size={34} />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-[18px] font-bold">Kamlesh Paints</span>
              <span className="font-sans text-[10px] font-medium uppercase tracking-[3px] text-orange">
                &amp; Hardware · Birla Opus Dealer
              </span>
            </span>
          </Link>

          {/* Centre links */}
          <ul className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="relative font-sans text-[13px] font-medium after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-orange after:transition-transform after:duration-[250ms] after:ease-out hover:after:scale-x-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link href="/products" aria-label="Search products" className="hidden sm:block transition-opacity hover:opacity-70">
              <Search size={18} strokeWidth={2} />
            </Link>
            <Link href="/favourites" aria-label="Favourites" className="relative hidden transition-opacity hover:opacity-70 sm:block">
              <Heart size={18} strokeWidth={2} fill={mounted && wishCount > 0 ? "currentColor" : "none"} className={mounted && wishCount > 0 ? "text-coral" : ""} />
              {mounted && wishCount > 0 && (
                <motion.span
                  key={wishCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.35 }}
                  className="absolute -right-2.5 -top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-coral font-sans text-[10px] font-bold text-white"
                >
                  {wishCount}
                </motion.span>
              )}
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative transition-opacity hover:opacity-70">
              <ShoppingCart size={18} strokeWidth={2} />
              <motion.span
                key={mounted ? count : 0}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.35 }}
                className="absolute -right-2.5 -top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-orange font-sans text-[10px] font-bold text-white"
              >
                {mounted ? count : 0}
              </motion.span>
            </Link>
            <Link
              href={mounted && isAuthenticated ? "/profile" : "/login"}
              aria-label={mounted && isAuthenticated ? "Your account" : "Log in"}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            >
              <User size={18} strokeWidth={2} />
              {mounted && isAuthenticated && user?.full_name && (
                <span className="hidden font-sans text-[13px] font-medium lg:inline">
                  {user.full_name.split(" ")[0]}
                </span>
              )}
            </Link>
            <Link
              href="/#calculator"
              className="hidden rounded-btn border-[1.5px] border-current px-5 py-[9px] font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-colors duration-200 hover:border-orange hover:bg-orange hover:text-white md:block"
            >
              Get Estimate →
            </Link>
            <button
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              className="absolute right-6 top-6 text-ink"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={28} />
            </button>
            <ul className="flex flex-col items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    className="font-display text-[36px] font-bold text-ink"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.05, duration: 0.35 }}
              >
                <Link
                  href={mounted && isAuthenticated ? "/profile" : "/login"}
                  className="font-display text-[36px] font-bold text-orange"
                  onClick={() => setMobileOpen(false)}
                >
                  {mounted && isAuthenticated ? "My Account" : "Log In"}
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
