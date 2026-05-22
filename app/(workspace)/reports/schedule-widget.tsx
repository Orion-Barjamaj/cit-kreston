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

const weeks: DaySchedule[][] = [
  [
    {
      label: "Mo",
      date: 15,
      items: [{ title: "Payroll file check", time: "10:00 AM", detail: "Vodafone payroll inputs", accent: "blue" }],
    },
    {
      label: "Tu",
      date: 16,
      items: [{ title: "Client call", time: "11:30 AM", detail: "Balfin audit questions", accent: "green" }],
    },
    {
      label: "We",
      date: 17,
      items: [
        { title: "Kickoff Meeting", time: "01:00 PM to 02:30 PM", detail: "Internal audit planning", accent: "green" },
        { title: "Create audit report draft", time: "04:00 PM to 05:30 PM", detail: "Balfin Group", accent: "blue" },
      ],
    },
    {
      label: "Th",
      date: 18,
      items: [{ title: "Tax package review", time: "02:00 PM", detail: "Tirana Retail", accent: "pink" }],
    },
    {
      label: "Fr",
      date: 19,
      items: [{ title: "Audit signoff", time: "03:30 PM", detail: "Manager approval", accent: "blue" }],
    },
    { label: "Sa", date: 20, items: [] },
    { label: "Su", date: 21, items: [] },
  ],
  [
    {
      label: "Mo",
      date: 22,
      items: [{ title: "Overdue task review", time: "09:30 AM", detail: "Manager cleanup", accent: "pink" }],
    },
    {
      label: "Tu",
      date: 23,
      items: [{ title: "Tax review assigned", time: "10:30 AM", detail: "Mira K.", accent: "blue" }],
    },
    {
      label: "We",
      date: 24,
      items: [{ title: "Vodafone payroll due", time: "12:00 PM", detail: "Payroll submission", accent: "pink" }],
    },
    {
      label: "Th",
      date: 25,
      items: [{ title: "Audit completed", time: "04:00 PM", detail: "Balfin Group", accent: "green" }],
    },
    {
      label: "Fr",
      date: 26,
      items: [{ title: "Tax deadline", time: "05:00 PM", detail: "Submission package", accent: "pink" }],
    },
    { label: "Sa", date: 27, items: [] },
    { label: "Su", date: 28, items: [] },
  ],
  [
    {
      label: "Mo",
      date: 29,
      items: [{ title: "Contract renewal", time: "10:00 AM", detail: "Union Bank", accent: "green" }],
    },
    {
      label: "Tu",
      date: 30,
      items: [{ title: "VAT return review", time: "02:00 PM", detail: "Tirana Retail", accent: "blue" }],
    },
    {
      label: "We",
      date: 31,
      items: [{ title: "HR files completed", time: "03:00 PM", detail: "Neptun", accent: "green" }],
    },
    { label: "Th", date: 1, items: [] },
    { label: "Fr", date: 2, items: [] },
    { label: "Sa", date: 3, items: [] },
    { label: "Su", date: 4, items: [] },
  ],
];

export default function ScheduleWidget() {
  const [weekIndex, setWeekIndex] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(2);
  const week = weeks[weekIndex];
  const selectedDay = week[selectedDayIndex];
  const weekLabel = useMemo(() => {
    const first = week[0];
    const last = week[week.length - 1];

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
            disabled={weekIndex === weeks.length - 1}
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
        <strong>
          {selectedDay.label} {selectedDay.date}
        </strong>
        <span>{selectedDay.items.length} scheduled item{selectedDay.items.length === 1 ? "" : "s"}</span>
      </div>
      <ul className={styles.scheduleList}>
        {selectedDay.items.length > 0 ? (
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
