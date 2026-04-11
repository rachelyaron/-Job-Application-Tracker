"use client";

import { Fragment } from "react";
import { JobStages, applyStageClick } from "@/lib/supabase";

interface TimelineProps {
  stages: JobStages;
  onChange?: (updated: JobStages) => void;
  compact?: boolean;
}

function StageIcon({ state, size }: { state: string; size: number }) {
  if (state === "completed")
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M2.5 8.5L6.5 12.5L13.5 4" stroke="white" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "failed")
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="white"
          strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  return (
    <div
      style={{ width: size * 0.55, height: size * 0.55 }}
      className="rounded-full bg-slate-300"
    />
  );
}

export default function Timeline({ stages, onChange, compact = false }: TimelineProps) {
  const nodeSize = compact ? 22 : 36;
  const iconSize = compact ? 9 : 15;

  return (
    <div
      className="flex items-center w-full"
      dir="rtl"
      style={{ minWidth: compact ? Math.max(184, stages.length * 46) : undefined }}
    >
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;
        const nextCompleted = !isLast && stages[idx + 1].state === "completed";

        const nodeClass = [
          "rounded-full flex items-center justify-center transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          onChange ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default",
          stage.state === "completed"
            ? "bg-green-500 shadow-sm focus:ring-green-400"
            : stage.state === "failed"
            ? "bg-red-500 shadow-sm focus:ring-red-400"
            : "bg-slate-200 focus:ring-slate-300",
        ].join(" ");

        return (
          <Fragment key={idx}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onChange?.(applyStageClick(stages, idx))}
                disabled={!onChange}
                title={stage.name}
                style={{ width: nodeSize, height: nodeSize, flexShrink: 0 }}
                className={nodeClass}
                aria-label={`${stage.name}: ${
                  stage.state === "completed" ? "עבר" :
                  stage.state === "failed"    ? "נכשל" : "טרם הגיע"
                }`}
              >
                <StageIcon state={stage.state} size={iconSize} />
              </button>

              <span
                className={
                  compact
                    ? "mt-0.5 text-[9px] text-slate-400 text-center leading-tight max-w-[38px] break-words hyphens-auto"
                    : "mt-1.5 text-xs text-slate-500 text-center leading-tight max-w-[60px] break-words"
                }
                style={{ wordBreak: "break-word" }}
              >
                {stage.name || `שלב ${idx + 1}`}
              </span>
            </div>

            {!isLast && (
              <div
                className={`flex-1 h-0.5 transition-colors duration-300 ${
                  nextCompleted ? "bg-green-400" : "bg-slate-200"
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
