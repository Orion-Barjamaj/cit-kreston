"use client";

import { useMemo, useState } from "react";
import styles from "./reports.module.css";

type ScheduleItem = {
  title: string;
  time: string;
  detail: string;
  accent: "green" | "blue" | "pink";
};

type DaySchedule = {
  label: string;
  date: number;
  items: ScheduleItem[];
};

export type ScheduleWeek = DaySchedule[];

type ScheduleWidgetProps = {
  weeks: ScheduleWeek[];
};

export default function ScheduleWidget({ weeks }: ScheduleWidgetProps) {
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const week = useMemo(() => weeks[weekIndex] ?? [], [weekIndex, weeks]);
  const selectedDay = week[selectedDayIndex] ?? week[0];
  const weekLabel = useMemo(() => {
    const first = week[0];
    const last = week[week.length - 1];

    if (!first || !last) {
      return "No scheduled work";
    }

    return `${first.label} ${first.date} - ${last.label} ${last.date}`;
  }, [week]);

  function moveWeek(direction: -1 | 1) {
    setWeekIndex((current) => {
      const next = Math.min(Math.max(current + direction, 0), weeks.length - 1);
      setSelectedDayIndex(0);
      return next;
    });
  }

  return (
    <article className={styles.panel}>
      <div className={styles.panelToolbar}>
        <h3>Schedule</h3>
        <div className={styles.scheduleControls}>
          <button
            aria-label="Previous week"
            className={`${styles.scheduleArrow} ${styles.previousArrow}`}
            disabled={weekIndex === 0}
            onClick={() => moveWeek(-1)}
            type="button"
          />
          <span>{weekLabel}</span>
          <button
            aria-label="Next week"
            className={`${styles.scheduleArrow} ${styles.nextArrow}`}
            disabled={weekIndex >= weeks.length - 1}
            onClick={() => moveWeek(1)}
            type="button"
          />
        </div>
      </div>
      <div className={styles.weekStrip}>
        {week.map((day, index) => (
          <button
            className={index === selectedDayIndex ? styles.currentDay : ""}
            key={`${day.label}-${day.date}`}
            onClick={() => setSelectedDayIndex(index)}
            type="button"
          >
            <span>{day.label}</span>
            <strong>{day.date}</strong>
          </button>
        ))}
      </div>
      <div className={styles.selectedDayInfo}>
        <strong>{selectedDay ? `${selectedDay.label} ${selectedDay.date}` : "No schedule"}</strong>
        <span>
          {selectedDay?.items.length ?? 0} scheduled item{selectedDay?.items.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className={styles.scheduleList}>
        {selectedDay && selectedDay.items.length > 0 ? (
          selectedDay.items.map((item) => (
            <li className={styles[`schedule${item.accent}`]} key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.time}</span>
              <small>{item.detail}</small>
            </li>
          ))
        ) : (
          <li className={styles.emptySchedule}>
            <strong>No scheduled work</strong>
            <span>This day is clear.</span>
          </li>
        )}
      </ul>
    </article>
  );
}
