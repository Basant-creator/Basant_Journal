import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
};

function classNames(variant: Variant, size: Size, className?: string) {
  return [styles.base, styles[variant], size === "sm" ? styles.sm : "", className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button className={classNames(variant, size, className)} {...rest}>
      <span className={styles.label}>{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  href,
  external = false,
  children,
  className,
}: LinkProps) {
  const cls = classNames(variant, size, className);

  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer noopener">
        <span className={styles.label}>{children}</span>
      </a>
    );
  }

  return (
    <Link className={cls} href={href}>
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
