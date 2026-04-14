import { useState } from "preact/hooks";
import "./Calendar.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Props for the month calendar, including optional marked day set. */
type CalendarProps = {
    onDateSelect?: (date: Date) => void;
      /** Set of "YYYY-MM-DD" strings that should be visually marked. */
    markedDates?: Set<string>;
};

/** Month calendar widget with Monday-first layout and optional marked dates. */
export function Calendar({ onDateSelect, markedDates }: CalendarProps) {
    const today = new Date();

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0–11

    const monthName = new Date(year, month, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const firstDay = new Date(year, month, 1);
    const jsWeekday = firstDay.getDay(); // 0=Sun..6=Sat
    const mondayFirstIndex = (jsWeekday + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < mondayFirstIndex; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);

    const isToday = (day: number | null) =>
        !!day &&
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    const toLocalYMD = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const hasMarker = (day: number | null) => {
        if (!day) return false;
        const ymd = toLocalYMD(new Date(year, month, day));
        return !!markedDates?.has(ymd);
    };

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        const selected = new Date(year, month, day);
        onDateSelect?.(selected);
    };

    const handlePrevMonth = () => {
        if (month === 0) {
            setYear(y => y - 1);
            setMonth(11);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setYear(y => y + 1);
            setMonth(0);
        } else {
            setMonth(m => m + 1);
        }
    };

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button type="button" className="calendar-nav" onClick={handlePrevMonth}>
                    ‹
                </button>
                <div className="calendar-title">{monthName}</div>
                <button type="button" className="calendar-nav" onClick={handleNextMonth}>
                    ›
                </button>
            </div>

            <div className="calendar-grid">
                {WEEKDAYS.map(day => (
                    <div key={day} className="calendar-weekday">
                        {day}
                    </div>
                ))}

                {cells.map((day, i) =>
                    day ? (
                        <button
                            key={i}
                            type="button"
                            className={
                                "calendar-cell" +
                                (isToday(day) ? " calendar-cell-today" : "") +
                                (hasMarker(day) ? " calendar-cell-marked" : "")
                            }
                            onClick={() => handleDayClick(day)}
                        >
                            {day}
                        </button>
                    ) : (
                        <div key={i} className="calendar-cell calendar-cell-empty" />
                    ),
                )}
            </div>
        </div>
    );
}
