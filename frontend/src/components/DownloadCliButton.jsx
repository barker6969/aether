import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Download, Terminal, Check, Copy, ExternalLink } from "lucide-react";

// Download popover for the unified Rust binary CLI (aether-cli).
// Points at the GitHub Releases artefacts produced by
// .github/workflows/aether-cli-release.yml.
//
// Releases URL is configurable via REACT_APP_CLI_RELEASES_URL so you can
// flip it on the first time you `git tag cli-v0.1.0 && git push --tags`.
export const DownloadCliButton = ({ variant = "compact" }) => {
  const { pushLog } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const RELEASES_BASE =
    process.env.REACT_APP_CLI_RELEASES_URL ||
    "https://github.com/aether-labs/aether-cli/releases/latest/download";

  const VERSION = "0.1.0";
  const installCmd = "curl -fsSL https://get.aether.sh/cli.sh | sh";

  const platforms = [
    { label: "macOS (arm64)", key: "darwin-arm64", file: `aether-cli-${VERSION}-aarch64-apple-darwin.tar.gz` },
    { label: "macOS (x64)", key: "darwin-x64", file: `aether-cli-${VERSION}-x86_64-apple-darwin.tar.gz` },
    { label: "Linux (x64)", key: "linux-x64", file: `aether-cli-${VERSION}-x86_64-unknown-linux-gnu.tar.gz` },
    { label: "Linux (arm64)", key: "linux-arm64", file: `aether-cli-${VERSION}-aarch64-unknown-linux-gnu.tar.gz` },
    { label: "Windows (x64)", key: "windows-x64", file: `aether-cli-${VERSION}-x86_64-pc-windows-msvc.zip` },
    { label: "Windows (arm64)", key: "windows-arm64", file: `aether-cli-${VERSION}-aarch64-pc-windows-msvc.zip` },
  ];

  const handleDownload = (p) => {
    const url = `${RELEASES_BASE}/${p.file}`;
    pushLog("INFO", `Resolving aether-cli release · target = ${p.key} ...`);
    pushLog("SUCCESS", `Opening release: ${p.file}`);
    window.open(url, "_blank", "noopener");
    setOpen(false);
  };

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        // Clipboard API blocked (e.g. non-secure context). Non-fatal — user can copy manually.
        console.warn("Clipboard write blocked:", e?.message || e);
      }
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
              <span className="font-mono text-[9px] text-white/40">v{VERSION}</span>
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
                  {platforms.map((p) => (
                    <button
                      key={p.key}
                      data-testid={`cli-download-${p.key}`}
                      onClick={() => handleDownload(p)}
                      className="h-8 px-2 border border-white/10 hover:border-[#00FF41]/40 hover:bg-[#00FF41]/5 hover:text-[#00FF41] text-white/70 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors text-left flex items-center justify-between gap-1"
                    >
                      <span className="truncate">{p.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
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
