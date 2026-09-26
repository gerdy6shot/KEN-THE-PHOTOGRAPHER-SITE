# Kenneth Harris Archive

A responsive, inquiry-led photographic portfolio built with HTML, CSS, and vanilla JavaScript. All imagery comes from the existing repository. No build step, checkout, public prices, or third-party database is required.

## Preview

From this directory run `python3 -m http.server 8080`, then open http://localhost:8080.

The root can be served by an existing static host or GitHub Pages. This change does not alter hosting settings or publish automatically.

## Configure inquiries and Kenny's presentation

Edit `site-config.js`:

- `inquiryEmail`: currently retains the existing website address, `licensing@kenthephotographer.com`. Confirm that the mailbox is monitored before publishing.
- `presentationUrl`: a relative MP4/WebM file path, an HTTPS direct video URL, or a YouTube/Vimeo link. Leave empty until Kenny's actual presentation is available; the page then explicitly says “Video presentation coming soon.”
- `presentationCaptions`: optional path/URL to English WebVTT captions for directly hosted video. For YouTube/Vimeo, manage captions on the video platform.

The video supports native playback controls, full screen, and mobile inline playback. It never autoplays. No video was present in the supplied repository.

## Inquiry behavior

All acquisition, licensing, publication, merchandise, exhibition, press, documentary, preservation, and patron buttons open a contextual form. Photograph inquiries include a stable archive reference. Licensing requests capture intended use, territory, and duration.

Submitting prepares a `mailto:` draft in the visitor's email application. The visitor must send it. The page does not claim the inquiry was delivered; it also provides the full draft for copying, a direct address, and an edit option. There is no server-side lead storage or automatic email delivery.

## Archive and media

`archive-data.js` preserves all 57 records, titles, and collection assignments from the original curated arrays. Optimized WebP copies are in `assets/images`; originals remain untouched. Similar photographs across collections retain their original separate records. The six opening selections can be changed in `app.js`.

Captions and collection assignments are inherited from the original archive, and should be reviewed by the archive director before publication. Image rights, editions, framing, certificates, merchandise availability, and patron benefits are confirmed through an inquiry. The page does not present donation tax treatment, invented funding totals, partner logos, or a live pledge counter without verified information.

## Verification

The upgrade has been checked at desktop and phone widths. Verify search, filters, load more, photograph navigation, Escape/close behavior, contextual forms, prepared email drafts, navigation, and all image URLs when changing content. Once a real video is configured, verify playback and captions with that source.
