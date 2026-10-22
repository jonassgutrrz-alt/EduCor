"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "./Button";

export interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Courses", href: "#courses" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* Glassmorphic Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-3 flex h-16 items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-4 shadow-sm backdrop-blur-md transition-all dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-slate-950/20 sm:px-6">
          
          {/* Logo with Smooth Hover Rotation */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 ease-in-out group-hover:rotate-6 group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Edu<span className="text-indigo-600 dark:text-indigo-400">Cor</span>
            </span>
          </Link>

          {/* Desktop Navigation Links with Left-to-Right Animated Underline */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
              >
                {item.label}
                {/* Animated Underline: Expands smoothly from left to right */}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 ease-out group-hover:w-full dark:bg-indigo-400" />
              </Link>
            ))}
          </nav>

          {/* Desktop Call-to-Action */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors dark:text-slate-200 dark:hover:text-indigo-400"
            >
              Log in
            </Link>
            <Button size="sm">Get Started</Button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown with Glassmorphism */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-white/30 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/85">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <Button fullWidth size="md">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
