import React from "react";
import { useApp } from "../context/AppContext";
import { ShieldOff, Hash, Unlock, Eraser, Loader2, Zap } from "lucide-react";

const ACTIONS = [
  { key: "bypass_frp", label: "Bypass FRP", icon: ShieldOff, danger: false, testid: "action-bypass-frp" },
  { key: "repair_imei", label: "Repair IMEI", icon: Hash, danger: false, testid: "action-repair-imei" },
  { key: "unlock_bootloader", label: "Unlock Bootloader", icon: Unlock, danger: true, testid: "action-unlock-bootloader" },
  { key: "erase_userdata", label: "Erase Userdata", icon: Eraser, danger: true, testid: "action-erase-userdata" },
];

export const ActionGrid = ({ platform = "MediaTek" }) => {
  const { runAction, activeAction, status, device } = useApp();
  const platformOk = !device || device.platform === platform || platform === "ALL";
  const disabled = status !== "connected" || !platformOk;

  return (
    <div
      data-testid="action-grid-panel"
      className="bg-[#09090B] border border-white/10 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#00FF41]" strokeWidth={2} />
          <span className="font-mono text-[10px] tracking-[0.25em] text-white/70 uppercase">
            {platform === "ALL" ? "Quick Actions" : `${platform} Operations`}
          </span>
        </div>
        {!platformOk && device && (
          <span className="font-mono text-[10px] text-yellow-400/80 tracking-[0.15em] uppercase">
            ⚠ Wrong platform
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 flex-1">
        {ACTIONS.map((a) => {
          const isActive = activeAction === a.label;
          const isDisabled = disabled || activeAction;
          return (
            <button
              key={a.key}
              data-testid={a.testid}
              disabled={isDisabled}
              onClick={() => runAction(a.key, a.label)}
              className={`group relative bg-[#09090B] p-5 flex flex-col items-start gap-3 transition-colors min-h-[120px] ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : a.danger
                    ? "hover:bg-red-500/5"
                    : "hover:bg-[#00FF41]/5"
              } ${isActive ? "bg-[#00FF41]/10" : ""}`}
            >
              <div
                className={`w-9 h-9 border flex items-center justify-center ${
                  a.danger
                    ? "border-red-500/30 text-red-400 group-hover:border-red-500 group-hover:text-red-300"
                    : "border-[#00FF41]/30 text-[#00FF41] group-hover:border-[#00FF41] group-hover:bg-[#00FF41]/10"
                } transition-colors`}
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <a.icon className="w-4 h-4" strokeWidth={2} />
                )}
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-semibold tracking-tight">
                  {a.label}
                </div>
                <div className="font-mono text-[10px] text-white/40 mt-1 uppercase tracking-[0.15em]">
                  {a.danger ? "Destructive" : "Safe op"}
                </div>
              </div>
              {isActive && (
                <span className="absolute top-2 right-2 font-mono text-[9px] text-[#00FF41] tracking-[0.2em]">
                  RUNNING
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
