import React from "react";

/**
 * Next.js App Router Template
 * 
 * In Next.js App Router, `layout.tsx` preserves state and DOES NOT remount
 * across route navigations. `template.tsx` instantiates anew on every route change,
 * automatically applying the page transition to every `page.tsx` file in the project
 * without requiring any manual wrapping or boilerplate.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition min-h-full w-full flex flex-col flex-1">
      {children}
    </div>
  );
}
