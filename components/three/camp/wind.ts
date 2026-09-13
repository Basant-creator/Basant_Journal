/**
 * The breeze, and there is only one of it.
 *
 * §8 asks smoke to react subtly to direction, which is easy enough on its
 * own — lean the plume and it leans. The reason this is a module rather than
 * a number inside CampAtmosphere is that the scene already had two things
 * moving in air and they disagreed. The smoke swayed symmetrically about the
 * fire with no net direction at all, and the tree stand leaned back and forth
 * about zero. Two independent oscillations, no wind.
 *
 * Nobody would name that as wrong. They would say the scene felt slightly
 * synthetic and not be able to say why, which is what an art director means
 * by coherence: the reason a frame reads as a place is that everything in it
 * is subject to the same conditions.
 *
 * So there is one breeze. It blows in a fixed direction, it varies slowly,
 * and anything that moves in air asks it which way.
 */

/**
 * Which way it is going, along x.
 *
 * Negative — over the tent and away from the table. That is a composition
 * decision rather than a meteorological one: smoke drifting toward the camera
 * would cross the four objects a visitor has to be able to see, and §5 puts
 * the fire and the table on opposite sides of the frame precisely so that
 * neither is in the other's way.
 */
export const WIND_X = -1;

/**
 * How hard it is blowing at time t, from 0 to about 1.
 *
 * Never zero and never steady. Two slow waves well out of phase, biased so
 * the sum never falls below a light drift — air at dusk is rarely still, and
 * smoke that stops moving reads as a paused animation rather than as calm.
 */
export function breeze(t: number): number {
  const slow = Math.sin(t * 0.14) * 0.5 + 0.5;
  const slower = Math.sin(t * 0.057 + 1.9) * 0.5 + 0.5;
  return 0.35 + 0.4 * slow + 0.25 * slower;
}

/**
 * The small, faster variation on top — gusts, for want of a better word.
 *
 * Signed, unlike `breeze`, because this is what makes a plume wander across
 * the line it is drifting along rather than travelling it exactly.
 */
export function gust(t: number, phase: number): number {
  return Math.sin(t * 0.26 + phase) * 0.7 + Math.sin(t * 0.61 + phase * 1.7) * 0.3;
}
