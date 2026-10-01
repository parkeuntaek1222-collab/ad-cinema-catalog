# ELSEWHERE — YouTube Trending only

The scheduled collector runs every six hours and uses only YouTube Data API `videos.list` with `chart=mostPopular`, music category 10 and each of the 110 configured supported regions. It reads up to two pages of 50 per region. Actual returned lists may be shorter and are not an exhaustive catalog of all popular songs.

No upload-age limit or minimum-view threshold is applied. An older or low-view video can qualify if it is returned by the current regional Trending list. Views and publication dates remain metadata; playback does not weight them.

Candidates must be public, embeddable, music-category, non-age-restricted music outside ongoing livestreams, 90–900 seconds long, and permitted in the collecting region. No title-based MV/exclusion checks apply; regional list inclusion does not certify uploader identity or guarantee playback in every visitor country. Genre labels come from video music topics and explicit uploader genre tags. Unclassified candidates play in All genres; selected genre filters include only matching classified tracks.

Video IDs deduplicate entries across regions while preserving each appearance. RSS, Tencent UNI Chart, Spotify, Billboard and Apple Music are not used or merged into the catalog. Legacy source files remain for reference only.

The GitHub Actions workflow remains on its existing six-hour schedule. It uses the existing `YOUTUBE_API_KEY` secret and standard Ubuntu runner. At most 221 regional requests plus 220 genre batches are budgeted per run (up to 11,000 candidates). No GPT API or new paid service is added.

API/quota failures or insufficient regional responses fail the job before writing a new catalog, preserving the previous file. The player rejects off-list sources and metadata older than 72 hours as a failure fallback limit; this is distinct from video upload age. Successful runs replace the pool with fresh results rather than accumulating previous off-list videos.

Checks: `node --test music-core.test.mjs music-charts.test.mjs music-genres.test.mjs`.

All music formats in the regional API results are admitted: unmarked titles, audio, lyric videos and recorded live performances. The former music-video title filter is disabled. Ongoing live streams, non-music categories, unavailable embedding, age restrictions, region restrictions and durations outside 90–900 seconds remain excluded. Unclassified tracks remain included when no genre filter is selected.
