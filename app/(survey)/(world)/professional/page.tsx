import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  certifications,
  coreStack,
  education,
  links,
  metrics,
  person,
  projects,
  skills,
  training,
} from "@/lib/content/portfolio";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Professional view",
  description: `${person.name} — ${person.role}. Skills, projects, education and contact, on one page.`,
  alternates: { canonical: routes.professional },
};

/**
 * The professional view.
 *
 * The layer model inverts here: paper becomes the field, dark becomes the
 * accent. Same tokens, different dominance — which is why it reads as the same
 * publication rather than a different website.
 *
 * It reads the same content file as the map. There is no second copy, so a
 * project added once appears correctly in both modes.
 *
 * Each project carries an id, so /professional#tuneit lands on that entry.
 * Project highlighting is a fragment, never a route of its own — it is the
 * same document, scrolled.
 */
export default function ProfessionalPage() {
  return (
    <div className={`${styles.sheet} surfacePaper`}>
      <header className={styles.masthead}>
        <p className={styles.kicker}>Professional view</p>
        <h1 className={styles.name}>{person.name}</h1>
        <p className={styles.role}>{person.role}</p>
        <ul className={styles.contact}>
          <li>
            <a href={`mailto:${links.email}`}>{links.email}</a>
          </li>
          <li>
            <a href={links.github} target="_blank" rel="noreferrer noopener">
              github.com/Basant-creator
            </a>
          </li>
          <li>
            <a href={links.linkedin} target="_blank" rel="noreferrer noopener">
              LinkedIn
            </a>
          </li>
          <li>{person.location}</li>
        </ul>

        {/*
          The stack, before anything else asks for scrolling.

          Somebody who arrives here rather than at the landing has decided they
          want the facts, and the first fact they are looking for is what this
          person writes code in. Putting it in the masthead is the difference
          between a document that answers that in three seconds and one that
          makes them hunt for it past a summary and a project list.

          Derived from the skills model and filtered to what a project actually
          evidences — see coreStack. It is a summary of the section below, not
          a second list that can disagree with it.
        */}
        <p className={styles.stackLine}>
          <span className={styles.stackLineLabel}>Works in</span>
          {coreStack.join(" · ")}
        </p>
      </header>

      <section className={styles.section} aria-labelledby="about">
        <h2 id="about" className={styles.heading}>
          About
        </h2>
        <p className={styles.body}>{person.summary}</p>
        <ul className={styles.metricRow}>
          {metrics.map((metric) => (
            <li key={metric.id}>
              <span className={styles.metricValue}>{metric.value}</span>
              <span className={styles.metricUnit}>{metric.unit}</span>
              <span className={styles.metricContext}>{metric.context}</span>
            </li>
          ))}
        </ul>
      </section>

      {/*
        Capabilities before the project detail.

        A recruiter reading this page is answering "can this person do the
        thing" before "what has this person done", and the order of the
        document should match the order of the question. The immersive side
        puts the work first because a reader there is being told a story;
        this side is being asked one.

        Both sections keep their ids, so /professional#tuneit and
        /professional#skills still land where they always did.
      */}
      <section className={styles.section} aria-labelledby="skills">
        <h2 id="skills" className={styles.heading}>
          Skills
        </h2>
        <div className={styles.skills}>
          {skills.map((group) => (
            <div key={group.group} className={styles.skillGroup}>
              <h3 className={styles.skillHeading}>{group.group}</h3>
              <ul className={styles.skillList}>
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className={item.projects.length ? styles.skillEvidenced : styles.skillClaimed}
                  >
                    {item.name}
                    {item.projects.length ? (
                      <span className={styles.skillProof}>
                        {item.projects.join(", ")}
                      </span>
                    ) : null}
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
          {projects.map((project) => (
            <article key={project.id} id={project.id} className={styles.project}>
              <div className={styles.projectHead}>
                <h3 className={styles.projectTitle}>
                  <Link href={project.route} className={styles.projectLink}>
                    {project.title}
                  </Link>
                </h3>
                <span className={styles.projectDate}>{project.date}</span>
              </div>
              <p className={styles.projectSubtitle}>{project.subtitle}</p>
              <p className={styles.body}>{project.summary}</p>
              <p className={styles.body}>{project.architecture}</p>
              <ul className={styles.bullets}>
                {project.implementation.slice(0, 3).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className={styles.stack}>
                <span className={styles.stackLabel}>Stack</span>
                {project.technologies.join(" · ")}
              </p>
              {project.linksStatus === "unresolved" ? (
                <p className={styles.unresolved}>
                  Repository and live links not yet recorded.
                </p>
              ) : (
                <p className={styles.stack}>
                  {project.github ? (
                    <a href={project.github} target="_blank" rel="noreferrer noopener">
                      Repository
                    </a>
                  ) : null}
                  {project.liveUrl ? (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer noopener">
                      Live
                    </a>
                  ) : null}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="education">
        <h2 id="education" className={styles.heading}>
          Education, training &amp; certifications
        </h2>
        <div className={styles.records}>
          {education.map((entry) => (
            <div key={entry.institution} className={styles.record}>
              <h3 className={styles.recordTitle}>{entry.qualification}</h3>
              <p className={styles.recordMeta}>
                {entry.institution} · {entry.place}
              </p>
              <p className={styles.recordMeta}>
                {entry.period} · {entry.detail}
              </p>
            </div>
          ))}
          {training.map((entry) => (
            <div key={entry.title} className={styles.record}>
              <h3 className={styles.recordTitle}>{entry.title}</h3>
              <p className={styles.recordMeta}>{entry.issuer}</p>
              <p className={styles.recordMeta}>
                {entry.period} · {entry.detail}
              </p>
            </div>
          ))}
          {certifications.map((entry) => (
            <div key={entry.title} className={styles.record}>
              <h3 className={styles.recordTitle}>{entry.title}</h3>
              <p className={styles.recordMeta}>{entry.period}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.foot}>
        <div>
          <h2 className={styles.heading}>Contact</h2>
          <p className={styles.body}>
            {person.availability}. The fastest route is{" "}
            <a href={`mailto:${links.email}`}>{links.email}</a>.
          </p>
        </div>
        <Link href={routes.frontier} className={styles.backLink}>
          Return to frontier
        </Link>
      </footer>
    </div>
  );
}
