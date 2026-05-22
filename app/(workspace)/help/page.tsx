import styles from "../workspace.module.css";

const faqs = [
  "How do I create a task?",
  "How do I upload a document?",
  "How do I change status?",
  "Who can see my work?",
];

export default function HelpPage() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Support</p>
          <h2>Help & Support</h2>
          <p>Quick answers, system guidance, and support contact.</p>
        </div>
        <button className={styles.primaryButton} type="button">Report a problem</button>
      </div>

      <div className={styles.twoColumn}>
        <article className={styles.panel}>
          <h3>FAQ</h3>
          <ul className={styles.cleanList}>
            {faqs.map((faq) => (
              <li key={faq}>{faq}</li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h3>Contact Support</h3>
          <p>support@kreston.al</p>
          <p>Response time: same business day</p>
        </article>
      </div>
    </section>
  );
}
