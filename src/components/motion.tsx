"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Muncul (fade + naik) saat masuk viewport. `delay` dalam ms untuk stagger. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as any;
  return <T ref={ref} className={`reveal ${on ? "in" : ""} ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>{children}</T>;
}

/** Kartu miring 3D mengikuti kursor. Nonaktif di layar sentuh / reduced-motion. */
export function Tilt({ children, className = "", max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const ok = () => typeof window !== "undefined" && window.matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches;
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onMouseMove={(e) => {
        if (!ok() || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ref.current.style.transform = `perspective(1000px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(0)`;
        ref.current.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
        ref.current.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = ""; }}
    >
      {children}
    </div>
  );
}

/** Garis progres scroll tipis di atas halaman. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (ref.current) ref.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return <div aria-hidden="true" className="fixed top-0 inset-x-0 h-[3px] z-30 pointer-events-none"><div ref={ref} className="h-full origin-left bg-gradient-to-r from-know via-create to-impact" style={{ transform: "scaleX(0)" }} /></div>;
}
