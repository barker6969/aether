import React from "react";
import { Minus, Square, X } from "lucide-react";
import { DownloadCliButton } from "./DownloadCliButton";

const LOGO_URL =
  "https://static.prod-images.emergentagent.com/jobs/540cc9df-c50a-4a07-a460-6c88ca22b1a7/images/2d4119f8e681e91c440e01928176b55e52818652e44fd72f5f424ba935136d9c.png";

export const WindowChrome = () => {
  return (
    <div
      data-testid="window-chrome"
      className="h-10 bg-black border-b border-white/10 flex items-center justify-between px-3 select-none flex-shrink-0"
    >
      <div className="flex items-center gap-2">
        <img src={LOGO_URL} alt="Aether" className="w-4 h-4 object-contain" />
        <span className="font-mono text-[11px] tracking-[0.25em] text-white/80 uppercase">
          Aether Repair Tool
        </span>
        <span className="font-mono text-[10px] text-white/30">v4.7.2</span>
        <span
          data-testid="window-demo-badge"
          className="font-mono text-[9px] tracking-[0.25em] uppercase text-yellow-400 border border-yellow-400/40 bg-yellow-400/5 px-1.5 py-0.5"
          title="Web demo — desktop CLI required for real device repair"
        >
          Demo
        </span>
      </div>
      <div className="flex items-center gap-3">
        <DownloadCliButton variant="compact" />
        <div className="flex items-center gap-1">
          <button
            data-testid="window-minimize"
            className="w-8 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2.4} />
          </button>
          <button
            data-testid="window-maximize"
            className="w-8 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Square className="w-3 h-3" strokeWidth={2.4} />
          </button>
          <button
            data-testid="window-close"
            className="w-8 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};
