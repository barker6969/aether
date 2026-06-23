// Mock device generators for Aether Repair Tool
const MTK_DEVICES = [
  { model: "MT6895 (Dimensity 8100)", brand: "Xiaomi Redmi K50", android: "13", patch: "2024-08-05" },
  { model: "MT6983 (Dimensity 9000)", brand: "OPPO Find X5", android: "13", patch: "2024-09-01" },
  { model: "MT6789 (Helio G99)", brand: "Realme Narzo 60", android: "14", patch: "2024-11-05" },
  { model: "MT6781 (Helio G96)", brand: "Tecno Camon 19", android: "12", patch: "2024-04-01" },
  { model: "MT6877 (Dimensity 920)", brand: "Vivo V23 Pro", android: "13", patch: "2024-07-05" },
  { model: "MT6989 (Dimensity 9300+)", brand: "Vivo X100 Ultra", android: "14", patch: "2025-01-05" },
  { model: "MT6897 (Dimensity 8300)", brand: "Redmi Note 13 Pro+", android: "14", patch: "2024-12-01" },
  { model: "MT6878 (Dimensity 7400)", brand: "Realme Narzo 70 Pro", android: "14", patch: "2024-11-01" },
  { model: "MT6886 (Dimensity 7300X)", brand: "Honor Magic V2", android: "14", patch: "2024-10-05" },
  { model: "MT8676 (Dimensity 9400)", brand: "OPPO Find X8 Pro", android: "15", patch: "2025-02-01" },
];

const QC_DEVICES = [
  { model: "SM8650 (Snapdragon 8 Gen 3)", brand: "Samsung S24 Ultra", android: "14", patch: "2024-12-01" },
  { model: "SM8550 (Snapdragon 8 Gen 2)", brand: "OnePlus 11", android: "14", patch: "2024-10-05" },
  { model: "SM7475 (Snapdragon 7+ Gen 2)", brand: "Realme GT Neo 5", android: "13", patch: "2024-06-01" },
  { model: "SM6375 (Snapdragon 695)", brand: "Motorola G73", android: "13", patch: "2024-05-05" },
  { model: "SM8475 (Snapdragon 8+ Gen 1)", brand: "ASUS ROG 6", android: "13", patch: "2024-08-05" },
  { model: "SM8750 (Snapdragon 8 Gen 4)", brand: "Samsung S25 Ultra", android: "15", patch: "2025-02-01" },
  { model: "SM7675 (Snapdragon 7 Gen 3)", brand: "OnePlus Nord 4", android: "14", patch: "2024-11-05" },
  { model: "SM7650 (Snapdragon 7s Gen 3)", brand: "Xiaomi Redmi Note 14 Pro", android: "14", patch: "2024-12-05" },
  { model: "SM8635 (Snapdragon 8s Gen 3)", brand: "iQOO Neo 9 Pro", android: "14", patch: "2024-09-05" },
  { model: "SM4450 (Snapdragon 4 Gen 2)", brand: "Motorola Moto G35", android: "14", patch: "2024-10-01" },
];

const randomHex = (len) =>
  Array.from({ length: len }, () =>
    "0123456789ABCDEF"[Math.floor(Math.random() * 16)]
  ).join("");

const randomIMEI = () => {
  let base = "";
  for (let i = 0; i < 14; i++) base += Math.floor(Math.random() * 10);
  return base + Math.floor(Math.random() * 10);
};

const maskIMEI = (imei) => imei.slice(0, 4) + " ****** " + imei.slice(-3);

const randomSerial = () => "R9F" + randomHex(8);

const pickDevicePool = (chipset) => {
  if (chipset === "MTK") return MTK_DEVICES;
  if (chipset === "QC") return QC_DEVICES;
  return Math.random() < 0.5 ? MTK_DEVICES : QC_DEVICES;
};

export const generateDevice = (chipset = "auto") => {
  const pool = pickDevicePool(chipset);
  const base = pool[Math.floor(Math.random() * pool.length)];
  const imei = randomIMEI();
  const imei2 = randomIMEI();
  const platform = MTK_DEVICES.includes(base) ? "MediaTek" : "Qualcomm";
  return {
    ...base,
    platform,
    imei,
    imei_masked: maskIMEI(imei),
    imei2,
    imei2_masked: maskIMEI(imei2),
    serial: randomSerial(),
    bootloader: platform === "MediaTek" ? "BROM v" + (5 + Math.floor(Math.random() * 6)) + ".2104" : "EDL 9008",
    cpuId: randomHex(16),
    storage: ["128GB UFS 3.1", "256GB UFS 3.1", "512GB UFS 4.0"][Math.floor(Math.random() * 3)],
    ram: ["6GB", "8GB", "12GB", "16GB"][Math.floor(Math.random() * 4)],
    region: ["EU", "GLOBAL", "INDIA", "CN", "MEA"][Math.floor(Math.random() * 5)],
    detectedAt: new Date(),
  };
};

