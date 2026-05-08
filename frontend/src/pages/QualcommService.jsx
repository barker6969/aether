import React from "react";
import { ActionGrid } from "../components/ActionGrid";
import { DeviceInfoPanel } from "../components/DeviceInfoPanel";
import { Console } from "../components/Console";
import { useApp } from "../context/AppContext";
import { Radio, AlertTriangle } from "lucide-react";

const SUPPORTED = [
  "SM6115", "SM6225", "SM6375", "SM7125", "SM7150", "SM7250", "SM7325",
  "SM7350", "SM7450", "SM7475", "SM8150", "SM8250", "SM8350", "SM8450",
  "SM8475", "SM8550", "SM8650", "SDM660", "SDM845", "SDA845",
];

export default function QualcommService() {
  const { device, status } = useApp();
  const matches = device && device.platform === "Qualcomm";

  return (
    <div data-testid="qualcomm-page" className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      <div className="bg-[#09090B] border border-white/10 p-5 flex items-center gap-4 flex-shrink-0">
        <div className="w-12 h-12 border border-[#00FF41]/40 bg-[#00FF41]/5 flex items-center justify-center">
          <Radio className="w-6 h-6 text-[#00FF41]" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Qualcomm Service Module</h1>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mt-1">
            EDL 9008 • Sahara/Firehose v3.0 • QFIL protocol
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Connected</div>
          <div className={`text-sm font-semibold ${matches ? "text-[#00FF41]" : "text-white/70"}`}>
            {device ? device.model.split(" ")[0] : "—"}
          </div>
        </div>
      </div>

      {!matches && status === "connected" && (
        <div className="bg-yellow-400/5 border border-yellow-400/30 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-yellow-400" strokeWidth={2} />
          <span className="font-mono text-xs text-yellow-200/80">
            Connected device is not Qualcomm. Switch to MTK Service or reconnect target.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-shrink-0">
        <div className="lg:col-span-5">
          <ActionGrid platform="Qualcomm" />
        </div>
        <div className="lg:col-span-4">
          <DeviceInfoPanel />
        </div>
        <div className="lg:col-span-3 bg-[#09090B] border border-white/10 p-4">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50 mb-3">
            Supported chipsets
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto">
            {SUPPORTED.map((s) => (
              <span
                key={s}
                className={`font-mono text-[10px] px-2 py-1 border ${
                  device?.model?.includes(s)
                    ? "border-[#00FF41]/60 text-[#00FF41] bg-[#00FF41]/10"
                    : "border-white/5 text-white/50"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Console height="h-full" />
      </div>
    </div>
  );
}
