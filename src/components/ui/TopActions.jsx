import React from "react";
import Button from "./Button";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * TopActions
 * Consistent top action bar (Back / Exit / Home) for games & content pages.
 */
export default function TopActions({
  left,
  right,
  className,
}) {
  if (!left && !right) return null;

  return (
    <div className={classNames("mt-4 flex items-center justify-between gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

export function BackButton({ onClick, children = "Back", icon: Icon }) {
  return (
    <Button variant="secondary" onClick={onClick} leftIcon={Icon}>
      {children}
    </Button>
  );
}

export function ExitButton({ onClick, children = "Exit to Home", icon: Icon }) {
  return (
    <Button onClick={onClick} leftIcon={Icon}>
      {children}
    </Button>
  );
}