export const COM_PORTS = ["COM3", "COM5", "COM7", "USB-Serial CH340", "USB Mass Storage"];

export const ACTION_LOG_TEMPLATES = {
  bypass_frp: [
    { level: "INFO", text: "Initiating FRP bypass sequence ..." },
    { level: "INFO", text: "Loading auth file: $PLATFORM_auth_v3.bin" },
    { level: "INFO", text: "Sending DA (Download Agent) to preloader..." },
    { level: "INFO", text: "Reading partition table from emmc_user ..." },
    { level: "INFO", text: "Locating frp partition @ 0x{HEX} ..." },
    { level: "WARN", text: "Anti-rollback counter: 8 — proceeding read-only" },
    { level: "INFO", text: "Patching factory reset protection flags ..." },
    { level: "SUCCESS", text: "FRP successfully bypassed. Reboot device to apply." },
  ],
  repair_imei: [
    { level: "INFO", text: "Reading current IMEI from NV partition ..." },
    { level: "INFO", text: "Backing up md1img → /backup/md1img_{TS}.bin" },
    { level: "INFO", text: "Calculating Luhn checksum ..." },
    { level: "INFO", text: "Writing IMEI1: {IMEI}" },
    { level: "INFO", text: "Writing IMEI2: {IMEI2}" },
    { level: "SUCCESS", text: "IMEI repair complete. Verify with *#06#" },
  ],
  unlock_bootloader: [
    { level: "WARN", text: "WARNING: This will erase all userdata." },
    { level: "INFO", text: "Requesting unlock token from device ..." },
    { level: "INFO", text: "Token: {HEX} — verifying signature ..." },
    { level: "INFO", text: "Sending fastboot oem unlock-go ..." },
    { level: "INFO", text: "Erasing locked partition headers ..." },
    { level: "SUCCESS", text: "Bootloader unlocked. OEM lock = 0" },
  ],
  erase_userdata: [
    { level: "WARN", text: "Beginning destructive operation: format userdata" },
    { level: "INFO", text: "Unmounting /data ..." },
    { level: "INFO", text: "Issuing TRIM on userdata partition ..." },
    { level: "INFO", text: "Wiping metadata + dalvik-cache ..." },
    { level: "SUCCESS", text: "Userdata erased. Device will boot to setup wizard." },
  ],
  read_info: [
    { level: "INFO", text: "Probing chipset over USB ..." },
    { level: "INFO", text: "Detected: {MODEL}" },
    { level: "INFO", text: "CPU ID: {CPUID}" },
    { level: "INFO", text: "Serial: {SERIAL}" },
    { level: "SUCCESS", text: "Device fingerprint captured." },
  ],
  // ──────────── EXPANDED EXPLOIT CATALOG ────────────
  read_codes: [
    { level: "INFO", text: "Mounting /data via DA sideload ..." },
    { level: "INFO", text: "Reading gesture.key + locksettings.db ..." },
    { level: "INFO", text: "Decoding pattern checksum @ 0x{HEX} ..." },
    { level: "INFO", text: "Lockscreen type detected: PIN/Pattern/Password" },
    { level: "SUCCESS", text: "Lockscreen credentials recovered. Hash: {HEX}" },
  ],
  read_frp_token: [
    { level: "INFO", text: "Locating persistent partition ..." },
    { level: "INFO", text: "Extracting Google ID token blob ..." },
    { level: "INFO", text: "Decrypting token with hardware-bound key ..." },
    { level: "SUCCESS", text: "FRP token captured: {HEX}{HEX}" },
  ],
  mi_account_bypass: [
    { level: "INFO", text: "Detecting Xiaomi Mi Cloud lock state ..." },
    { level: "INFO", text: "Mi Account locked: cloud verification required" },
    { level: "INFO", text: "Pushing community auth payload via BROM ..." },
    { level: "INFO", text: "Patching mi_account flag in misc partition ..." },
    { level: "WARN", text: "This may trip Mi Cloud server flags on next sync." },
    { level: "SUCCESS", text: "Mi Account locally cleared. Device fully usable." },
  ],
  knox_suspend: [
    { level: "INFO", text: "Reading Knox status from sec_efs partition ..." },
    { level: "INFO", text: "Current Knox flag: 0x1 (TRIPPED)" },
    { level: "WARN", text: "Knox warranty bit cannot be reset — only suspended." },
    { level: "INFO", text: "Pushing signed suspend token ..." },
    { level: "INFO", text: "Updating Knox enforcement state → 0x0 (SUSPENDED)" },
    { level: "SUCCESS", text: "Knox suspended. Maintenance window opened." },
  ],
  demo_unit_disable: [
    { level: "INFO", text: "Detecting retail demo configuration ..." },
    { level: "INFO", text: "Demo mode active · model: {MODEL}" },
    { level: "INFO", text: "Disabling RetailMode service ..." },
    { level: "INFO", text: "Clearing demo provisioning flag ..." },
    { level: "SUCCESS", text: "Device converted to consumer firmware profile." },
  ],
  carrier_unlock: [
    { level: "INFO", text: "Reading SIM lock status from NV ..." },
    { level: "INFO", text: "Carrier: detected (locked) · SIM-Lock = 1" },
    { level: "INFO", text: "Backing up modem partition → md1img_{TS}.bin" },
    { level: "INFO", text: "Patching NV item 550 (carrier_id) ..." },
    { level: "INFO", text: "Resetting unlock attempt counter ..." },
    { level: "SUCCESS", text: "Network unlock complete. All carriers accepted." },
  ],
  safe_format: [
    { level: "INFO", text: "Beginning non-destructive format ..." },
    { level: "INFO", text: "Preserving /data/app and /data/media partitions ..." },
    { level: "INFO", text: "Wiping cache + dalvik-cache + frp ..." },
    { level: "SUCCESS", text: "Safe format complete. User apps preserved." },
  ],
  boot_repair: [
    { level: "INFO", text: "Reading boot + recovery partition headers ..." },
    { level: "WARN", text: "Boot magic mismatch · partition appears corrupted." },
    { level: "INFO", text: "Pulling matching boot.img from Aether DB ..." },
    { level: "INFO", text: "Flashing boot.img @ 0x{HEX} ..." },
    { level: "INFO", text: "Verifying SHA-256 ..." },
    { level: "SUCCESS", text: "Boot partition repaired. Device will boot normally." },
  ],
  icloud_check: [
    { level: "INFO", text: "Establishing DFU pipeline · checkm8 mode ..." },
    { level: "INFO", text: "Querying Apple Activation Lock service ..." },
    { level: "INFO", text: "ECID: {HEX}{HEX} · SoC: {CPUID}" },
    { level: "INFO", text: "Activation status: CLEAN / LOCKED — see panel" },
    { level: "SUCCESS", text: "iCloud probe complete." },
  ],
  passcode_recover: [
    { level: "WARN", text: "Beginning DFU-mode passcode recovery ..." },
    { level: "INFO", text: "Loading pongoOS payload ..." },
    { level: "INFO", text: "Dumping locked SEP keybag ..." },
    { level: "INFO", text: "Bruteforce-tolerant attempt sequence engaged ..." },
    { level: "INFO", text: "Iteration 1 of 10000 ..." },
    { level: "SUCCESS", text: "Passcode recovered: ●●●●●●  (shown on device)" },
  ],
  trust_audit: [
    { level: "INFO", text: "Loading Apple ground-truth trust cache (rev 2.4.1) ..." },
    { level: "INFO", text: "Hashing on-device SecureROM ..." },
    { level: "INFO", text: "Comparing 1284 binary signatures ..." },
    { level: "WARN", text: "3 mismatched hashes detected — likely jailbreak artefacts." },
    { level: "SUCCESS", text: "Trust cache audit complete. Report saved." },
  ],
};

export const fillTemplate = (text, device) =>
  text
    .replace("{HEX}", "0x" + randomHex(8))
    .replace("{IMEI}", device?.imei || randomIMEI())
    .replace("{IMEI2}", device?.imei2 || randomIMEI())
    .replace("{TS}", Date.now())
    .replace("{MODEL}", device?.model || "Unknown")
    .replace("{CPUID}", device?.cpuId || randomHex(16))
    .replace("{SERIAL}", device?.serial || randomSerial())
    .replace("$PLATFORM", device?.platform === "MediaTek" ? "mtk" : "qcom");
