"use client";

export function DeleteButton({
  children = "Delete",
  message = "Are you sure? This action cannot be undone.",
  className = "btn btn-danger btn-sm"
}: {
  children?: React.ReactNode;
  message?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
