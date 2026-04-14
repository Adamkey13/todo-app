import "./TextInput.css";

/** Props for a styled text input with floating label and optional Enter handler. */
export type TextInputProps = {
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "password" | "email";
    label: string;
    placeholder?: string;
    onEnter?: () => void;
    autofocus?: boolean;
};
/** Styled text input with floating label and optional auto-focus/Enter submission. */
export function TextInput({
    value,
    onChange,
    type = "text",
    label,
    placeholder = " ",
    onEnter,
    autofocus
}: TextInputProps) {
    return (
        <div className="field">
            <input
                type={type}
                placeholder={placeholder || " "}  
                value={value}
                autoFocus={autofocus}
                onInput={e =>
                    onChange((e.currentTarget as HTMLInputElement).value)
                }
                onKeyDown={
                    onEnter
                        ? e => {
                              if (e.key === "Enter") onEnter();
                          }
                        : undefined
                }
            />
            <label>{label}</label>
        </div>
    );
}
