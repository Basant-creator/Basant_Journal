import { Navigation } from "@/components/navigation/Navigation";
import styles from "./layout.module.css";

/**
 * The shell every page inside the frontier shares.
 *
 * The landing page sits outside this group deliberately — arrival should not
 * have a navigation bar across it. Everywhere else, the linear route is
 * always present beside the spatial one.
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
    </div>
  );
}
