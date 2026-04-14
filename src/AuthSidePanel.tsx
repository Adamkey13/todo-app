/** Props for the auth side panel that explains and toggles login/register mode. */
type AuthSidePanelProps = {
    isRegister: boolean;
    onToggleMode: () => void;
};

/** Side panel for switching between Login and Register modes. */
export function AuthSidePanel({ isRegister, onToggleMode }: AuthSidePanelProps) {
    return (
        <div className="login-window-right">
            <div>
                {isRegister ? (
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

                <button
                    onClick={e => {
                        e.preventDefault();
                        onToggleMode();
                    }}
                >
                    {isRegister ? "Login" : "Register"}
                </button>
            </div>
        </div>
    );
}
