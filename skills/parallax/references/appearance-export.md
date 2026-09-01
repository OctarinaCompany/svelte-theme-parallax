# Applying an exported appearance

The gallery's Settings page (`/components/settings`) ends with an **Export** section: one JSON
document, copied to the clipboard or downloaded as `parallax-appearance.json`, that describes the
whole look — palette, light/dark mode, both chrome axes, the sidebar's collapsed state and the
Backdrop layers. When a project hands you this document, it means "make it look like this".

## The document

```json
{
	"kit": "parallax",
	"version": 1,
	"appearance": {
		"mode": "dark",
		"palette": "harbor",
		"sidebar": { "chrome": "inverted", "floating": true, "expanded": true },
		"header": { "chrome": "default", "floating": true, "hideOnScroll": false },
		"backdrop": { "gradient": { "look": "none", "…": "…" }, "pattern": {}, "mark": {}, "grain": {} }
	},
	"storage": {
		"mode-watcher-mode": "dark",
		"mode-watcher-theme": "harbor",
		"sidebar-mode": "inverted",
		"sidebar-floating": "true",
		"header-mode": "default",
		"header-floating": "true",
		"header-auto-hide": "false",
		"backdrop-gradient": "none",
		"…": "fifteen more backdrop-* keys"
	},
	"cookie": { "sidebar_state": "true" },
	"apply": "…the procedure, in one paragraph…"
}
```

Two views of one state. **`appearance` is for reading** — nested by surface, named the way the
Settings page names things. **`storage` is for applying**: the appearance state of Parallax IS its
`localStorage` (plus the sidebar's one cookie), and the first-paint script and every appearance hook
read exactly these keys. Every key is present, including layers that are off and adjustments at
their defaults — the export is a complete state, not a diff.

## Which keys the project can honour

A key the project does not know is read by nothing and does no harm — but the look it describes
will be missing. Check what is installed before promising the result:

| Keys                                                         | Needs                                                                                 | Runtime setter                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `mode-watcher-mode`                                          | `mode-watcher` (installed with `parallax-theme`'s post-install steps)                 | `setMode("light" \| "dark" \| "system")` from `mode-watcher`       |
| `mode-watcher-theme`                                         | `parallax-theme`                                                                      | `setTheme(id)` from `$lib/themes`                                  |
| `sidebar-mode`, `header-mode`                                | `parallax-appearance`                                                                 | `setSidebarMode(v)`, `setHeaderMode(v)`                            |
| `sidebar-floating`, `header-floating`, `header-auto-hide`    | `parallax-appearance`                                                                 | `setSidebarFloating(b)`, `setHeaderFloating(b)`, `setHeaderAutoHide(b)` |
| cookie `sidebar_state`                                       | `parallax-shell` (`hooks/sidebar-state.ts` reads it for `Sidebar.Provider`)           | `useSidebar().setOpen(b)`                                          |
| `backdrop-*` (sixteen keys)                                  | **the Backdrop axis — not in the registry yet.** Skip them; say so.                    | —                                                                  |
| the value `"vibrant"` on either mode key                     | `parallax-appearance`, **and its `@import "./vibrant.css";`** — the item writes the file, only the project can import it | the same `setSidebarMode(v)` / `setHeaderMode(v)`                   |

If `appearance.backdrop.mark.on` is true the export also names a file
(`public/backdrop-mark.svg`); it travels only if the Backdrop axis does.

## Procedure

1. **Discover** what is installed (`components.json`, the files listed in the table). Drop the
   rows the project cannot honour and tell the user which, in one sentence each.
2. **Apply the way that matches the intent.**
   - _"Make this the app's look for everyone"_ — change the defaults, not a browser's storage:
     `defaultTheme` / `defaultMode` on `<ModeWatcher />`, and the `DEFAULT_*` constants in the
     installed hooks (`sidebar-mode.svelte.ts`, `header-mode.svelte.ts`,
     `sidebar-behaviour.svelte.ts`, `header-behaviour.svelte.ts` — they are the project's files
     after install). Keep the first-paint script's literals in step with them.
   - _"Make my browser show this look"_ — seed storage once and reload. A one-off in the console:

     ```js
     const doc = /* the pasted parallax-appearance.json */;
     for (const [key, value] of Object.entries(doc.storage)) localStorage.setItem(key, value);
     for (const [key, value] of Object.entries(doc.cookie)) {
     	document.cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
     }
     location.reload();
     ```

   - _From application code_ — call the setters in the table with the `appearance` values; they
     persist and re-resolve reactively, no reload.
3. **Verify** in both modes and at least one non-default palette, as for any styling change; the
   first-paint script must already be in place or the chrome flashes one frame on load
   ([theming.md](theming.md#the-first-paint-script)).

Never write `data-theme`, `class="dark"` or the storage keys from component code — that is what
the setters are for. Seeding storage is a one-off for a browser, not an application pattern.
