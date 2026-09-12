import styles from "./RecordDiagram.module.css";

/**
 * The three records' figures.
 *
 * Each one draws what its system actually does, taken from the architecture
 * and implementation already in the content model — a Camelot wheel because
 * TuneIt matches on one, a validator gate because OnSight has one, three
 * target tiers because BobAI produces three. Nothing here is invented to make
 * a nicer picture.
 *
 * They share a drawing language — same weights, same station marks, same
 * arrowheads, same small caps — so three different figures still read as
 * three sheets out of one drawing office. The stock underneath them changes;
 * the hand does not.
 */

const WIDTH = 640;
const HEIGHT = 360;

/** One arrowhead definition, shared by all three figures. */
function Arrow({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path className={styles.head} d="M 0 1 L 9 5 L 0 9" />
    </marker>
  );
}

/* ==========================================================================
   TuneIt — harmonic matching and the energy trajectory
   ========================================================================== */

function HarmonicFlow() {
  const cx = 150;
  const cy = 180;
  const r = 96;

  // Twelve Camelot positions. The wheel's rule is that a track is compatible
  // with its neighbours one step round, or the same number in the other mode.
  const wheel = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    return {
      i,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      label: String(i + 1),
    };
  });

  // The trajectory: energy rising through a set and settling at the end.
  const track = [
    [330, 258],
    [372, 236],
    [414, 198],
    [456, 150],
    [498, 128],
    [540, 142],
    [582, 186],
  ];
  const curve = track
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  return (
    <>
      <defs>
        <Arrow id="fig-tuneit-arrow" />
      </defs>

      <g className={styles.figure}>
        {/* --- the wheel ------------------------------------------------- */}
        <circle className={styles.ring} cx={cx} cy={cy} r={r} />
        <circle className={styles.ringInner} cx={cx} cy={cy} r={r - 22} />

        {/* Compatible steps, drawn as the short arcs the matcher may take. */}
        {[0, 1, 2, 3].map((i) => (
          <path
            key={`step-${i}`}
            className={styles.step}
            d={`M ${wheel[i].x} ${wheel[i].y} L ${wheel[i + 1].x} ${wheel[i + 1].y}`}
          />
        ))}

        {wheel.map((p) => (
          <g key={`pos-${p.i}`}>
            <circle className={p.i < 5 ? styles.nodeLive : styles.node} cx={p.x} cy={p.y} r="7" />
            <text className={styles.tick} x={p.x} y={p.y + 22} textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}

        <text className={styles.centre} x={cx} y={cy - 4} textAnchor="middle">
          CAMELOT
        </text>
        <text className={styles.centreSub} x={cx} y={cy + 14} textAnchor="middle">
          HARMONIC MATCH
        </text>

        {/* --- the hand-off ---------------------------------------------- */}
        <path
          className={styles.flow}
          d={`M ${cx + r + 14} ${cy} H 300`}
          markerEnd="url(#fig-tuneit-arrow)"
        />

        {/* --- the trajectory -------------------------------------------- */}
        <path className={styles.axis} d="M 316 282 H 606 M 316 282 V 104" />
        <text className={styles.axisLabel} x={316} y={302}>
          SET ORDER
        </text>
        <text
          className={styles.axisLabel}
          x={308}
          y={100}
          textAnchor="end"
          transform="rotate(-90 308 100)"
        >
          ENERGY
        </text>

        <path className={styles.trajectory} d={curve} />
        {track.map(([x, y], i) => (
          <circle key={`t-${i}`} className={styles.sample} cx={x} cy={y} r="4.4" />
        ))}
      </g>
    </>
  );
}

/* ==========================================================================
   OnSight — the procedure, and the gates a submission passes
   ========================================================================== */

function ProcedureChain() {
  const stages = [
    { x: 24, label: "PDF" },
    { x: 156, label: "EXTRACT" },
    { x: 288, label: "VALIDATE" },
    { x: 420, label: "GRADE" },
    { x: 552, label: "ANALYTICS" },
  ];

  return (
    <>
      <defs>
        <Arrow id="fig-onsight-arrow" />
      </defs>

      <g className={styles.figure}>
        {/* The classification band a case file carries at its head. */}
        <path className={styles.band} d="M 24 26 H 616" />
        <text className={styles.bandText} x={24} y={20}>
          PROCEDURE · EVERY GATE LOGGED
        </text>

        {stages.map((s, i) => (
          <g key={s.label}>
            <rect className={styles.box} x={s.x} y={122} width={64} height={72} rx="2" />
            <text className={styles.boxText} x={s.x + 32} y={166} textAnchor="middle">
              {s.label}
            </text>
            {i < stages.length - 1 ? (
              <path
                className={styles.flow}
                d={`M ${s.x + 64} 158 H ${stages[i + 1].x - 6}`}
                markerEnd="url(#fig-onsight-arrow)"
              />
            ) : null}
            {/* A tick where the stage is a gate that must pass. */}
            {i > 0 ? (
              <path
                className={styles.tickMark}
                d={`M ${s.x + 18} 108 l 8 9 l 16 -19`}
              />
            ) : null}
          </g>
        ))}

        {/* The fallback: a failed extraction re-enters rather than dying. */}
        <path
          className={styles.fallback}
          d="M 320 194 V 244 H 188 V 194"
          markerEnd="url(#fig-onsight-arrow)"
        />
        <text className={styles.small} x={254} y={262} textAnchor="middle">
          FALLBACK ON MALFORMED EXTRACTION
        </text>

        {/* The role check every endpoint sits behind. */}
        <path className={styles.guard} d="M 24 300 H 616" />
        <text className={styles.small} x={24} y={320}>
          HIERARCHICAL RBAC · JWT · REFRESH ROTATION
        </text>
        <text className={styles.small} x={616} y={320} textAnchor="end">
          TIME WINDOW ENFORCED
        </text>
      </g>
    </>
  );
}

/* ==========================================================================
   BobAI — the scaffolding pipeline and what it produces
   ========================================================================== */

function ScaffoldTree() {
  const tiers = [
    { y: 92, label: "VANILLA JS" },
    { y: 156, label: "REACT" },
    { y: 220, label: "NODE / EXPRESS" },
  ];

  const files = ["src/", "  index", "  api/", "  schema.sql", "README", ".github/"];

  return (
    <>
      <defs>
        <Arrow id="fig-bobai-arrow" />
      </defs>

      <g className={styles.figure}>
        <rect className={styles.box} x={18} y={130} width={86} height={56} rx="2" />
        <text className={styles.boxText} x={61} y={163} textAnchor="middle">
          FLASK API
        </text>

        <path
          className={styles.flow}
          d="M 104 158 H 140"
          markerEnd="url(#fig-bobai-arrow)"
        />

        <rect className={styles.box} x={140} y={118} width={94} height={80} rx="2" />
        <text className={styles.boxText} x={187} y={152} textAnchor="middle">
          SCAFFOLD
        </text>
        <text className={styles.boxText} x={187} y={172} textAnchor="middle">
          ENGINE
        </text>

        {/* Three targets, which is the metric the record already reports. */}
        {tiers.map((t) => (
          <g key={t.label}>
            <path
              className={styles.branch}
              d={`M 234 158 C 262 158 262 ${t.y + 20} 292 ${t.y + 20}`}
              markerEnd="url(#fig-bobai-arrow)"
            />
            <rect className={styles.tier} x={298} y={t.y} width={126} height={40} rx="2" />
            <text className={styles.boxText} x={361} y={t.y + 25} textAnchor="middle">
              {t.label}
            </text>
          </g>
        ))}

        <path
          className={styles.flow}
          d="M 424 158 H 458"
          markerEnd="url(#fig-bobai-arrow)"
        />

        {/* The repository, as a file tree — the thing that actually ships. */}
        <rect className={styles.sheet} x={458} y={72} width={160} height={172} rx="2" />
        <text className={styles.sheetHead} x={468} y={92}>
          PROVISIONED REPO
        </text>
        <path className={styles.rule} d="M 468 100 H 608" />
        {files.map((f, i) => (
          <text key={f} className={styles.file} x={470} y={122 + i * 21}>
            {f}
          </text>
        ))}

        <path className={styles.dashed} d="M 538 244 V 286" />
        <text className={styles.small} x={538} y={306} textAnchor="middle">
          INTEGRATION TESTS
        </text>

        <text className={styles.small} x={18} y={306}>
          MULTI-FILE EXTRACTION · REGEX FALLBACK
        </text>
      </g>
    </>
  );
}

const DIAGRAMS: Record<string, () => React.JSX.Element> = {
  tuneit: HarmonicFlow,
  onsight: ProcedureChain,
  bobai: ScaffoldTree,
};

export const DIAGRAM_WIDTH = WIDTH;
export const DIAGRAM_HEIGHT = HEIGHT;

export function RecordDiagram({ project }: { project: string }) {
  const Drawing = DIAGRAMS[project];
  return Drawing ? <Drawing /> : null;
}
