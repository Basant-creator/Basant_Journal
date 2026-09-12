import type { Metadata } from "next";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { DocumentMeta } from "@/components/record/DocumentMeta";
import { DocumentStamp } from "@/components/record/DocumentStamp";
import { FieldNote } from "@/components/record/FieldNote";
import { FieldRecordHeader } from "@/components/record/FieldRecordHeader";
import { MetricPanel } from "@/components/record/MetricPanel";
import { ProjectNavigation } from "@/components/record/ProjectNavigation";
import { ProjectSheet } from "@/components/record/ProjectSheet";
import { TechnicalDiagram } from "@/components/record/TechnicalDiagram";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Record system — Lab",
  robots: { index: false, follow: false },
};

/**
 * Step 15's deliverable: a record that is not one of the three.
 *
 * Every component in the document system, rendering content that belongs to
 * no project — which is the whole test. A framework that only looks right
 * with TuneIt's numbers in it is not a framework, it is TuneIt's page with
 * the parts moved into separate files.
 *
 * The stock changes between sheets here, which is *not* what a real record
 * does — a record filed on manila is filed on manila throughout. It is done
 * deliberately on the bench so the variants can be judged against each other
 * in document context rather than side by side on a swatch page.
 */
export default function RecordLabPage() {
  return (
    <article className={styles.record}>
      <FieldRecordHeader
        eyebrow="Specimen record"
        title="Specimen"
        subtitle="A neutral record, filed to prove the system"
        back={{ href: "/lab/paper", label: "Paper variants" }}
        stamp={
          <DocumentStamp
            mark="Specimen"
            note="Not a real record. Held in the lab as the system's reference document."
            filing="filed for reference"
          />
        }
        meta={
          <DocumentMeta
            entries={[
              { term: "Period", value: "JAN 2026 — JAN 2026" },
              { term: "Record", value: "0 of 0" },
              { term: "Sheets", value: "5" },
              { term: "Also in", value: "Paper variants", href: "/lab/paper" },
            ]}
          />
        }
      />

      <div className={styles.sheets}>
        <ProjectSheet id="overview" heading="Overview" sheet="1 of 5">
          <p>
            A field record is a document before it is a page. It has a head, a
            filing strip, numbered sheets, figures with captions, measured
            values with an account of where they came from, and notes in two
            hands — one written while the work was happening and one written
            up afterwards.
          </p>
          <p>
            Everything on this page is rendered by the same components the
            three real records use. None of the words are theirs.
          </p>
          <FieldNote tag="Observed" hand="pencil">
            The stock is set once per record, not per sheet — a file filed on
            manila is manila all the way through.
          </FieldNote>
        </ProjectSheet>

        <ProjectSheet
          id="architecture"
          heading="Architecture"
          variant="CASE_FILE"
          sheet="2 of 5"
        >
          <p>
            The same sheet on buff manila. Nothing structural changed: the
            heading, the sheet number, the rules and the measure are the
            system&rsquo;s, and the stock is a parameter.
          </p>

          <TechnicalDiagram
            figure="Fig. 1"
            caption="A neutral schematic: three stages and the path between them."
            description="Three boxes in a row, labelled one, two and three, joined left to right by a single line. A fourth box sits below the second and is joined to it by a dashed line."
          >
            <g className={styles.diagram}>
              <rect x="40" y="120" width="130" height="76" />
              <rect x="255" y="120" width="130" height="76" />
              <rect x="470" y="120" width="130" height="76" />
              <path className={styles.flow} d="M 170 158 H 255 M 385 158 H 470" />
              <path className={styles.dashed} d="M 320 196 V 268" />
              <rect className={styles.ghost} x="255" y="268" width="130" height="60" />
              <text x="105" y="164">ONE</text>
              <text x="320" y="164">TWO</text>
              <text x="535" y="164">THREE</text>
              <text className={styles.small} x="320" y="304">
                ASIDE
              </text>
            </g>
          </TechnicalDiagram>
        </ProjectSheet>

        <ProjectSheet
          id="implementation"
          heading="Implementation"
          variant="BLUEPRINT"
          sheet="3 of 5"
        >
          <p>
            Cyanotype inverts the layer model — dark ground, light line — and
            the system holds because every rule it depends on is a token
            rather than a colour typed into a component.
          </p>
          <FieldNote tag="Later" hand="ink">
            Written up afterwards, in ink. The pencil note above was written on
            the spot.
          </FieldNote>
        </ProjectSheet>

        <ProjectSheet id="metrics" heading="Metrics" surface="plain" sheet="4 of 5">
          <MetricPanel
            caption="Measured on the bench — figures invented for the specimen"
            metrics={[
              { value: "120", unit: "units", label: "First reading" },
              { value: "99.9%", unit: "ratio", label: "Second reading" },
              { value: "3", unit: "count", label: "Third reading" },
            ]}
          />
        </ProjectSheet>

        <ProjectSheet
          id="notes"
          heading="Field notes"
          variant="JOURNAL_PAGE"
          sheet="5 of 5"
        >
          <p>
            The last sheet carries what the work taught, and the one red mark
            the page is allowed.
          </p>
          <SurveyAnnotation tag="Surveyor's note">
            Specimen record — no territory surveyed.
          </SurveyAnnotation>
        </ProjectSheet>
      </div>

      <ProjectNavigation
        previous={{
          href: "/lab/paper",
          label: "Paper variants",
          caption: "Back to",
        }}
        next={{ href: "/lab/tear", label: "Torn paper", caption: "Next bench" }}
        exits={[
          { href: "/lab/scene", label: "Scene engine" },
          { href: "/lab/canvas", label: "3D boundary", quiet: true },
        ]}
        label="Benches"
      />
    </article>
  );
}
