import { useEffect, useRef } from "preact/hooks";
import "./Modal.css";

/** Props for the reusable modal dialog component. */
type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: preact.ComponentChildren;
};

/** Modal dialog overlay that closes on ESC and on outside click, with focus handling. */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  // keep latest onClose without retriggering open-effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);

    // focus only ONCE when it just opened (not on every render)
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setTimeout(() => panelRef.current?.focus(), 0);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div className="modal-panel" ref={panelRef} tabIndex={-1}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button
            className="modal-close"
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
