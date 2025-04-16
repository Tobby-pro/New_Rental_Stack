// components/ThemeWrapper.tsx
"use client";  // This marks the file as a client-side component

import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeWrapperProps {
  children: ReactNode; // Explicitly define children type
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeWrapper({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = false,
  disableTransitionOnChange = false,
}: ThemeWrapperProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}
