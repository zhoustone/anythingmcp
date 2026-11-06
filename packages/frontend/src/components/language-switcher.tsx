'use client';

import { LOCALE_LABELS, LOCALE_NAMES, SUPPORTED_LOCALES } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';

/** Two-way language picker, shown on the sign-in page and in the sidebar. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('common.switchLanguage')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] p-0.5',
        className,
      )}
    >
      {SUPPORTED_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-label={LOCALE_NAMES[option]}
          aria-pressed={locale === option}
          className={cn(
            'rounded-[7px] px-2 py-1 text-[11px] font-semibold transition-colors',
            locale === option
              ? 'bg-[var(--brand-tint)] text-[var(--brand)]'
              : 'text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
          )}
        >
          {LOCALE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
