"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./clients.module.css";

type DocumentSummaryPopoverProps = {
  fileName: string;
  summary: string;
};

export default function DocumentSummaryPopover({
  fileName,
  summary,
}: DocumentSummaryPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  return (
    <div className={styles.summaryPopoverWrap} ref={popoverRef}>
      <button
        aria-expanded={isOpen}
        aria-label={`Show AI summary for ${fileName}`}
        className={styles.documentInfoButton}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        i
      </button>

      {isOpen ? (
        <section className={styles.summaryPopover} aria-label={`AI summary for ${fileName}`}>
          <header className={styles.summaryPopoverHeader}>
            <div>
              <span aria-hidden="true">✦</span>
              <strong>Summary</strong>
              <em>AI</em>
            </div>
            <button aria-label="Close summary" onClick={() => setIsOpen(false)} type="button">
              ×
            </button>
          </header>

          <p>{summary}</p>
        </section>
      ) : null}
    </div>
  );
}
