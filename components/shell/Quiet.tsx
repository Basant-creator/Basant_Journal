"use client";

import { Component, type ReactNode } from "react";

interface QuietProps {
  children: ReactNode;
  /** Named in the console so a silent failure is still a findable one. */
  name: string;
}

/**
 * A boundary around something the site can do without.
 *
 * The root layout carries three things that are pure enhancement — the grain
 * and vignette, the atmosphere control, the route curtain. None of them is
 * content. All of them are client components, and a client component that
 * throws inside the root layout does not reach `global-error`: measured twice,
 * once during hydration and once in an effect afterwards, the result both
 * times was the page rendered with its markup intact and its stylesheets no
 * longer applying — default serif on white, every word present and the site
 * gone.
 *
 * That is a bad trade for a texture overlay. This makes it a boundary instead:
 * if one of them fails, the site loses that one thing and keeps everything
 * else, which is the correct proportion. Failing decoration should cost the
 * decoration.
 *
 * It renders nothing on failure rather than a message. There is no useful
 * thing to tell a reader about a vignette that did not paint, and a visible
 * apology would be more disruptive than the absence.
 */
interface QuietState {
  failed: boolean;
}

export class Quiet extends Component<QuietProps, QuietState> {
  state: QuietState = { failed: false };

  static getDerivedStateFromError(): QuietState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[${this.props.name}] failed and was dropped:`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
