import { render } from "preact";
import { useState } from "preact/hooks";
import "./index.css";
import "./themes.css";
import { Login } from "./Login";
import { MainScreen } from "./MainScreen";
import { Theme, getInitialTheme, applyTheme, saveTheme } from "./theme";

// compute & apply initial theme BEFORE app renders
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

/** Logged-in user identity stored in localStorage as "currentUser". */
type User = {
    email: string;
    username: string;
};

/** Root application component: routes between Login and MainScreen and handles theme. */
function App() {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem("currentUser");
        if (!stored) return null;
        try {
            return JSON.parse(stored) as User;
        } catch {
            return null;
        }
    });

    const [theme, setTheme] = useState<Theme>(initialTheme);

    const handleToggleTheme = () => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
        // if user is logged in, save per-user; otherwise only global
        saveTheme(next, user?.email);
    };

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));

        // whatever theme is active right now becomes this user's theme
        saveTheme(theme, loggedInUser.email);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("currentUser");
        // keep global theme as-is
    };

    if (!user) {
        return (
            <Login
                onLoginSuccess={handleLoginSuccess}
                theme={theme}
                onToggleTheme={handleToggleTheme}
            />
        );
    }

    return (
        <MainScreen
            user={user}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={handleToggleTheme}
        />
    );
}

render(<App />, document.getElementById("app"));
