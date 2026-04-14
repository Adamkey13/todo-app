/** Theme identifier used across the app. */
export type Theme = "light" | "dark";

function isTheme(value: unknown): value is Theme {
    return value === "light" || value === "dark";
}

/** Reads initial theme from storage (user-specific if available) and returns it. */
export function getInitialTheme(): Theme {
    const currentUserRaw = localStorage.getItem("currentUser");

    // start from global theme or default
    let theme: Theme = "light";
    const storedGlobal = localStorage.getItem("theme");
    if (isTheme(storedGlobal)) {
        theme = storedGlobal;
    }

    // if there is a current user, prefer their saved theme
    if (currentUserRaw) {
        try {
            const user = JSON.parse(currentUserRaw);
            if (user?.email) {
                const storedUserTheme = localStorage.getItem(
                    `theme_${user.email}`,
                );
                if (isTheme(storedUserTheme)) {
                    theme = storedUserTheme;
                }
            }
        } catch {
            // ignore parse errors
        }
    }

    return theme;
}

/** Applies the theme to the document root (e.g., sets data-theme attribute). */
export function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

/** Persists theme choice globally or per-user. */
export function saveTheme(theme: Theme, email?: string) {
    // global default (for when nobody is logged in)
    localStorage.setItem("theme", theme);

    // optional per-user theme
    if (email) {
        localStorage.setItem(`theme_${email}`, theme);
    }
}
