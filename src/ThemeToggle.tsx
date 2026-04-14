import { IconButton } from "./IconButton";

/** Props for the theme toggle button. */
type ThemeToggleProps = {
    theme: "light" | "dark";
    onToggle: () => void;
};

/** Theme toggle wrapper around IconButton. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    return (
        <IconButton
            iconName={theme === "dark" ? "light_mode" : "dark_mode"}
            buttonContent=""
            onClick={onToggle}
        />
    );
}
