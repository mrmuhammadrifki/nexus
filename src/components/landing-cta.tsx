"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./ui";

export function LandingCta({
  href,
  children,
  className,
  arrow = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={handleClick}
      aria-busy={isPending}
      className={`${className ?? ""} ${isPending ? "opacity-90 cursor-wait pointer-events-none" : ""}`}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Membuka...</span>
        </span>
      ) : (
        <>
          {children}
          {arrow && <Icon name="arrow" size={18} sw={2.2} />}
        </>
      )}
    </Link>
  );
}
