import { TextInput } from "./TextInput";

/** Props for the AuthForm inputs and submit button. */
type AuthFormProps = {
    email: string;
    password: string;
    username: string;
    isRegister: boolean;
    error: string;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onUsernameChange: (value: string) => void;
    onSubmit: () => void;
};

/** Reusable auth form (email/password + optional username) used for login/register. */
export function AuthForm({
    email,
    password,
    username,
    isRegister,
    error,
    onEmailChange,
    onPasswordChange,
    onUsernameChange,
    onSubmit,
}: AuthFormProps) {
    return (
        <div className="login-window-left">
            <span className="logo">🗂️</span>

            <TextInput
                type="email"
                label="Email"
                value={email}
                onChange={onEmailChange}
                onEnter={onSubmit}
            />

            <TextInput
                type="password"
                label="Password"
                value={password}
                onChange={onPasswordChange}
                onEnter={onSubmit}
            />

            {isRegister && (
                <TextInput
                    label="Username"
                    value={username}
                    onChange={onUsernameChange}
                    onEnter={onSubmit}
                />
            )}

            <button type="button" onClick={onSubmit}>
                {isRegister ? "Register" : "Login"}
            </button>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
}
