[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/NftArt7/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/NftArt7/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

# news-image-20261126

A newspaper front page summing up the world's news of Thursday 26 November 2026 in one image: an Iranian drone killing 2 Italian technicians in Kuwait, Russian missiles hitting a Kyiv shopping mall and wounding 7, the Ebola outbreak in Congo passing 12,000 cases, a blast at a Bangkok refinery injuring 9, and a Thanksgiving nor'easter blacking out 900,000 people — plus a ticker with 13 dead in an Indonesia gold-mine flood, Guinea-Bissau's junta delaying elections to 2028, Houthi strikes on Jizan port, the EU budget summit, the Bank of Korea hiking rates to 3.25%, Nvidia halting server shipments to South-East Asia, a Gaza strike killing a Hamas deputy minister, the FCC clearing SpaceX's plan for 1 million satellites, and Duran Duran's Andy Taylor dying at 65.

Every story was verified against live reporting dated 26 November 2026 (Reuters, NY Post, CNN, AP, Al Jazeera, BBC, FT via Reuters, UN News) before it was drawn — see BUILD-NOTES.md. Stories that looked like leads were checked and left out: the Shenzhou-24 launch, the Houthi strike on the Ras Tanura refinery, the Cairo tanker fire killing 31, Trump's tariffs on 14 partners and the AI stock selloff were all 25 November; the Canary Islands record arrivals happened on 24 November.

`main.ts` (Node 22, standard library only) draws the whole page itself — a hand-rolled rasteriser with a 5×7 bitmap font and a from-scratch PNG encoder — and writes `/output/entry.png`. No network, no randomness: two runs produce byte-identical output (sha256 `7dabd432733f1e91b8089a3e2b84ff96637e41186a13b82ecaa71aee86b9fbc5`).

Built for the [news-image-20261126 bounty on make.fun](https://make.fun/bounty/news-image-20261126).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Referral

Try make.fun yourself: https://make.fun/r/7q6eysa2
