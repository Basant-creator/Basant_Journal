/**
 * The deck's fixed names, with no imports, so next.config.ts can read them
 * to point the earlier site's addresses at their places in this one.
 */

/** The projects the deck bills, in the order it deals them. */
export const KEY_CASES = ["strata", "tuneit", "onsight"] as const;

/** The cards that are not projects, by id: each is an anchor on the home page. */
export const CARD = {
  opening: "opening",
  about: "about",
  toolbox: "toolbox",
  record: "record",
  contact: "contact",
} as const;
