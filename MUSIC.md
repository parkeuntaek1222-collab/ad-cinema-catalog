# ELSEWHERE music discovery

Every six hours, GitHub Actions reads regional `videos.list(chart=mostPopular, videoCategoryId=10)` lists with the YouTube Data API. 110 configured markets are checked against `i18nRegions.list`; unsupported markets are reported and skipped. This is YouTube's regional popular-video selection, not a claim to reproduce YouTube Music's official song chart or measure local underground popularity.

The API key is provided only through the repository Actions secret `YOUTUBE_API_KEY`. Never put its value in code, JSON, logs or the website. The collector makes at most 221 API requests per run (one region request and two pages of 50 videos per market). Scheduled runs are four times daily, with no paid API, AI, download, or quota purchase. Other uses of the same Google project share quota. Failures and exhausted quota stop publishing rather than retrying without bounds.

The coverage includes 110 YouTube regions with a music-chart response verified on 2026-10-01, plus mainland China through the separate supplement below. The 41 newly included regions are AM AZ GE KH LA BA BG BY CY EE HR LI LT LU LV MD ME MK MT SI SK BO CR GT HN NI PY SV VE BH IQ JO KW LB OM QA YE LY TN ZW PG. Iceland (IS) returned HTTP 404 during the audit and is not included yet; this is not a permanent claim of unavailability. Estonia (EE) responded but had no qualifying music videos in the audited first page. Chart response does not guarantee eligible or classified videos. The exact list lives in `CHART_REGIONS`; support and chart health are checked every run. Hong Kong and Taiwan are separate chart regions, not proxies for mainland China.

Candidates must be public, embeddable music-category videos, published within 90 days with at least 10,000 observed views, 90–900 seconds long, without live/age restrictions, and pass conservative music-video title filtering. Titles alone do not prove that an uploader is an official rights holder; titles in unsupported languages and videos with no MV markers may be missed. Embedding may still fail at play time because of viewer-region restrictions or rights changes, so the player skips playback errors.

Existing 54 curated artist/label feeds supplement charts. They do not limit the artists eligible through regional discovery. Feed-only entries retain their original title-based checks and previously reviewed duration where available.

`countryBasis: youtube-regional-chart` means `countries` and `chartCountries` are the regions whose popular lists included the video. `curated-channel-market` identifies the reviewed home market of a supplemental channel. Neither field establishes an artist's nationality or exact viewer location. Same video IDs from several charts are merged and all matching regions are retained. Videos no longer present in charts lose stale chart-region labels at the next successful refresh.

If the API key is absent/invalid, quota fails, fewer than 75% of supported requested markets respond, or zero chart candidates qualify, catalog files are not overwritten. `music-status.json` records requests, successful/unsupported markets, and candidate counts after a successful update. Existing published data remains available subject to the player's 72-hour freshness limit.

Run tests with `node --test music-core.test.mjs music-charts.test.mjs`. Run collection with `YOUTUBE_API_KEY` already supplied by the execution environment and `node collect-music.mjs`. The live site fetches the public JSON at load and hourly while visible, applying changes at track boundaries.

## Mainland China supplement

China is collected separately from the regional YouTube charts. Each run reads the top 100 rows of Tencent Music's public UNI Chart at https://chart.tencentmusic.com/uni-chart and checks the latest 50 uploads on each of four reviewed label/studio channels (HeXiMusic, Tencent Music Distribution, ZhouShen Official, XiaoZhan Studio). At most nine additional YouTube API requests and one public Tencent request are made per run; no search calls, paid API, media downloads or new credentials are needed. The regional and China collectors together are capped at 230 YouTube units per run (920 per four scheduled runs).

Exact normalized song-title and singer matches are required, along with the same publication age, view, duration, public/music/embeddable checks. Ambiguous matches, live clips, lyrics, teasers, vlogs and dance practices are excluded. This is a partial selection of chart songs with suitable official MVs, not a full Chinese catalog. Simplified/traditional spelling differences or uploads beyond the latest 50 can prevent a match. ZhouShen's recent official feed also supplements the selection; those entries are channel discoveries, not a claim of chart membership.

`countryBasis: external-music-chart` and `externalCharts` record the Tencent source, issue, observed rank and check date separately from YouTube regional appearances. China denotes the chart market, not artist nationality or YouTube viewer geography. For matched videos on reviewed channels, hashtag labels are removed from `originalTitle` for compatibility with the existing player filter; the full unmodified source title is retained in `youtubeTitle`. Video IDs, dates, counts and restriction data are obtained from YouTube's API. Viewer restrictions can still prevent playback and are handled by the existing player.

If Tencent's public endpoint changes or fails, its status is reported and the other 110 regional collectors continue. Stale Tencent chart entries are not carried forward; quota/auth failures stop publication. Public endpoints are not a guaranteed long-term API. Update this supplement if Tencent changes its published interface.


## Genre selection

Genres are estimated per video from public YouTube `topicDetails.topicCategories`, exact genre tags, hashtags, and explicit `Genre:` description lines. Generic lyrics, country tags, artist names, and the Music category alone are not genre evidence. No artist-wide assumptions, audio/video download, paid API, or AI service is used. Music topics of Asia/Latin America and independent music are not treated as musical genres. The 14 broad selectable genres plus Unclassified allow multiple labels per video. Each label keeps source evidence and the observation time; no match remains Unclassified.

Every refresh enriches at most 2,000 tracks in batches of 50 IDs, adding at most 40 YouTube requests. Together with 110 region charts and China, the total ceiling is 270 units per run (1,080 for four scheduled runs). Missing metadata or connection errors leave the affected tracks Unclassified; auth/quota errors abort publication without exposing the key. The public catalog carries labels, not whole descriptions or unneeded video tags. The site defaults to All genres, keeps current-song metadata unchanged, and only filters the playback pool when a visitor selects a genre. Empty genres are disabled; failed videos remain skipped.

### Fine styles and mixed selection

The catalogue retains the 14 broad genres and now also records 29 narrower styles in `subgenres`, with parent relationships in `genreDefinitions`. A broad YouTube topic alone never implies a narrow style. Fine styles require their own explicit uploader tag/hashtag/labelled genre line or a recognised YouTube topic. Narrow evidence also adds the corresponding broad parent, so selecting Electronic includes House and Techno while selecting House alone excludes generic Electronic tracks. Classification is still a metadata estimate; no audio analysis, paid provider, or extra API call is added.

The Site supports multiple broad genres and/or styles at once. Playback uses OR matching and deduplicates videos. Unclassified videos remain excluded. Styles without matching eligible videos are disabled; automatic refresh can enable them. The current-song metadata does not display genres.

### Broad selector and Latin / Funk coverage

The Site shows only the 14 broad categories, supports multiple selections with OR matching, and retains narrower metadata internally. Latin recognises explicit Latin, reggaeton, bachata, salsa, cumbia, merengue, regional Mexican and Brazilian music style tags/topics. Funk / Disco recognises explicit funk, disco and nu-disco markers. Funk carioca / baile funk is grouped under Latin, not assumed to be US-style funk. Regional chart membership, language and the generic Music of Latin America topic do not establish either genre. No additional API calls are needed.
