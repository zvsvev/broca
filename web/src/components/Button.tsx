import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "default" | "primary" | "coin" | "quiet";
type Size = "md" | "sm";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

interface AsButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  to?: undefined;
  href?: undefined;
}

interface AsLinkProps extends BaseProps {
  to: string;
  href?: undefined;
}

interface AsAnchorProps extends BaseProps {
  href: string;
  to?: undefined;
}

export type ButtonProps = AsButtonProps | AsLinkProps | AsAnchorProps;

function classNames({ variant = "default", size = "md", block, className }: BaseProps): string {
  return [
    "btn",
    variant === "default" ? "" : variant,
    size === "sm" ? "sm" : "",
    block ? "block" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  const { variant, size, block, className, children } = props;
  const classes = classNames({ variant, size, block, className, children });

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }
  if (props.href !== undefined) {
    return (
      <a href={props.href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  const { variant: _v, size: _s, block: _b, className: _c, children: _ch, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
