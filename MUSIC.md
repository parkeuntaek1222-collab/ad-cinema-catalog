# ELSEWHERE music collection

Run `node collect-music.mjs`. Reads public YouTube channel RSS, then checks oEmbed availability and public video metadata for 90–900 second length and live-video exclusion. No API key, paid API, audio extraction, or video downloading. Public data only. Scheduled every six hours by refresh-music.yml using standard GitHub-hosted runners.

Selection: music-video titles from reviewed artist/label channels, published within 90 days, at least 10,000 observed views. Teasers, lyric/audio-only videos, live performances, interviews and Shorts identified in titles are excluded. Conservative title matching can miss valid videos or occasionally misclassify an upload. YouTube RSS exposes only recent channel entries, so this is not exhaustive discovery. It is not an official trending chart, and views do not prove organic popularity. The channel list needs editorial expansion; existing channels' new uploads are automatic.

Country is the channel's curated home market, not a claim about the artist's nationality, collaboration partners, or audience popularity by country. The frontend rotates markets and weights by recency and observed views. Video publication dates are not song release dates.

View observations and successful embed checks expire after 72 hours; videos also age out after 90 days. Failed sources retain eligible previous items. If fewer than half the feeds respond or no playable item survives, collection fails without overwriting the last catalog. Region/age restrictions may still prevent playback for a visitor; the player skips failed items. Site catalog checks run hourly while open and do not interrupt the current track. GitHub schedules can be delayed or disabled after inactivity. Inspect music-status.json and Actions for health.
