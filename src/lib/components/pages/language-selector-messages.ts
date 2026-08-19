import { LOCALES, type Locale } from "$lib/components/ui/language-selector/index.js";

/**
 * The demo dictionary the Language selector page translates itself with — page-only data, and
 * deliberately not part of the component.
 *
 * WHY IT LIVES HERE. `<LanguageSelector>` moves a locale code and translates nothing; a dictionary
 * shipped inside it would be a dictionary every application has to delete. This one exists so the
 * page can show what a caller DOES with the code it receives, which is the only part of i18n a
 * component page can honestly demonstrate.
 *
 * The key shape is shadcn-admin-kit's (https://marmelab.com/shadcn-admin-kit/docs/translation/):
 * dotted paths, `ra.*` for the strings a framework owns and an application prefix for the rest.
 * Its `i18nProvider` is `translate` / `changeLocale` / `getLocale` plus an optional `getLocales`,
 * and the split maps onto this page exactly — {@link translate} is the first, the page's own
 * `$state` is the second and third, and the catalog passed to the component is the fourth.
 */

/** Every string the demo panel renders. */
export const MESSAGE_KEYS = [
	"app.welcome",
	"app.dashboard",
	"app.settings",
	"app.language",
	"ra.action.save",
	"ra.action.cancel",
	"ra.action.delete",
	"ra.page.empty",
	"ra.notification.updated",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

/**
 * The dictionaries.
 *
 * `en` is complete and typed as such — it is the fallback, so a key missing from it would be a key
 * with no answer anywhere. Every other locale is `Partial`, which is not a formality: `ko` below is
 * deliberately missing three strings, so the page has a real gap to show rather than a staged one.
 *
 * `pt` is Brazilian Portuguese — `Salvar`, not European `Guardar`. Which is precisely the point
 * shadcn-admin-kit's docs open with: a locale is a language AND, where the two disagree, a country.
 * Upstream's catalog labels this row `Português` with the code `pt`, so the label promises less
 * than the strings deliver; an application that cares ships `pt-BR` and `pt-PT` as two entries.
 */
export const MESSAGES: {
	readonly en: Readonly<Record<MessageKey, string>>;
	readonly [code: string]: Readonly<Partial<Record<MessageKey, string>>>;
} = {
	en: {
		"app.welcome": "Welcome back",
		"app.dashboard": "Dashboard",
		"app.settings": "Settings",
		"app.language": "Language",
		"ra.action.save": "Save",
		"ra.action.cancel": "Cancel",
		"ra.action.delete": "Delete",
		"ra.page.empty": "No records found",
		"ra.notification.updated": "Element updated",
	},
	es: {
		"app.welcome": "Bienvenido de nuevo",
		"app.dashboard": "Panel",
		"app.settings": "Configuración",
		"app.language": "Idioma",
		"ra.action.save": "Guardar",
		"ra.action.cancel": "Cancelar",
		"ra.action.delete": "Eliminar",
		"ra.page.empty": "No se encontraron registros",
		"ra.notification.updated": "Elemento actualizado",
	},
	fr: {
		"app.welcome": "Bon retour",
		"app.dashboard": "Tableau de bord",
		"app.settings": "Paramètres",
		"app.language": "Langue",
		"ra.action.save": "Enregistrer",
		"ra.action.cancel": "Annuler",
		"ra.action.delete": "Supprimer",
		"ra.page.empty": "Aucun enregistrement trouvé",
		"ra.notification.updated": "Élément mis à jour",
	},
	de: {
		"app.welcome": "Willkommen zurück",
		"app.dashboard": "Übersicht",
		"app.settings": "Einstellungen",
		"app.language": "Sprache",
		"ra.action.save": "Speichern",
		"ra.action.cancel": "Abbrechen",
		"ra.action.delete": "Löschen",
		"ra.page.empty": "Keine Einträge gefunden",
		"ra.notification.updated": "Element aktualisiert",
	},
	pt: {
		"app.welcome": "Bem-vindo de volta",
		"app.dashboard": "Painel",
		"app.settings": "Configurações",
		"app.language": "Idioma",
		"ra.action.save": "Salvar",
		"ra.action.cancel": "Cancelar",
		"ra.action.delete": "Excluir",
		"ra.page.empty": "Nenhum registro encontrado",
		"ra.notification.updated": "Elemento atualizado",
	},
	ja: {
		"app.welcome": "おかえりなさい",
		"app.dashboard": "ダッシュボード",
		"app.settings": "設定",
		"app.language": "言語",
		"ra.action.save": "保存",
		"ra.action.cancel": "キャンセル",
		"ra.action.delete": "削除",
		"ra.page.empty": "レコードが見つかりません",
		"ra.notification.updated": "要素を更新しました",
	},
	zh: {
		"app.welcome": "欢迎回来",
		"app.dashboard": "仪表板",
		"app.settings": "设置",
		"app.language": "语言",
		"ra.action.save": "保存",
		"ra.action.cancel": "取消",
		"ra.action.delete": "删除",
		"ra.page.empty": "未找到记录",
		"ra.notification.updated": "元素已更新",
	},
	// Deliberately incomplete: the three `ra.*` strings below `cancel` are absent, so the page's
	// fallback demo has something real to fall back FROM, and the completion bar it derives is a
	// measurement rather than a decoration.
	ko: {
		"app.welcome": "다시 오신 것을 환영합니다",
		"app.dashboard": "대시보드",
		"app.settings": "설정",
		"app.language": "언어",
		"ra.action.save": "저장",
		"ra.action.cancel": "취소",
	},
	ar: {
		"app.welcome": "مرحبًا بعودتك",
		"app.dashboard": "لوحة التحكم",
		"app.settings": "الإعدادات",
		"app.language": "اللغة",
		"ra.action.save": "حفظ",
		"ra.action.cancel": "إلغاء",
		"ra.action.delete": "حذف",
		"ra.page.empty": "لا توجد سجلات",
		"ra.notification.updated": "تم تحديث العنصر",
	},
};

/** The locale every lookup falls back to, and the only dictionary required to be complete. */
export const FALLBACK_LOCALE = "en";

/**
 * `translate(key)` for one locale — the whole of the `i18nProvider` interface this page needs.
 *
 * A missing string falls back to English rather than rendering the key. shadcn-admin-kit's own FAQ
 * asks what happens to a missing translation, and a raw `ra.action.delete` in the middle of a
 * button is the answer nobody wants: it is unreadable in every language, where the fallback is at
 * least readable in one.
 */
export function translate(locale: string, key: MessageKey): string {
	return MESSAGES[locale]?.[key] ?? MESSAGES[FALLBACK_LOCALE][key];
}

/** Whether this locale answers `key` itself, rather than borrowing English for it. */
export function isTranslated(locale: string, key: MessageKey): boolean {
	return MESSAGES[locale]?.[key] !== undefined;
}

/**
 * How much of the dictionary a locale actually carries, 0-100.
 *
 * COUNTED, NOT DECLARED. Hard-coding "82%" beside a language would make the completion bar a
 * decoration that cannot go stale because it was never true; deriving it from the dictionary means
 * the bar moves the moment a string is added, and that `ko` reads low because it IS.
 */
export function completionOf(locale: string): number {
	const translated = MESSAGE_KEYS.filter((key) => isTranslated(locale, key)).length;
	return Math.round((translated / MESSAGE_KEYS.length) * 100);
}

/** The block's own eight locales, each carrying its measured completion. */
export const MEASURED_LOCALES: readonly Locale[] = LOCALES.map((locale) => ({
	...locale,
	completion: completionOf(locale.code),
}));

/**
 * The eight, plus Arabic — the page's right-to-left case.
 *
 * Arabic is not in upstream's catalog and is added here rather than to `LOCALES`, because that
 * constant is the theme and this is the demo. It is the entry that makes `Locale.dir` worth having:
 * every other row would render identically with the field removed.
 */
export const RTL_LOCALES: readonly Locale[] = [
	...LOCALES,
	{ code: "ar", nativeName: "العربية", englishName: "Arabic", dir: "rtl" },
];
