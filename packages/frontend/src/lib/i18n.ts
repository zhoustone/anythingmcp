/**
 * Minimal, dependency-free message catalogue for the Admin UI.
 *
 * Two kinds of keys are accepted by `t`:
 *  - namespaced keys defined in `en` (`nav.dashboard`, `login.signIn`, …).
 *    The `zh` counterpart is type-checked, so a missing translation is a
 *    compile error.
 *  - the English source text itself (`t('Save changes')`). These live in
 *    `i18n.zh.ts` and are also picked up by `AutoTranslate`, which lets pages
 *    keep their existing JSX while still being localised. Unknown text is
 *    returned unchanged, so data, user input and untranslated strings are
 *    never altered.
 *
 * The locale is carried in a cookie rather than a route prefix so the flat
 * App Router paths and the auth gate in `proxy.ts` stay untouched.
 */

import { zhPhrases } from '@/lib/i18n.zh';

export const SUPPORTED_LOCALES = ['en', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'amcp_locale';

/** Language names are written in their own language, as a picker should. */
export const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', zh: '中文' };
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', zh: '简体中文' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Cookie values are untrusted input: anything outside the allowlist is English. */
export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

const en = {
  'common.language': 'Language',
  'common.switchLanguage': 'Switch language',
  'common.openNavigation': 'Open navigation',
  'common.toggleTheme': 'Toggle theme',

  'nav.overview': 'Overview',
  'nav.build': 'Build',
  'nav.intelligence': 'Intelligence',
  'nav.getStarted': 'Get started',
  'nav.dashboard': 'Dashboard',
  'nav.analytics': 'Analytics',
  'nav.auditLog': 'Audit Log',
  'nav.connectors': 'Connectors',
  'nav.marketplace': 'Marketplace',
  'nav.mcpServers': 'MCP Servers',
  'nav.knowledgeGraph': 'Knowledge Graph',
  'nav.aiSkills': 'AI Skills',
  'nav.setupOnboarding': 'Setup & onboarding',
  'nav.settings': 'Settings',
  'nav.switchWorkspace': 'Switch workspace',
  'nav.logOut': 'Log out',
  'nav.workspace': 'Workspace',

  'login.tagline': 'Create custom connectors for Claude, ChatGPT, Copilot, Meta Muse and any AI agent',
  'login.cloudTagline': '7-day free trial · no credit card · connect Claude, ChatGPT, Copilot, Cursor or Meta Muse to your tools.',
  'login.signIn': 'Sign in',
  'login.createAccount': 'Create your account',
  'login.createFreeAccount': 'Create your free account',
  'login.name': 'Name',
  'login.yourName': 'Your name',
  'login.email': 'Email',
  'login.workEmail': 'Work email',
  'login.password': 'Password',
  'login.minPassword': 'Min. 8 characters',
  'login.confirmPassword': 'Confirm Password',
  'login.repeatPassword': 'Repeat your password',
  'login.recoveryCode': 'Recovery code',
  'login.recoveryHint': 'One of the codes you saved when setting up single sign-on. Each works once.',
  'login.acceptTerms': 'I accept the',
  'login.termsOfUse': 'Terms of Use',
  'login.andHaveRead': 'and have read the',
  'login.privacyPolicy': 'Privacy Policy',
  'login.or': 'or',
  'login.signingYouIn': 'Signing you in…',
  'login.loading': 'Loading...',
  'login.submitSignIn': 'Sign In',
  'login.submitRegister': 'Create Account',
  'login.submitTrial': 'Start free trial →',
  'login.submitRecovery': 'Sign in with recovery code',
  'login.encryptedNote': 'Encrypted with AES-256-GCM · hosted in Frankfurt, Germany',
  'login.forgotPassword': 'Forgot password?',
  'login.useRecoveryCode': 'Use a recovery code',
  'login.backToPassword': 'Back to password sign-in',
  'login.noAccount': "Don't have an account?",
  'login.hasAccount': 'Already have an account?',
  'login.register': 'Register',
  'login.emailVerified': 'Email verified successfully! You can now sign in.',
  'login.ruleLength': 'At least 8 characters',
  'login.ruleUppercase': 'One uppercase letter',
  'login.ruleLowercase': 'One lowercase letter',
  'login.ruleNumber': 'One number',
  'login.ruleSpecial': 'One special character',
  'login.errorPasswordStrength': 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
  'login.errorPasswordsMismatch': 'Passwords do not match',
  'login.errorAcceptTerms': 'You must accept the Terms of Use',
  'login.errorAuthFailed': 'Authentication failed',
  'login.errorSsoCode': 'Sign-in code is invalid or has expired',
  'login.errorSignInFailed': 'Sign-in failed',
} as const;

/** Keeps autocomplete for namespaced keys while allowing plain source text. */
export type MessageKey = keyof typeof en | (string & {});

const zhNamespaced: Record<keyof typeof en, string> = {
  'common.language': '语言',
  'common.switchLanguage': '切换语言',
  'common.openNavigation': '打开导航',
  'common.toggleTheme': '切换主题',

  'nav.overview': '概览',
  'nav.build': '构建',
  'nav.intelligence': '智能',
  'nav.getStarted': '快速开始',
  'nav.dashboard': '仪表盘',
  'nav.analytics': '数据分析',
  'nav.auditLog': '审计日志',
  'nav.connectors': '连接器',
  'nav.marketplace': '连接器市场',
  'nav.mcpServers': 'MCP 服务',
  'nav.knowledgeGraph': '知识图谱',
  'nav.aiSkills': 'AI 技能',
  'nav.setupOnboarding': '安装与引导',
  'nav.settings': '设置',
  'nav.switchWorkspace': '切换工作区',
  'nav.logOut': '退出登录',
  'nav.workspace': '工作区',

  'login.tagline': '为 Claude、ChatGPT、Copilot、Meta Muse 及各类 AI 智能体创建自定义连接器',
  'login.cloudTagline': '7 天免费试用 · 无需信用卡 · 将 Claude、ChatGPT、Copilot、Cursor 或 Meta Muse 连接到你的工具。',
  'login.signIn': '登录',
  'login.createAccount': '创建账户',
  'login.createFreeAccount': '免费创建账户',
  'login.name': '姓名',
  'login.yourName': '您的姓名',
  'login.email': '邮箱',
  'login.workEmail': '工作邮箱',
  'login.password': '密码',
  'login.minPassword': '至少 8 个字符',
  'login.confirmPassword': '确认密码',
  'login.repeatPassword': '再次输入密码',
  'login.recoveryCode': '恢复码',
  'login.recoveryHint': '设置单点登录时保存的恢复码之一，每个仅可使用一次。',
  'login.acceptTerms': '我已阅读并接受',
  'login.termsOfUse': '使用条款',
  'login.andHaveRead': '以及',
  'login.privacyPolicy': '隐私政策',
  'login.or': '或',
  'login.signingYouIn': '正在登录…',
  'login.loading': '加载中…',
  'login.submitSignIn': '登录',
  'login.submitRegister': '创建账户',
  'login.submitTrial': '开始免费试用 →',
  'login.submitRecovery': '使用恢复码登录',
  'login.encryptedNote': '采用 AES-256-GCM 加密 · 托管于德国法兰克福',
  'login.forgotPassword': '忘记密码？',
  'login.useRecoveryCode': '使用恢复码',
  'login.backToPassword': '返回密码登录',
  'login.noAccount': '还没有账户？',
  'login.hasAccount': '已有账户？',
  'login.register': '注册',
  'login.emailVerified': '邮箱验证成功！现在可以登录了。',
  'login.ruleLength': '至少 8 个字符',
  'login.ruleUppercase': '一个大写字母',
  'login.ruleLowercase': '一个小写字母',
  'login.ruleNumber': '一个数字',
  'login.ruleSpecial': '一个特殊字符',
  'login.errorPasswordStrength': '密码至少 8 位，且需包含大写字母、小写字母、数字和特殊字符',
  'login.errorPasswordsMismatch': '两次输入的密码不一致',
  'login.errorAcceptTerms': '请先接受使用条款',
  'login.errorAuthFailed': '登录失败',
  'login.errorSsoCode': '登录码无效或已过期',
  'login.errorSignInFailed': '登录失败',
};

type Dictionary = Record<string, string>;
const dictionaries: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  zh: { ...zhNamespaced, ...zhPhrases },
};

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? (en as Dictionary)[key] ?? key;
}

/**
 * Exact-match lookup used by `AutoTranslate`. Returns null when there is no
 * translation, so caller keeps the original string (never a partial rewrite).
 */
export function lookupPhrase(locale: Locale, text: string): string | null {
  if (locale === DEFAULT_LOCALE) return null;
  return dictionaries[locale][text] ?? null;
}
