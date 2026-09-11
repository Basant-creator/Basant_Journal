import type { Metadata } from "next";
import Link from "next/link";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { LocationTitle } from "@/components/scene/LocationTitle";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { getLocation, getProject, skills } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("gear");

export const metadata: Metadata = {
  title: "Gear — Skills",
  description:
    "Languages, frameworks, databases, APIs and tooling — each one tied to the project it is actually evidenced in.",
  alternates: { canonical: routes.skills },
};

export default function SkillsPage() {
  return (
    <div className={shared.page}>

      <div className={shared.locate}>
        <LocationTitle title="The Workshop" subtitle="Tools of the trade" />
        <PageHeader
          eyebrow="Gear · Skills"
          title="Gear"
          lede="What gets carried. Every entry that points at a project is evidenced in running code; the rest are marked as what they are — tools handled, not yet shipped."
          symbol={location?.symbol}
        />
      </div>

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

      <OnwardNav
        previous={{ href: routes.about, caption: "Back along the trail", label: "Camp" }}
        next={{ href: routes.projects, caption: "Next on the trail", label: "Journal" }}
      />
    </div>
  );
}
