/**
 * The single read point for site content.
 *
 * Every page imports from here, never from the JSON directly, so the shape is
 * typed once. Every fact the site shows comes from content/portfolio.json;
 * the cards' own reading of it (the key projects, the toolbox credits) is in
 * lib/cards/catalog.ts.
 */

import data from "@/content/portfolio.json";
import type { Portfolio } from "./types";

export const portfolio = data as unknown as Portfolio;

export const { person, links, projects, skills } = portfolio;
export const { education, training, certifications, ongoing } = portfolio;

/**
 * The groups a "works in" line draws from: what somebody writes code in.
 * The tooling groups matter to the work and not to that question.
 */
export const CORE_STACK_GROUPS = ["Languages", "Frameworks & Libraries", "Databases"] as const;
