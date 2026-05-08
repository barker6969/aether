import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Cpu, Radio, Smartphone, ScrollText, Settings, CreditCard, Coins } from "lucide-react";
import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/mtk", label: "MTK Service", icon: Cpu, testid: "nav-mtk" },
  { to: "/qualcomm", label: "Qualcomm Service", icon: Radio, testid: "nav-qualcomm" },
  { to: "/iphone", label: "iPhone Service", icon: Smartphone, testid: "nav-iphone" },
  { to: "/logs", label: "Logs", icon: ScrollText, testid: "nav-logs" },
  { to: "/pricing", label: "Pricing & Credits", icon: CreditCard, testid: "nav-pricing" },
  { to: "/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
];

const LOGO_URL =
  "https://static.prod-images.emergentagent.com/jobs/540cc9df-c50a-4a07-a460-6c88ca22b1a7/images/2d4119f8e681e91c440e01928176b55e52818652e44fd72f5f424ba935136d9c.png";

export const Sidebar = () => {
  const { credits } = useApp();

  return (
    <aside
      data-testid="app-sidebar"
      className="w-60 flex-shrink-0 bg-[#070709] border-r border-white/10 flex flex-col"
    >
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 border border-[#00FF41]/40 bg-black flex items-center justify-center relative overflow-hidden">
            <img
              src={LOGO_URL}
              alt="Aether"
              data-testid="brand-logo"
              className="w-full h-full object-contain p-0.5"
            />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00FF41] rounded-full animate-pulse-glow" />
          </div>
          <div className="leading-none">
            <div className="text-white font-semibold text-sm tracking-wide">AETHER</div>
            <div className="text-[10px] text-[#00FF41] font-mono tracking-[0.3em] mt-1">REPAIR.SUITE</div>
          </div>
        </div>
      </div>

      {/* Credits widget */}
      <NavLink
        to="/pricing"
        data-testid="credits-widget"
        className="mx-3 mt-3 mb-1 px-3 py-2.5 border border-[#00FF41]/30 bg-[#00FF41]/5 hover:bg-[#00FF41]/10 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#00FF41]" strokeWidth={2} />
          <div className="leading-tight">
            <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/50">
              Balance
            </div>
            <div data-testid="credits-balance" className="text-[#00FF41] font-bold text-sm">
              {credits} Credits
            </div>
          </div>
        </div>
        <span className="font-mono text-[9px] tracking-[0.2em] text-white/40 group-hover:text-[#00FF41]">
          TOP-UP →
        </span>
      </NavLink>

      <nav className="flex-1 py-3 px-2">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.25em] text-white/30 font-mono">
          Navigation
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                data-testid={item.testid}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#00FF41]/10 text-[#00FF41] border-l-2 border-[#00FF41]"
                      : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={1.8} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-3 font-mono text-[10px] text-white/30 space-y-1">
        <div className="flex justify-between">
          <span>BUILD</span>
          <span className="text-white/60">4.7.2-stable</span>
        </div>
        <div className="flex justify-between">
          <span>KERNEL</span>
          <span className="text-white/60">aether-x86_64</span>
        </div>
        <div className="flex justify-between">
          <span>LICENSE</span>
          <span className="text-[#00FF41]">SOLO • ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
