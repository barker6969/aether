import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Download, Terminal, Check, Copy } from "lucide-react";

// Simulated download for the unified Rust binary CLI.
// Generates an in-memory shell stub so the click feels real.
export const DownloadCliButton = ({ variant = "compact" }) => {
  const { pushLog } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const installCmd = "curl -fsSL https://get.aether.sh/cli.sh | sh";

  const handleDownload = (platform) => {
    pushLog("INFO", `Resolving aether-cli release · target = ${platform} ...`);
    const stub = [
      "#!/usr/bin/env sh",
      "# Aether CLI installer stub (v4.7.2)",
      "# Unified Rust binary — MTK / Qualcomm / Apple / Samsung",
      "#",
      `# Target: ${platform}`,
      "# This is a placeholder shipped from the in-app downloader.",
      "echo 'Aether CLI bootstrap — running ...'",
      "",
    ].join("\n");
    const blob = new Blob([stub], { type: "application/x-sh" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aether-cli-${platform}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    pushLog("SUCCESS", `aether-cli (${platform}) installer downloaded.`);
    setOpen(false);
  };

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const Trigger =
    variant === "primary" ? (
      <button
        data-testid="cli-download-trigger"
        onClick={() => setOpen((o) => !o)}
        className="h-10 px-4 bg-[#00FF41] hover:bg-[#00CC33] text-black font-mono text-xs tracking-[0.22em] uppercase font-semibold flex items-center gap-2 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Download CLI
      </button>
    ) : (
      <button
        data-testid="cli-download-trigger"
        onClick={() => setOpen((o) => !o)}
        className="h-7 px-2.5 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41] font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 transition-colors"
      >
        <Terminal className="w-3 h-3" />
        Aether CLI
      </button>
    );

  return (
    <div className="relative">
      {Trigger}
      {open && (
        <>
          {/* click-outside backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            data-testid="cli-download-popover"
            className="absolute right-0 top-full mt-1.5 w-80 z-50 bg-[#0A0A0D] border border-[#00FF41]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#00FF41]" />
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/80">
                  aether-cli · unified rust binary
                </span>
              </div>
              <span className="font-mono text-[9px] text-white/40">v4.7.2</span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/40 mb-1.5">
                  One-line install
                </div>
                <div className="bg-black border border-white/10 px-3 py-2 flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-[#00FF41] truncate">
                    {installCmd}
                  </code>
                  <button
                    data-testid="cli-copy-install"
                    onClick={copyInstall}
                    className="text-white/50 hover:text-[#00FF41] flex-shrink-0"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#00FF41]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/40 mb-1.5">
                  Native builds
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "macOS (arm64)", key: "darwin-arm64" },
                    { label: "macOS (x64)", key: "darwin-x64" },
                    { label: "Linux (x64)", key: "linux-x64" },
                    { label: "Linux (arm64)", key: "linux-arm64" },
                    { label: "Windows (x64)", key: "windows-x64" },
                    { label: "Windows (arm64)", key: "windows-arm64" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      data-testid={`cli-download-${p.key}`}
                      onClick={() => handleDownload(p.key)}
                      className="h-8 px-2 border border-white/10 hover:border-[#00FF41]/40 hover:bg-[#00FF41]/5 hover:text-[#00FF41] text-white/70 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors text-left"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="font-mono text-[10px] text-white/40 leading-relaxed pt-1 border-t border-white/5">
                Single static binary · MTK BROM, Qualcomm Sahara/Firehose, Apple DFU,
                Samsung KG — all in one drop.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
