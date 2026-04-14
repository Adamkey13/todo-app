import "./Login.css";
import { IconButton } from "./IconButton";
import type { Theme } from "./theme";
import { Calendar } from "./Calendar";
import "./MainScreeen.css";
import { useEffect, useMemo, useState } from "preact/hooks";
import { TodoList } from "./TodoList";
import type { TodoItem } from "./TodoList";
import { Modal } from "./Modal";
import { EventList } from "./EventList";
import type { EventItem } from "./EventList";


/** Props for the authenticated main screen after login. */
type MainScreenProps = {
    user: { email: string; username: string };
    onLogout: () => void;
    theme: Theme;
    onToggleTheme: () => void;
};

/** Main app screen: todo list + calendar + notifications + pomodoro + theme + logout. */
export function MainScreen({ user, onLogout, theme, onToggleTheme }: MainScreenProps) {
    const displayName = user.username || user.email;

    const [panel, setPanel] = useState<"todos" | "events">("todos");
    const [allEvents, setAllEvents] = useState<EventItem[]>([]);


    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [allTodos, setAllTodos] = useState<TodoItem[]>([]);

    const [pomodoroOpen, setPomodoroOpen] = useState(false);

    const [focusMinutes, setFocusMinutes] = useState(25);
    const [restMinutes, setRestMinutes] = useState(5);

    const [running, setRunning] = useState(false);
    const [mode, setMode] = useState<"focus" | "rest">("focus");
    const [remainingSec, setRemainingSec] = useState(25 * 60);

    /** Formats seconds as MM:SS. */
    const formatMMSS = (totalSec: number) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const pomodoroLabel = running
        ? `${mode === "focus" ? "Focus" : "Rest"}: ${formatMMSS(remainingSec)}`
        : "Pomodoro";



    useEffect(() => {
        if (!running) return;

        const id = window.setInterval(() => {
            setRemainingSec(prev => {
                if (prev > 1) return prev - 1;

                // 0-ra ért: váltás
                if (mode === "focus") {
                    setMode("rest");
                    return restMinutes * 60;
                } else {
                    setMode("focus");
                    return focusMinutes * 60;
                }
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [running, mode, focusMinutes, restMinutes]);

    const saveAndStart = () => {
        const f = Math.max(1, Math.floor(focusMinutes));
        const r = Math.max(1, Math.floor(restMinutes));

        setFocusMinutes(f);
        setRestMinutes(r);

        setMode("focus");
        setRemainingSec(f * 60);
        setRunning(true);
        setPomodoroOpen(false);
    };



    // Load todos for calendar markers + keep in sync when TodoList saves
    useEffect(() => {
        const loadTodos = () => {
            try {
                const rawTodos = localStorage.getItem(`todos_${user.email}`);
                const parsedTodos = rawTodos ? (JSON.parse(rawTodos) as TodoItem[]) : [];
                setAllTodos(Array.isArray(parsedTodos) ? parsedTodos : []);
            } catch {
                setAllTodos([]);
            }
        };

        const loadEvents = () => {
            try {
                const rawEvents = localStorage.getItem(`events_${user.email}`);
                const parsedEvents = rawEvents ? (JSON.parse(rawEvents) as EventItem[]) : [];
                setAllEvents(Array.isArray(parsedEvents) ? parsedEvents : []);
            } catch {
                setAllEvents([]);
            }
        };

        const loadAll = () => {
            loadTodos();
            loadEvents();
        };

        loadAll();

        const onTodosChanged = (e: Event) => {
            const ce = e as CustomEvent<{ email?: string }>;
            if (!ce.detail?.email || ce.detail.email === user.email) loadTodos();
        };

        const onEventsChanged = (e: Event) => {
            const ce = e as CustomEvent<{ email?: string }>;
            if (!ce.detail?.email || ce.detail.email === user.email) loadEvents();
        };

        window.addEventListener("todos-changed", onTodosChanged);
        window.addEventListener("events-changed", onEventsChanged);

        return () => {
            window.removeEventListener("todos-changed", onTodosChanged);
            window.removeEventListener("events-changed", onEventsChanged);
        };
    }, [user.email]);



    const markedDates = useMemo(() => {
        const s = new Set<string>();

        // todos
        for (const t of allTodos) {
            if (t.dueDate && t.status !== "done") s.add(t.dueDate);
        }

        // events
        for (const e of allEvents) {
            if (e.date) s.add(e.date);
        }

        return s;
    }, [allTodos, allEvents]);




    return (
        <div className="main-wrapper">
            <button
                type="button"
                className="pomodoro-btn"
                onClick={() => setPomodoroOpen(true)}
            >
                {pomodoroLabel}
            </button>

            <Modal
                open={pomodoroOpen}
                title="Pomodoro"
                onClose={() => setPomodoroOpen(false)}
            >
                <div className="pomodoro-modal">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            Focus minutes
                            <input
                                type="number"
                                min={1}
                                value={focusMinutes}
                                onInput={e => setFocusMinutes(parseInt((e.currentTarget as HTMLInputElement).value || "0", 10))}
                            />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            Rest minutes
                            <input
                                type="number"
                                min={1}
                                value={restMinutes}
                                onInput={e => setRestMinutes(parseInt((e.currentTarget as HTMLInputElement).value || "0", 10))}
                            />
                        </label>

                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            {running && (
                                <button type="button" onClick={() => setRunning(false)}>
                                    Pause
                                </button>
                            )}
                            {!running && (
                                <button type="button" onClick={() => setRunning(true)}>
                                    Resume
                                </button>
                            )}
                            <button type="button" className="todo-add-btn" onClick={saveAndStart}>
                                Save & Start
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRunning(false);
                                    setMode("focus");
                                    setRemainingSec(focusMinutes * 60);
                                    setPomodoroOpen(false);
                                }}
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <IconButton
                iconName={theme === "dark" ? "light_mode" : "dark_mode"}
                buttonContent=""
                onClick={onToggleTheme}
            />

            <div className="main-window-split">
                <div className="main-window-left">
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            className={"todo-view-btn" + (panel === "todos" ? " is-active" : "")}
                            onClick={() => setPanel("todos")}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={"todo-view-btn" + (panel === "events" ? " is-active" : "")}
                            onClick={() => setPanel("events")}
                        >
                            Events
                        </button>
                    </div>

                    {panel === "todos" ? (
                        <TodoList userEmail={user.email} selectedDate={selectedDate} />
                    ) : (
                        <EventList userEmail={user.email} selectedDate={selectedDate} />
                    )}

                </div>

                <div className="main-window-right" style={{ alignItems: "center" }}>
                    <Calendar
                        markedDates={markedDates}
                        onDateSelect={date => setSelectedDate(date)}
                    />

                    <button className="button-logout" type="button" onClick={onLogout}>
                        Logout
                    </button>

                    {selectedDate && (
                        <button
                            className="button-logout"
                            type="button"
                            onClick={() => setSelectedDate(null)}
                        >
                            Reset filter
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}
