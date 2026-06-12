"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

type ResponsiveDialogTone = "default" | "danger";

type ResponsiveDialogProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  tone?: ResponsiveDialogTone;
  onConfirm?: () => void;
  onClose: () => void;
};

export function ResponsiveDialog({
  isOpen,
  title,
  children,
  confirmLabel = "Conferma",
  cancelLabel = "Chiudi",
  isConfirming = false,
  tone = "default",
  onConfirm,
  onClose,
}: ResponsiveDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isConfirming, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-blue-700 text-white hover:bg-blue-600";

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-dvh items-end justify-center overflow-y-auto bg-slate-950/55 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="responsive-dialog-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
      >
        <h2
          id="responsive-dialog-title"
          className="text-xl font-bold text-slate-950 sm:text-2xl"
        >
          {title}
        </h2>

        <div className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          {children}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onClose}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {cancelLabel}
          </button>

          {onConfirm ? (
            <button
              type="button"
              disabled={isConfirming}
              onClick={onConfirm}
              className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${confirmClasses}`}
            >
              {isConfirming ? "Operazione in corso..." : confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
