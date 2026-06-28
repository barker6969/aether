# NOTICE — Third-party software

Aether CLI shells out to the following open-source tools as **separate processes**
(no source or binary linkage). They remain under their original licenses.

## mtkclient

- **Source:** https://github.com/bkerler/mtkclient
- **License:** GPL-3.0
- **How Aether uses it:** Aether CLI invokes `python -m mtkclient` as a
  subprocess and streams its stdout/stderr to the user. No mtkclient code is
  embedded, linked, or modified by Aether.
- **GPL-3.0 § 0 (definitions)** — "modify" includes copying and adapting code.
  Calling a program via subprocess (`exec`/`fork`) is **mere aggregation** and
  does NOT create a combined work under the GPL. See the FSF's guidance:
  https://www.gnu.org/licenses/gpl-faq.html#MereAggregation
- Users must install mtkclient themselves on first launch via
  `aether-cli setup` (runs `pip install --user mtkclient`).
- Full license text: https://www.gnu.org/licenses/gpl-3.0.txt

---

## Legal — IMEI changes

Modifying a device's IMEI is **illegal** in many jurisdictions (United States,
United Kingdom, European Union, India, Australia, and others). Aether's
`repair-imei` subcommand is intended only for legitimate device-repair
scenarios — **restoring the OEM-printed IMEI back to a device that lost it
after a firmware flash, motherboard swap, or partition wipe.**

By using this feature you confirm:
1. You are a licensed mobile repair technician.
2. The IMEI you are writing matches the OEM-printed IMEI on the device's
   physical sticker (under the battery, on the SIM tray, or on the back
   panel).
3. You are not changing the IMEI to evade theft tracking, blacklist
   enforcement, or carrier locks.

Aether logs every IMEI-write operation with timestamp + device serial +
user account for audit purposes.

---

## Legal — Bootloader unlock & FRP bypass

These operations void manufacturer warranty and may violate carrier contracts.
The "bypass FRP" operation specifically should only be used by licensed
repair technicians servicing devices for verified owners (proof of purchase,
device serial matches purchase record, etc.). Aether does not provide tools
for bypassing locks on stolen devices.

---

## Trademarks

- "MediaTek" and "MTK" are trademarks of MediaTek Inc. Aether is not affiliated.
- "Qualcomm" and "Snapdragon" are trademarks of Qualcomm Incorporated. Aether is not affiliated.
- "Apple", "iPhone", and "DFU" are trademarks of Apple Inc. Aether is not affiliated.
- "Samsung" and "Knox Guard" are trademarks of Samsung Electronics. Aether is not affiliated.
