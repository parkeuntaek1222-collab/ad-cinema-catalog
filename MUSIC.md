# ELSEWHERE music discovery

Every six hours, GitHub Actions reads regional `videos.list(chart=mostPopular, videoCategoryId=10)` lists with the YouTube Data API. Thirty configured markets are checked against `i18nRegions.list`; unsupported markets are reported and skipped. This is YouTube's regional popular-video selection, not a claim to reproduce YouTube Music's official song chart or measure local underground popularity.

The API key is provided only through the repository Actions secret `YOUTUBE_API_KEY`. Never put its value in code, JSON, logs or the website. The collector makes at most 61 API requests per run (one region request and two pages of 50 videos per market). Scheduled runs are four times daily, with no paid API, AI, download, or quota purchase. Other uses of the same Google project share quota. Failures and exhausted quota stop publishing rather than retrying without bounds.

Candidates must be public, embeddable music-category videos, published within 90 days with at least 10,000 observed views, 90–900 seconds long, without live/age restrictions, and pass conservative music-video title filtering. Titles alone do not prove that an uploader is an official rights holder; titles in unsupported languages and videos with no MV markers may be missed. Embedding may still fail at play time because of viewer-region restrictions or rights changes, so the player skips playback errors.

Existing 53 curated artist/label feeds supplement charts. They do not limit the artists eligible through regional discovery. Feed-only entries retain their original title-based checks and previously reviewed duration where available.

`countryBasis: youtube-regional-chart` means `countries` and `chartCountries` are the regions whose popular lists included the video. `curated-channel-market` identifies the reviewed home market of a supplemental channel. Neither field establishes an artist's nationality or exact viewer location. Same video IDs from several charts are merged and all matching regions are retained. Videos no longer present in charts lose stale chart-region labels at the next successful refresh.

If the API key is absent/invalid, quota fails, fewer than 75% of supported requested markets respond, or zero chart candidates qualify, catalog files are not overwritten. `music-status.json` records requests, successful/unsupported markets, and candidate counts after a successful update. Existing published data remains available subject to the player's 72-hour freshness limit.

Run tests with `node --test music-core.test.mjs music-charts.test.mjs`. Run collection with `YOUTUBE_API_KEY` already supplied by the execution environment and `node collect-music.mjs`. The live site fetches the public JSON at load and hourly while visible, applying changes at track boundaries.
