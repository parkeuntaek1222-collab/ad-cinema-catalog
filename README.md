# AD CINEMA Catalog


Public ad collection for AD CINEMA. No visitor statistics, administrator information or secrets are stored in this repository.


Every six hours, the collector reads public YouTube feeds and selects official-channel videos published within 30 days with at least 1,000 observed views. View observations expire after 72 hours. A second observation 3–48 hours later enables a view-growth estimate; this is not proof of organic popularity. Videos are not downloaded.


Countries describe official-channel markets, not viewer location or brand headquarters. The site mixes countries and favors recent videos with measured engagement.


Daily discovery checks the registered official websites in discovery-seeds.json. Only official links with matching country evidence and qualifying ads are added automatically, up to 10 per run and 250 total channels. Uncertain candidates stay in discovery-candidates.json. The seed website list itself still needs periodic editorial expansion.


Run `node discover.mjs` then `node collect.mjs`. Health is recorded in collection-status.json. Generated output is catalog.json. GitHub scheduled workflows can be delayed or disabled after inactivity; inspect Actions when updates stop.


Standard public GitHub-hosted runners are used, with an eight-minute job timeout. No paid API or credential is required.

