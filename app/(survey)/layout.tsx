import { Navigation } from "@/components/navigation/Navigation";
import { RouteTransition } from "@/components/world/RouteTransition";
import styles from "./layout.module.css";

/**
 * The shell every page inside the frontier shares.
 *
 * The landing page sits outside this group deliberately — arrival should not
 * have a navigation bar across it. Everywhere else, the linear route is
 * always present beside the spatial one.
 *
 * RouteTransition lives here rather than on any page for one structural
 * reason: this component instance survives a navigation inside the group, so
 * a cover laid down on one page can be torn open on the next. On a page it
 * would unmount with the route it was covering.
 */
export default function SurveyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.shell}>
      <Navigation />
      <main id="main" className={styles.main}>
        {children}
      </main>
      <RouteTransition />
    </div>
  );
}
