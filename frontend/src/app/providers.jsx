'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProviderShell } from '@/context/ThemeContext';

export function Providers({ children }) {
  return (
    <ThemeProviderShell>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProviderShell>
  );
}
