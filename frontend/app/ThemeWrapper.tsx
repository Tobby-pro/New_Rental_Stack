"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ThemeWrapperProps {
  children: ReactNode;
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
  disableTransitionOnChange: boolean;
  ssr?: boolean; // ✅ Add this line
}

export default function ThemeWrapper({
  children,
  attribute,
  defaultTheme,
  enableSystem,
  disableTransitionOnChange,
}: ThemeWrapperProps) {
  return (
    <ThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </ThemeProvider>
  );
}
