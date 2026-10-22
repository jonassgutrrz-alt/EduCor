"use client";

import React from "react";
import Button from "./Button";
import Card from "./Card";

export const HeroExample: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden dark:bg-slate-950">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Entrance Animation: <h1> heading fades in and slides upward */}
        <h1 className="animate-fade-in-up text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
          Empower Learning with{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Modern Elegance
          </span>
        </h1>

        {/* Entrance Animation: <p> paragraph fades in and slides upward (staggered delay) */}
        <p className="animate-fade-in-up [animation-delay:200ms] mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Experience ultra-responsive, accessible design powered by Next.js and Tailwind CSS.
          Crafted with subtle glassmorphism, dynamic micro-interactions, and fluid typography.
        </p>

        {/* Action Buttons with fluid interactive states */}
        <div className="animate-fade-in-up [animation-delay:350ms] mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg">Explore Courses</Button>
          <Button variant="outline" size="lg">
            Documentation
          </Button>
        </div>

        {/* Feature Cards Showcase */}
        <div className="animate-fade-in-up [animation-delay:500ms] mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          <Card
            title="Fast Performance"
            description="Optimized with Next.js Turbopack and lightweight utility-first styling for instant page loads."
            badge="Performance"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <Card
            title="Glassmorphism UI"
            description="Semi-transparent backdrop filters with border highlights for clean modern depth."
            badge="Design"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            }
          />

          <Card
            title="Micro-interactions"
            description="Smooth hover lifts, gradient glow states, and interactive animated link underlines."
            badge="UX"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
};

export default HeroExample;
