import React from "react";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Page
 * Provides consistent page background + content container.
 */
export default function Page({
  children,
  className,
  containerClassName,
  variant = "paper", // paper | plain
}) {
  return (
    <div
      className={classNames(
        "min-h-screen text-[var(--text)]",
        variant === "paper" ? "app-paper" : "bg-[var(--bg)]",
        className
      )}
    >
      <div className={classNames("mx-auto max-w-6xl px-4 sm:px-6", containerClassName)}>
        {children}
      </div>
    </div>
  );
}

