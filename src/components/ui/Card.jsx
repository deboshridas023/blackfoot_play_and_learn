import React from "react";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Card
 * Consistent surface used across screens.
 */
export default function Card({
  as: Comp = "div",
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={classNames(
        "surface shadow-soft",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

