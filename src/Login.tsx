import { useState } from "preact/hooks";
import "./Login.css";
import { TextInput } from "./TextInput";
import { IconButton } from "./IconButton";
import type { Theme } from "./theme";

/** A stored user record in localStorage used by the login/register flow. */
type StoredUser = {
    email: string;
    username: string;
    password: string;
};

/** Props for the Login component. */
type LoginProps = {
    onLoginSuccess: (user: { email: string; username: string }) => void;
    theme: Theme;
    onToggleTheme: () => void;
};

/** Login/Register screen with localStorage-backed users and theme toggle. */
export function Login({ onLoginSuccess, theme, onToggleTheme }: LoginProps) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [register, setRegister] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = () => {
        setError("");

        if (!email || !password || (register && !username)) {
            setError("Please fill in all required fields.");
            return;
        }

        const usersKey = "users";
        const raw = localStorage.getItem(usersKey);
        let users: StoredUser[] = [];

        try {
            users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
        } catch {
            users = [];
        }

        if (register) {
            const existing = users.find(u => u.email === email);
            if (existing) {
                setError("An account with this email already exists.");
                return;
            }

            const newUser: StoredUser = { email, username, password };
            const updatedUsers = [...users, newUser];
            localStorage.setItem(usersKey, JSON.stringify(updatedUsers));

            onLoginSuccess({ email, username });
        } else {
            const found = users.find(
                u => u.email === email && u.password === password,
            );
            if (!found) {
                setError("Wrong email or password.");
                return;
            }

            onLoginSuccess({ email: found.email, username: found.username });
        }
    };

    return (
        <>
            <IconButton
                iconName={theme === "dark" ? "light_mode" : "dark_mode"}
                buttonContent=""
                onClick={onToggleTheme}
            />

            <div className="login-wrapper">
                <div className="login-window-split">
                    <div className="login-window-left">
                        <span className="logo">🗂️</span>

                        <TextInput
                            type="email"
                            label="Email"
                            value={email}
                            onChange={setEmail}
                            onEnter={handleSubmit}
                        />

                        <TextInput
                            type="password"
                            label="Password"
                            value={password}
                            onChange={setPassword}
                            onEnter={handleSubmit}
                        />

                        {register && (
                            <TextInput
                                label="Username"
                                value={username}
                                onChange={setUsername}
                                onEnter={handleSubmit}
                            />
                        )}

                        <button className="button-logreg" type="button" onClick={handleSubmit}>
                            {register ? "Register" : "Login"}
                        </button>

                        {error && (
                            <div className="error-message">{error}</div>
                        )}
                    </div>

                    <div className="login-window-right">
                        <div>
                            {register ? (
                                <>
                                    <h2>Already have an account?</h2>
                                    <div>
                                        Welcome back! Click on the "Login"
                                        button to log back in.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2>Don't have an account yet?</h2>
                                    <div>
                                        Create an Account! Click on the
                                        "Register" button to register.
                                    </div>
                                </>
                            )}

                            <button className="button-logreg" type="button"
                                onClick={e => {
                                    e.preventDefault();
                                    setRegister(!register);
                                    setError("");
                                }}
                            >
                                {register ? "Login" : "Register"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
