import type { Metadata } from "next";
import Link from "next/link";
import { BookSpread } from "@/components/book/BookSpread";
import { LeafOnward } from "@/components/book/LeafOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { getLocation, getProject, skills } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("gear");

/**
 * The count, taken from the data rather than asserted.
 *
 * The content model draws a distinction the page can otherwise only show one
 * row at a time: `projects: []` is a claim, not evidence. Totalling it is the
 * point — a kit is counted before it is carried, and a portfolio that states
 * plainly what it cannot yet prove is worth more than one that lists
 * everything at the same weight.
 */
const carried = skills.flatMap((group) => group.items);
const evidenced = carried.filter((item) => item.projects.length > 0).length;

export const metadata: Metadata = {
  title: "Gear — Skills",
  description:
    "Languages, frameworks, databases, APIs and tooling — each one tied to the project it is actually evidenced in.",
  alternates: { canonical: routes.skills },
};

export default function SkillsPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Gear · Skills"
        title="Gear"
        lede="What gets carried. Every entry that points at a project is evidenced in running code; the rest are marked as what they are — tools handled, not yet shipped."
        symbol={location?.symbol}
      />

      <BookSpread
        held
        right={
          <>
          <p className={styles.tally}>
            <span className={styles.count}>{carried.length}</span> carried
            <span className={styles.sep} aria-hidden="true">·</span>
            <span className={styles.count}>{evidenced}</span> evidenced in shipped code
            <span className={styles.sep} aria-hidden="true">·</span>
            <span className={styles.count}>{carried.length - evidenced}</span> handled, not yet
            shipped
          </p>

          <ul className={shared.cards}>
            {skills.map((group) => (
              <li key={group.group}>
                <PaperSurface as="section" edge="worn" className={styles.group}>
                  <h2 className={styles.groupHeading}>{group.group}</h2>
                  <ul className={styles.items}>
                    {group.items.map((item) => {
                      const evidence = item.projects
                        .map((id) => getProject(id))
                        .filter((p) => p !== undefined);

                      return (
                        <li key={item.name} className={styles.item}>
                          <span className={styles.itemName}>{item.name}</span>
                          {evidence.length > 0 ? (
                            <span className={styles.proof}>
                              {evidence.map((project) => (
                                <Link
                                  key={project.id}
                                  href={project.route}
                                  className={styles.proofLink}
                                >
                                  {project.title}
                                </Link>
                              ))}
                            </span>
                          ) : (
                            <span className={styles.unproven}>No record yet</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </PaperSurface>
              </li>
            ))}
          </ul>
          </>
        }
      />

      <LeafOnward route={routes.skills} />
    </div>
  );
}
