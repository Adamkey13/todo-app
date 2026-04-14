import { useEffect, useMemo, useState } from "preact/hooks";
import "./TodoList.css";
import { Modal } from "./Modal";

/** Status of a todo item. */
export type TodoStatus = "todo" | "done";
type TodoView = "active" | "done";

/** A single todo item stored per-user in localStorage. */
export type TodoItem = {
    id: string;
    title: string;
    description?: string;
    dueDate?: string; // ISO Date string: "YYYY-MM-DD"
    status: TodoStatus;
};

/** Props for the TodoList component with optional date filtering. */
type TodoListProps = {
    userEmail: string;
    /** If set, only tasks for this date are shown */
    selectedDate?: Date | null;
};

function storageKey(email: string) {
    return `todos_${email}`;
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


function diffInDays(from: Date, to: Date) {
    const a = normalizeDateOnly(from).getTime();
    const b = normalizeDateOnly(to).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((b - a) / msPerDay);
}

function notifKey(email: string) {
    return `todo_notified_${email}`; // stores { [todoId]: "YYYY-MM-DD" }
}

function getTodayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Todo list with persistence, edit modal, active/done views, and browser notifications.
 * Notifications fire for tasks due tomorrow (once per task per day).
 */
export function TodoList({ userEmail, selectedDate }: TodoListProps) {
    const [items, setItems] = useState<TodoItem[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [newDueDate, setNewDueDate] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [view, setView] = useState<TodoView>("active");

    const [notifPerm, setNotifPerm] = useState(
        ("Notification" in window) ? Notification.permission : "denied",
    );


    const openEdit = (item: TodoItem) => {
        setEditId(item.id);
        setEditTitle(item.title);
        setEditDueDate(item.dueDate || "");
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
                        dueDate: editDueDate || undefined,
                        description: editDescription.trim() || undefined,
                    },
            ),
        );

        setEditOpen(false);
        setEditId(null);
    };


    // --- load from localStorage when user changes ---
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey(userEmail));
            if (!raw) {
                setItems([]);
                return;
            }
            const parsed = JSON.parse(raw) as TodoItem[];
            setItems(Array.isArray(parsed) ? parsed : []);
        } catch {
            setItems([]);
        }
    }, [userEmail]);

    // --- save to localStorage on every change ---
    useEffect(() => {
        localStorage.setItem(storageKey(userEmail), JSON.stringify(items));
        window.dispatchEvent(
            new CustomEvent("todos-changed", { detail: { email: userEmail } }),
        );
    }, [userEmail, items]);


    const handleAdd = () => {
        const trimmed = newTitle.trim();
        if (!trimmed) return;

        const newItem: TodoItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            title: trimmed,
            dueDate: newDueDate || undefined,
            status: "todo",
        };

        setItems(prev => [...prev, newItem]);
        setNewTitle("");
        setNewDueDate("");
    };

    const handleToggleStatus = (id: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id !== id
                    ? item
                    : { ...item, status: item.status === "todo" ? "done" : "todo" },
            ),
        );
    };



    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // Filter tasks by selected date (if provided)
    const filteredItems = useMemo(() => {
        if (!selectedDate) return items;

        const selectedYmd = toLocalYMD(normalizeDateOnly(selectedDate));
        return items.filter(item => item.dueDate && item.dueDate === selectedYmd);
    }, [items, selectedDate]);

    const viewItems = useMemo(() => {
        const base = filteredItems;
        return base.filter(item =>
            view === "active" ? item.status === "todo" : item.status === "done"
        );
    }, [filteredItems, view]);



    const today = normalizeDateOnly(new Date());
    const tasksDueTomorrow = viewItems.filter(item => {
        if (!item.dueDate) return false;
        const due = new Date(item.dueDate);
        const diff = diffInDays(today, due);
        return diff === 1 && item.status !== "done";
    });

    useEffect(() => {
        if (!("Notification" in window)) return;
        if (notifPerm !== "granted") return;

        const run = () => {
            const todayYmd = getTodayYMD();

            // load last-notified map
            let notified: Record<string, string> = {};
            try {
                const raw = localStorage.getItem(notifKey(userEmail));
                notified = raw ? (JSON.parse(raw) as Record<string, string>) : {};
            } catch {
                notified = {};
            }

            // notify tasks due tomorrow (and not done)
            const today = normalizeDateOnly(new Date());
            for (const item of items) {
                if (!item.dueDate) continue;
                if (item.status === "done") continue;

                const due = new Date(item.dueDate);
                const diff = diffInDays(today, due);

                if (diff === 1) {
                    // already notified today for this task?
                    if (notified[item.id] === todayYmd) continue;

                    new Notification("⚠️ Task due tomorrow", {
                        body: item.title,
                    });

                    notified[item.id] = todayYmd;
                }
            }

            localStorage.setItem(notifKey(userEmail), JSON.stringify(notified));
        };

        // run once now + then periodically
        run();
        const id = window.setInterval(run, 60_000); // every 1 minute
        return () => window.clearInterval(id);
    }, [userEmail, items, notifPerm]);


    return (
        <div className="todo-panel">
            


            <div className="todo-view-toggle">
                <button
                    type="button"
                    className={"todo-view-btn" + (view === "active" ? " is-active" : "")}
                    onClick={() => setView("active")}
                >
                    Active
                </button>
                <button
                    type="button"
                    className={"todo-view-btn" + (view === "done" ? " is-active" : "")}
                    onClick={() => setView("done")}
                >
                    Done
                </button>
            </div>

            <div className="todo-header">
                <h2>To-Do list</h2>
                {selectedDate && (
                    <span className="todo-selected-date">
                        {selectedDate.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                        })}
                    </span>
                )}
            </div>

            {tasksDueTomorrow.length > 0 && (
                <div className="todo-warning">
                    ⚠️ {tasksDueTomorrow.length} task(s) due tomorrow!
                </div>
            )}

            <form
                className="todo-add-form"
                onSubmit={e => {
                    e.preventDefault();
                    handleAdd();
                }}
            >
                <input
                    className="todo-input-title"
                    type="text"
                    placeholder="New task..."
                    value={newTitle}
                    onInput={e =>
                        setNewTitle((e.currentTarget as HTMLInputElement).value)
                    }
                />
                <input
                    className="todo-input-date"
                    type="date"
                    value={newDueDate}
                    onInput={e =>
                        setNewDueDate((e.currentTarget as HTMLInputElement).value)
                    }
                />
                <button className="todo-add-btn" type="submit">
                    Add
                </button>
            </form>

            <div className="todo-list">
                {viewItems.length === 0 ? (
                    <div className="todo-empty">
                        No tasks{selectedDate ? " for this day" : ""} yet.
                    </div>
                ) : (
                    viewItems.map(item => {
                        const dueLabel = (() => {
                            if (!item.dueDate) return "";
                            const due = new Date(item.dueDate);
                            const diff = diffInDays(today, due);
                            if (diff === 0) return "Due today";
                            if (diff === 1) return "Due tomorrow";
                            if (diff < 0) return "Overdue";
                            return `Due in ${diff} days`;
                        })();

                        return (
                            <div
                                key={item.id}
                                className={`todo-item todo-item-${item.status}`}
                                onClick={() => openEdit(item)}
                                role="button"
                                tabIndex={0}
                            >
                                <button
                                    type="button"
                                    className="todo-status"
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleToggleStatus(item.id);
                                    }}
                                    title="Click to change status"
                                >
                                    {item.status === "todo" ? "⬜" : "✅"}

                                </button>

                                <div className="todo-main">
                                    <div className="todo-title">{item.title}</div>
                                    <div className="todo-meta">
                                        {item.dueDate && (
                                            <span className="todo-due">{dueLabel}</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="todo-delete"
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleDelete(item.id);
                                    }}
                                    title="Delete"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {"Notification" in window && notifPerm !== "granted" && (
                <button
                    type="button"
                    className="todo-add-btn"
                    onClick={async () => {
                        try {
                            const res = await Notification.requestPermission();
                            setNotifPerm(res); // <-- makes it disappear instantly if granted
                        } catch {
                            // ignore
                        }
                    }}
                >
                    Enable notifications
                </button>
            )}


            <Modal

                open={editOpen}
                title="Edit task"
                onClose={() => setEditOpen(false)}
            >
                <div className="todo-edit-form">
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label>
                            Title
                            <input
                                className="todo-input-title"
                                type="text"
                                value={editTitle}
                                onInput={e => setEditTitle((e.currentTarget as HTMLInputElement).value)}
                            />
                        </label>

                        <label>
                            Due date
                            <input
                                className="todo-input-date"
                                type="date"
                                value={editDueDate}
                                onInput={e => setEditDueDate((e.currentTarget as HTMLInputElement).value)}
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                className="todo-input-desc"
                                rows={5}
                                value={editDescription}
                                onInput={e => setEditDescription((e.currentTarget as HTMLTextAreaElement).value)}
                            />
                        </label>

                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button type="button" className="todo-add-btn" onClick={saveEdit}>
                                Save
                            </button>
                            <button type="button" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div >
            </Modal>
        </div>
    );
}
