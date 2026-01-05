import React from "react";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Button
 * Consistent button styles across the whole app.
 */
export default function Button({
  as: Comp = "button",
  variant = "primary", // primary | secondary | ghost | danger
  size = "md", // sm | md | lg
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  disabled,
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none";

  const variants = {
    primary:
      "bg-[var(--brand)] text-white hover:bg-[#8c1d1d] shadow-sm",
    secondary:
      "bg-white/80 text-[var(--text)] border border-[var(--border)] hover:bg-amber-50/40",
    ghost:
      "text-[var(--text)] hover:bg-amber-50/40",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const disabledStyles = "disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <Comp
      className={classNames(
        base,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        disabledStyles,
        className
      )}
      disabled={Comp === "button" ? disabled : undefined}
      aria-disabled={Comp !== "button" ? disabled : undefined}
      {...props}
    >
      {LeftIcon ? <LeftIcon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{children}</span>
      {RightIcon ? <RightIcon className="h-4 w-4" aria-hidden="true" /> : null}
    </Comp>
  );
}

