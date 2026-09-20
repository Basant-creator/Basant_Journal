import type { Metadata } from "next";
import { TrailOnward } from "@/components/navigation/TrailOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { CampScene } from "@/components/scenes/CampScene";
import { education, getLocation, person } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";

const location = getLocation("camp");

export const metadata: Metadata = {
  title: "Camp — About",
  description: person.summary,
  alternates: { canonical: routes.about },
};

/**
 * Camp.
 *
 * The scene carries the introduction: a notebook, a photograph and a bundle of
 * field notes rest on the table, and picking one up shows its record. The
 * journey below it stays as a plain timeline, because a sequence of years
 * reads better as a list than as an object to be found.
 */
export default function AboutPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Camp · About"
        title="Camp"
        lede="A fire, a table, and the papers that happen to be on it. Pick something up."
        symbol={location?.symbol}
      />

      <CampScene
        name={person.name}
        role={person.role}
        summary={person.summary}
        interests={person.interests}
        education={education.map((entry) => ({
          qualification: entry.qualification,
          institution: entry.institution,
          period: entry.period,
          place: entry.place,
        }))}
        mapHref={routes.frontier}
      />

      {/*
        The journey timeline used to sit here. It is a leaf of the field book
        now — a record of ground covered is something you turn to, and Camp is
        somewhere you stand. The notebook on the table is how you reach it.

        And the foot of the page no longer decides where the trail goes next.
        §19 is the case that forced it: closing the book must put the visitor
        back at Camp with the *trail* continuing to the Board rather than the
        notebook being offered a second time. That is a fact about the walk,
        not about this page, so TrailOnward asks the world model — see the
        note there, including why the caption is derived from the destination
        rather than written here.
      */}
      <TrailOnward />
    </div>
  );
}
