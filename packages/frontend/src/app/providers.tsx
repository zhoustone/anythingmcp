'use client';

import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n-context';
import type { Locale } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/components/toast';
import { OnboardingRedirect } from '@/components/onboarding-redirect';

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale={locale}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            {/* No DOM; runs the welcome-wizard gate on every navigation. */}
            <OnboardingRedirect />
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
