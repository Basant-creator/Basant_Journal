/**
 * THE FRONTIER — content model.
 *
 * These types describe `content/portfolio.json`, which is the single source of
 * facts for the whole site. Both the creative (exploration) renderer and the
 * professional renderer read it. Nothing is duplicated into a component.
 *
 * Fields that are genuinely unknown are `null` and accompanied by a
 * `*Status: "unresolved"` marker, so unresolved data is visible in the type
 * system rather than invented.
 */

export type UnresolvedStatus = "unresolved" | "resolved";

/**
 * A location's implementation state.
 *
 * `surveying` means the route does not exist yet: the marker stays visible and
 * keyboard-focusable, shows an unmapped treatment, and does not navigate
 * anywhere. Promoting a location is a one-word data change — the map component
 * does not need to know.
 */
export type LocationStatus = "mapped" | "surveying";

export type LabelAnchor = "below" | "above" | "left" | "right";

export type LocationSymbol =
  | "tent"
  | "toolroll"
  | "journal"
  | "notice"
  | "roofs"
  | "sheaf"
  | "signpost";

export interface Meta {
  conceptTitle: string;
  conceptSubtitle: string;
  volume: string;
  sheet: string;
  surveyed: string;
}

export interface JourneyStep {
  year: string;
  title: string;
  body: string;
}

export interface Person {
  name: string;
  shortName: string;
  role: string;
  tagline: string;
  summary: string;
  location: string;
  availability: string;
  interests: string[];
  journey: JourneyStep[];
}

export interface Links {
  github: string;
  linkedin: string;
  email: string;
  phone: string;
  resume: string;
  resumeStatus: UnresolvedStatus;
}

export interface NavigationLocation {
  id: string;
  label: string;
  section: string;
  route: string;
  symbol: LocationSymbol;
  order: number;
  /** Position in the map's 1600 x 1000 survey coordinate space. */
  coord: [number, number];
  labelAnchor: LabelAnchor;
  /** Relative visual weight. Journal is 1.4; everything else is 1. */
  weight: number;
  status: LocationStatus;
  description: string;
}

export interface ProjectMetric {
  value: string;
  unit: string;
  label: string;
}

export interface ProjectChallenge {
  challenge: string;
  resolution: string;
}

export interface VisualAsset {
  src: string;
  alt: string;
  caption?: string;
}

/**
 * A measurement, as a table rather than a headline.
 *
 * Some results are a comparison and cannot honestly be reduced to one figure.
 * TuneIt's four engines are the case this exists for: the interesting thing is
 * not how fast any one of them is, it is that each trades how much of a
 * playlist it keeps against how smoothly the result runs, and you can only see
 * that by putting them side by side.
 *
 * `note` is where the caveat goes, and it is not optional in spirit. A table
 * of numbers with no account of what would make them misleading is the same
 * decoration MetricPanel's caption exists to prevent, laid out in columns.
 */
export interface EvidenceTable {
  caption: string;
  columns: string[];
  rows: string[][];
  note?: string;
}

export interface Project {
  id: string;
  /**
   * Canonical route. The content model owns it so components never write
   * "/projects/tuneit" inline, which is how route drift starts.
   */
  route: string;
  title: string;
  subtitle: string;
  date: string;
  chapter: string;
  summary: string;
  problem: string;
  objective: string;
  architecture: string;
  implementation: string[];
  technologies: string[];
  metrics: ProjectMetric[];
  challenges: ProjectChallenge[];
  lessons: string;
  github: string | null;
  liveUrl: string | null;
  linksStatus: UnresolvedStatus;
  visualAssets: VisualAsset[];
  /**
   * Where the figures above came from, in this project's own terms.
   *
   * Optional in the type and mandatory in practice. It replaced a caption the
   * record page generated from the title and the date, which looked like
   * provenance and carried none: every project got "Measured on X — dates",
   * whether the numbers were measured, asserted, or neither.
   */
  metricsCaption?: string;
  /** A side-by-side result, where one number would misrepresent it. */
  evidence?: EvidenceTable;
  /**
   * Whether the runs against the named public datasets were kept.
   *
   * "unresolved" means the work happened and the artefact did not survive, so
   * the record describes the fixtures it can show rather than the datasets it
   * cannot. Same convention as linksStatus: the gap is recorded, not filled.
   */
  datasetRunsStatus?: UnresolvedStatus;
}

/**
 * Work in progress: a name and an idea, and deliberately nothing else.
 *
 * Not a Project and not a route. A field record is a filing — it has a period,
 * a stamp and a result — and something still being built has none of those. It
 * earns a record by being finished, not by being mentioned.
 */
export interface OngoingWork {
  id: string;
  title: string;
  idea: string;
  label: string;
}

export interface HeadlineMetric {
  id: string;
  value: string;
  unit: string;
  label: string;
  /** The project that substantiates this number, or null if it spans all. */
  project: string | null;
  context: string;
}

export interface SkillItem {
  name: string;
  /** Project ids this skill is actually evidenced in. Empty = a claim, not evidence. */
  projects: string[];
}

export interface SkillGroup {
  group: string;
  items: SkillItem[];
}

export interface EducationEntry {
  institution: string;
  qualification: string;
  place: string;
  period: string;
  detail: string;
  /** CGPA belongs in the résumé, not as a headline in the creative view. */
  showDetailInCreativeView: boolean;
  current: boolean;
}

export interface TrainingEntry {
  title: string;
  issuer: string;
  period: string;
  detail: string;
  body: string;
  certificate: string | null;
  certificateStatus: UnresolvedStatus;
}

export interface CertificationEntry {
  title: string;
  issuer: string | null;
  period: string;
  certificate: string | null;
  certificateStatus: UnresolvedStatus;
}

export interface Portfolio {
  meta: Meta;
  person: Person;
  links: Links;
  navigationLocations: NavigationLocation[];
  projects: Project[];
  metrics: HeadlineMetric[];
  skills: SkillGroup[];
  education: EducationEntry[];
  training: TrainingEntry[];
  certifications: CertificationEntry[];
  ongoing: OngoingWork[];
}
