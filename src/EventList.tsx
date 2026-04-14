import { useEffect, useMemo, useState } from "preact/hooks";
import "./EventList.css";
import { Modal } from "./Modal";

/** A calendar event stored per-user in localStorage. */
export type EventItem = {
  id: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
};

type EventListProps = {
  userEmail: string;
  /** If set, only events for this date are shown */
  selectedDate?: Date | null;
};

function storageKey(email: string) {
  return `events_${email}`;
}

function normalizeDateOnly(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Event list with add/edit/delete and optional date filtering. */
export function EventList({ userEmail, selectedDate }: EventListProps) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const openEdit = (item: EventItem) => {
    setEditId(item.id);
    setEditTitle(item.title);
    setEditDate(item.date);
    setEditDescription(item.description || "");
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editId) return;
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    setItems(prev =>
      prev.map(it =>
        it.id !== editId
          ? it
          : {
              ...it,
              title: trimmed,
              date: editDate,
              description: editDescription.trim() || undefined,
            },
      ),
    );

    setEditOpen(false);
    setEditId(null);
  };

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userEmail));
      const parsed = raw ? (JSON.parse(raw) as EventItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [userEmail]);

  // save + notify others (calendar markers)
  useEffect(() => {
    localStorage.setItem(storageKey(userEmail), JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("events-changed", { detail: { email: userEmail } }),
    );
  }, [userEmail, items]);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (!newDate) return;

    const newItem: EventItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title: trimmed,
      date: newDate,
      description: undefined,
    };

    setItems(prev => [...prev, newItem]);
    setNewTitle("");
    setNewDate("");
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(e => e.id !== id));
  };

  const filteredItems = useMemo(() => {
    if (!selectedDate) return items;
    const ymd = toLocalYMD(normalizeDateOnly(selectedDate));
    return items.filter(e => e.date === ymd);
  }, [items, selectedDate]);

  return (
    <div className="event-panel">
      <div className="event-header">
        <h2>Events</h2>
        {selectedDate && (
          <span className="event-selected-date">
            {selectedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </span>
        )}
      </div>

      <form
        className="event-add-form"
        onSubmit={e => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <input
          className="event-input-title"
          type="text"
          placeholder="New event..."
          value={newTitle}
          onInput={e => setNewTitle((e.currentTarget as HTMLInputElement).value)}
        />
        <input
          className="event-input-date"
          type="date"
          value={newDate}
          onInput={e => setNewDate((e.currentTarget as HTMLInputElement).value)}
        />
        <button className="event-add-btn" type="submit">
          Add
        </button>
      </form>

      <div className="event-list">
        {filteredItems.length === 0 ? (
          <div className="event-empty">
            No events{selectedDate ? " for this day" : ""} yet.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="event-item"
              onClick={() => openEdit(item)}
              role="button"
              tabIndex={0}
            >
              <div className="event-main">
                <div className="event-title">{item.title}</div>
                <div className="event-meta">
                  <span className="event-date">{item.date}</span>
                </div>
              </div>

              <button
                type="button"
                className="event-delete"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={editOpen} title="Edit event" onClose={() => setEditOpen(false)}>
        <div className="event-edit-form">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label>
              Title
              <input
                className="event-input-title"
                type="text"
                value={editTitle}
                onInput={e => setEditTitle((e.currentTarget as HTMLInputElement).value)}
              />
            </label>

            <label>
              Date
              <input
                className="event-input-date"
                type="date"
                value={editDate}
                onInput={e => setEditDate((e.currentTarget as HTMLInputElement).value)}
              />
            </label>

            <label>
              Description
              <textarea
                className="event-input-desc"
                rows={5}
                value={editDescription}
                onInput={e =>
                  setEditDescription((e.currentTarget as HTMLTextAreaElement).value)
                }
              />
            </label>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" className="event-add-btn" onClick={saveEdit}>
                Save
              </button>
              <button type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
