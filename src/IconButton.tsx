import "./IconButton.css";

/** Props for IconButton using Material Symbols icon text. */
type IconButtonProps = {
    iconName?: string;
    buttonContent?: string;
    onClick?: () => void;
};

/** Small icon button (Material Symbols) used for theme toggle and other actions. */
export function IconButton({ iconName, buttonContent, onClick }: IconButtonProps) {
    return (
        <button
            type="button"
            className="IconButton"
            onClick={onClick}
        >
            {/* This span is what turns text into an icon */}
            {iconName && (
                <span className="material-symbols-outlined">
                    {iconName}
                </span>
            )}

            {/* Optional text next to the icon */}
            {buttonContent && <span>{buttonContent}</span>}
        </button>
    );
}
