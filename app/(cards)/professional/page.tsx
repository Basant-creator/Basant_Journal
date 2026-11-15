import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/cards/professional.module.css";
import { CAST, CASES, plain, when } from "@/lib/cards/catalog";
import { CORE_STACK_GROUPS, certifications, education, links, person, training } from "@/lib/content/portfolio";
import { routes, workRoute } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Professional view",
  description: `${person.name} — ${person.role}. Skills, projects, education and contact, on one page.`,
  alternates: { canonical: routes.professional },
};

/* What somebody writes code in, before anything asks for scrolling: the
   languages, frameworks and databases a project on the deck actually uses,
   from the same credits the deck's toolbox bills. */
const WORKS_IN = CAST.filter((g) => (CORE_STACK_GROUPS as readonly string[]).includes(g.group)).flatMap((g) =>
  g.items.filter((i) => i.credits.length).map((i) => i.name),
);

/**
 * THE PROFESSIONAL VIEW: the same facts as the title cards, as one plain
 * page somebody can read in a minute and print as a CV.
 *
 * Same three voices as the cards (Anton for names, Oswald for labels, Libre
 * Caslon for reading), on cream with black ink and the rust of a rubber
 * stamp, and nothing that moves. The order is the order of a recruiter's
 * questions: who and how to reach them, what they work in, what they have
 * built, where they studied and what they are certified in.
 *
 * It reads the same catalog as the deck: the same three projects, the same
 * credits, the same words. Each project keeps an id, so /professional#strata
 * lands on it. Every word is the content file's except the section names.
 */
export default function ProfessionalView() {
  const resume = links.resumeStatus === "resolved" ? links.resume : null;

  return (
    <div id="main" tabIndex={-1} className={styles.page} data-titles="">
      <div className={styles.wrap}>
        <nav className={styles.top} aria-label="Views">
          <Link href={routes.home} className={styles.home}>
            ← The title cards
          </Link>
          <span className={styles.here}>Professional view</span>
        </nav>

        <header className={styles.mast}>
          <h1 className={styles.name}>{person.name}</h1>
          <p className={styles.role}>{person.role}</p>
          <ul className={styles.contact}>
            <li>
              <a href={`mailto:${links.email}`}>{links.email}</a>
            </li>
            <li>
              <a href={links.github} target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
            </li>
            <li>
              <a href={links.linkedin} target="_blank" rel="noreferrer noopener">
                LinkedIn
              </a>
            </li>
            {resume ? (
              <li>
                <a href={resume} target="_blank" rel="noreferrer noopener">
                  Résumé (PDF)
                </a>
              </li>
            ) : null}
            <li>{person.location}</li>
          </ul>
          <p className={styles.status}>{person.availability}</p>
          <p className={styles.works}>
            <span className={styles.label}>Works in</span>
            {WORKS_IN.join(" · ")}
          </p>
        </header>

        <section className={styles.section} aria-labelledby="about">
          <h2 id="about" className={styles.heading}>
            About
          </h2>
          <div>
            <p className={styles.lead}>{plain(person.summary)}</p>
            <ul className={styles.interests}>
              {person.interests.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="skills">
          <h2 id="skills" className={styles.heading}>
            Skills
          </h2>
          <div className={styles.skills}>
            {CAST.map((group) => (
              <div key={group.group}>
                <h3 className={styles.sub}>{group.group}</h3>
                <ul className={styles.skillList}>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      {item.name}
                      {item.credits.length ? <span className={styles.credit}>{item.credits.join(", ")}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="projects">
          <h2 id="projects" className={styles.heading}>
            Projects
          </h2>
          <div className={styles.projects}>
            {CASES.map((p) => (
              <article key={p.id} id={p.id} className={styles.project}>
                <div className={styles.projectHead}>
                  <h3 className={styles.projectTitle}>{p.title}</h3>
                  <span className={styles.when}>{when(p)}</span>
                </div>
                <p className={styles.projectSub}>{p.subtitle}</p>
                <p className={styles.body}>{plain(p.summary)}</p>
                <ul className={styles.metrics}>
                  {p.metrics.map((m) => (
                    <li key={m.label}>
                      <span className={styles.metricValue}>{m.value}</span>
                      <span className={styles.metricUnit}>{m.unit}</span>
                      <span className={styles.metricLabel}>{m.label}</span>
                    </li>
                  ))}
                </ul>
                <p className={styles.tech}>{p.technologies.join(" · ")}</p>
                <p className={styles.links}>
                  <Link href={workRoute(p.id)}>Read the case file →</Link>
                  {p.github ? (
                    <a href={p.github} target="_blank" rel="noreferrer noopener">
                      Source ↗
                    </a>
                  ) : null}
                  {p.liveUrl ? (
                    <a href={p.liveUrl} target="_blank" rel="noreferrer noopener">
                      Live ↗
                    </a>
                  ) : null}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="education">
          <h2 id="education" className={styles.heading}>
            Education &amp; certifications
          </h2>
          <div className={styles.entries}>
            {education.map((e) => (
              <div key={e.institution} className={styles.entry}>
                <h3 className={styles.entryTitle}>{e.institution}</h3>
                <p className={styles.body}>{e.qualification}</p>
                <p className={styles.meta}>
                  {[e.place, plain(e.period), e.detail].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
            {training.map((t) => (
              <div key={t.title} className={styles.entry}>
                <h3 className={styles.entryTitle}>{t.title}</h3>
                <p className={styles.body}>{t.issuer}</p>
                <p className={styles.meta}>{[plain(t.period), t.detail].filter(Boolean).join(" · ")}</p>
                {t.certificateStatus === "resolved" && t.certificate ? (
                  <a className={styles.proof} href={t.certificate} target="_blank" rel="noreferrer noopener">
                    Certificate ↗
                  </a>
                ) : null}
              </div>
            ))}
            {certifications.map((c) => (
              <div key={c.title} className={styles.entry}>
                <h3 className={styles.entryTitle}>{c.title}</h3>
                {c.issuer ? <p className={styles.body}>{c.issuer}</p> : null}
                <p className={styles.meta}>{plain(c.period)}</p>
                {c.certificateStatus === "resolved" && c.certificate ? (
                  <a className={styles.proof} href={c.certificate} target="_blank" rel="noreferrer noopener">
                    Certificate ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="contact">
          <h2 id="contact" className={styles.heading}>
            Contact
          </h2>
          <div>
            <p className={styles.status}>{person.availability}</p>
            <a className={styles.mail} href={`mailto:${links.email}`}>
              {links.email}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
