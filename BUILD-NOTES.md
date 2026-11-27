# Build notes — news-image-20261126

## Verified stories (all happened or first reported on 26 Nov 2026)

Main panels:

1. **Iranian drone kills 2 Italians in Kuwait** — two Rheinmetall Italia technicians dead at an air-defence site; Rome blames an Iranian drone. Source: Reuters, 26 Nov 2026.
2. **Missiles hit Kyiv mall; 7 wounded** — Russia fired ballistic missiles + 113 drones overnight; shopping centre and two buildings hit. Source: NY Post, 26 Nov 2026.
3. **Ebola in Congo passes 12,000 cases** — 12,021 confirmed, 5,904 dead; second-largest outbreak ever. Source: Reuters / UN News, 26 Nov 2026.
4. **Blast at Bangkok refinery hurts 9** — Bangchak Phra Khanong explosion/fire, 3 critically hurt, all production shut. Source: CNN, 26 Nov 2026.
5. **Storm blacks out 900,000 on Thanksgiving** — nor'easter, ~900k+ without power, 2,200+ flights delayed; Macy's 100th parade moved to Saturday, a first. Source: Reuters / AP, 26 Nov 2026.

Ticker (all 26 Nov): 13 dead in Indonesia gold-mine flood (Al Jazeera) · Guinea-Bissau junta delays elections to 2028 (Reuters/AP) · Houthis strike Jizan port · EU opens budget summit · Bank of Korea hikes rates to 3.25% · Nvidia halts server shipments to SE Asia (FT via Reuters) · Gaza strike kills Hamas deputy minister (BBC) · FCC clears SpaceX plan for 1M satellites (BBC) · Andy Taylor of Duran Duran dies at 65 (BBC).

## Checked and excluded (25 Nov stories)

- Shenzhou-24 launch, Houthi Ras Tanura refinery strike, Cairo tanker fire (31 dead), Trump tariffs on 14 partners, AI stock selloff — all 25 Nov.
- Canary Islands record arrivals happened Tue 24 Nov (reported 25–26 Nov) — not used as a main story.

## Approach

main.ts (Node 22, stdlib only) draws a 1024×1024 newspaper front page from scratch: hand-written CRC32 + zlib PNG encoder, an authored 5×7 bitmap font, canvas shape/text helpers, flat pictograms (drone, Kyiv skyline + missile, Ebola virus, refinery fire, storm cloud + lightning). Layout: masthead + 5 story panels + ticker strip. No network, no time/randomness. main.ts draws the image itself and does not read entry.png.

## Determinism (builder-verified, before the safety stop)

Two runs byte-identical. sha256 (both runs):
`7dabd432733f1e91b8089a3e2b84ff96637e41186a13b82ecaa71aee86b9fbc5`
Output: entry.png, 1024×1024, RGB 8-bit, 23,254 bytes (limit 1,048,576). PNG verified: signature OK, all chunk CRCs valid, IDAT decompresses to exactly 1024×(1+1024×3) bytes, filter byte 0 on every scanline. Visually inspected: date "THURSDAY 26 NOVEMBER 2026" prominent, all 5 headlines + bodies legible, ticker readable.

## Safety stop (27 Nov ~12:51 WIB)

The builder's final validation exec was flagged by a system execution-risk check, so it stopped before writing LICENSE/BUILD-NOTES.md (completed here by the coordinator from the builder's report) and before any repo/push/submit. Per the proven safety rule this entry is STOPPED pending the user's explicit go-ahead — do not push or submit past the flag without it. Blind cutoff is TODAY 19:00 WIB; deadline 28 Nov 07:00 WIB.
