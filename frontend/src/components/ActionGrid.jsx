import React from "react";
import { useApp } from "../context/AppContext";
import {
  ShieldOff,
  Hash,
  Unlock,
  Eraser,
  Loader2,
  Zap,
  KeyRound,
  Cloud,
  Lock,
  Tag,
  Wifi,
  Save,
  Wrench,
  Fingerprint,
  ShieldCheck,
  Activity,
  Search,
} from "lucide-react";

const ICONS = {
  ShieldOff,
  Hash,
  Unlock,
  Eraser,
  KeyRound,
  Cloud,
  Lock,
  Tag,
  Wifi,
  Save,
  Wrench,
  Fingerprint,
  ShieldCheck,
  Activity,
  Search,
};

const DEFAULT_ACTIONS = [
  { key: "bypass_frp",        label: "Bypass FRP",          icon: "ShieldOff", danger: false, testid: "action-bypass-frp", cost: "Free" },
  { key: "repair_imei",       label: "Repair IMEI",         icon: "Hash",      danger: false, testid: "action-repair-imei", cost: "5 Credits" },
  { key: "unlock_bootloader", label: "Unlock Bootloader",   icon: "Unlock",    danger: true,  testid: "action-unlock-bootloader", cost: "10 Credits" },
  { key: "erase_userdata",    label: "Erase Userdata",      icon: "Eraser",    danger: true,  testid: "action-erase-userdata", cost: "Free" },
];

export const ActionGrid = ({ platform = "MediaTek", actions, title }) => {
  const { runAction, activeAction, status, device } = useApp();
  const platformOk = !device || device.platform === platform || platform === "ALL";
  const list = actions && actions.length ? actions : DEFAULT_ACTIONS;
  const disabled = status !== "connected" || !platformOk;
  const cols = list.length > 4 ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2";

  return (
    <div
      data-testid="action-grid-panel"
      className="bg-[#09090B] border border-white/10 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#00FF41]" strokeWidth={2} />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/70">
            {title || (platform === "ALL" ? "Quick Actions" : `${platform} Operations`)}
          </span>
          <span className="font-mono text-[10px] text-white/30">· {list.length}</span>
        </div>
        {!platformOk && device && (
          <span className="font-mono text-[10px] text-yellow-400/80 tracking-[0.15em] uppercase">
            ⚠ Wrong platform
          </span>
        )}
      </div>

      <div className={`grid ${cols} gap-px bg-white/5 flex-1`}>
        {list.map((a) => {
          const isActive = activeAction === a.label;
          const isDisabled = disabled || activeAction;
          const Icon = ICONS[a.icon] || Zap;
          return (
            <button
              key={a.key}
              data-testid={a.testid}
              disabled={isDisabled}
              onClick={() => runAction(a.key, a.label)}
              className={`group relative bg-[#09090B] p-4 flex flex-col items-start gap-2 transition-colors min-h-[110px] text-left ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : a.danger
                    ? "hover:bg-red-500/5"
                    : "hover:bg-[#00FF41]/5"
              } ${isActive ? "bg-[#00FF41]/10" : ""}`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 border flex items-center justify-center ${
                    a.danger
                      ? "border-red-500/30 text-red-400 group-hover:border-red-500"
                      : "border-[#00FF41]/30 text-[#00FF41] group-hover:border-[#00FF41]"
                  } transition-colors`}
                >
                  {isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  )}
                </div>
                {a.cost && (
                  <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
                    a.cost === "Free" ? "text-[#00FF41]/70" : "text-white/40"
                  }`}>
                    {a.cost}
                  </span>
                )}
              </div>
              <div className="text-left w-full">
                <div className="text-white text-sm font-semibold tracking-tight leading-snug">
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

// Pre-built action lists for each platform module
export const MTK_ACTIONS = [
  ...DEFAULT_ACTIONS,
  { key: "mi_account_bypass", label: "Mi Account Bypass", icon: "Cloud",     danger: false, testid: "action-mi-account",   cost: "20 Credits" },
  { key: "read_codes",        label: "Read Lockscreen",    icon: "KeyRound",  danger: false, testid: "action-read-codes",   cost: "8 Credits" },
  { key: "read_frp_token",    label: "Read FRP Token",     icon: "Fingerprint", danger: false, testid: "action-read-frp",   cost: "3 Credits" },
  { key: "boot_repair",       label: "Boot Repair",        icon: "Wrench",    danger: false, testid: "action-boot-repair",  cost: "10 Credits" },
];

export const QC_ACTIONS = [
  ...DEFAULT_ACTIONS,
  { key: "knox_suspend",      label: "Samsung KG Suspend", icon: "Lock",      danger: false, testid: "action-knox-suspend", cost: "15 Credits" },
  { key: "carrier_unlock",    label: "Carrier Unlock",     icon: "Wifi",      danger: false, testid: "action-carrier-unlock", cost: "12 Credits" },
  { key: "demo_unit_disable", label: "Disable Demo Mode",  icon: "Tag",       danger: false, testid: "action-demo-disable", cost: "4 Credits" },
  { key: "safe_format",       label: "Safe Format",        icon: "Save",      danger: false, testid: "action-safe-format",  cost: "5 Credits" },
];

export const IPHONE_ACTIONS = [
  { key: "read_info",         label: "Modern Diagnostic",  icon: "Activity",     danger: false, testid: "iphone-action-diag",     cost: "20 Credits" },
  { key: "icloud_check",      label: "Activation Probe",   icon: "Search",       danger: false, testid: "iphone-action-probe",    cost: "5 Credits" },
  { key: "passcode_recover",  label: "Passcode Recovery",  icon: "Lock",         danger: true,  testid: "iphone-action-passcode", cost: "30 Credits" },
  { key: "trust_audit",       label: "Trust Cache Audit",  icon: "ShieldCheck",  danger: false, testid: "iphone-action-trust",    cost: "10 Credits" },
];
