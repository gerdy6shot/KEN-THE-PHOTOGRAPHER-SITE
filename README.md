# Kenneth Harris Archive

A responsive, inquiry-led archive with React islands, Tailwind CSS utilities, Framer Motion, and GSAP ScrollTrigger. The existing editorial page and inquiry flows remain intact. React + Vite keeps the site compatible with static Cloudflare Pages hosting; no Next.js server is required.

## Preview

Use Node.js 22.12+ (or a supported newer release). Run `npm ci`, then `npm run dev`. For a production preview run `npm run build` and `npm run preview`. Run `npm test` for motion policy and smoothing checks.

The production host is the existing Cloudflare Pages project `ken-the-photographer`.

Build with `node scripts/build.mjs`, then deploy with `wrangler pages deploy dist --project-name ken-the-photographer --branch main`. The build includes only public website assets, excluding repository metadata and local configuration. Cloudflare response headers are configured in `_headers`.

The original source referenced a Supabase project that is not accessible to the currently connected accounts. No replacement project is selected automatically; inquiry email drafts remain available until the correct backend is confirmed.

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

## Parallax components and tuning

- `src/components/ParallaxScene.jsx`: live reduced-motion and pointer/viewport policy, plus pause/resume control.
- `FloatingCamera.jsx`: keyboard/touch accessible anchor, mouse parallax with elapsed-time lerp, levitation, and scroll pitch. Stops its animation loop when offscreen or the tab is hidden.
- `FloatingFrame.jsx`: GSAP scroll settling on an outer wrapper and Framer Motion hover/focus lift on the inner figure. Separate wrappers prevent transform conflicts.
- `GalleryGrid.jsx`: existing lazy-loaded archive images, captions, image IDs, and inquiry actions.
- `src/main.jsx`: React portals bridge the existing gallery filtering and load-more focus behavior.

Change `src/motion-config.js` to tune the motion:

| Setting | Default | Effect |
| --- | --- | --- |
| perspective | 1100 px | Lower values exaggerate perspective. Match `.photo-grid` perspective in `src/motion.css`. |
| depth | 35 px | Camera distance toward the viewer. |
| pointerTravel | 16 px | Maximum cursor-follow travel on each axis. |
| pitch / yaw | 7° / 12° | Maximum mouse-driven camera rotations. |
| levitation / period | 7 px / 5.5 sec | Bob amplitude and cycle time; larger period is slower. |
| response | 0.12 sec | Lerp time constant; higher values follow more slowly. |
| scrollTravel / scrollPitch | 58 px / 22° | Total downward travel and forward rotation over the hero scroll range. |
| frameDrift / frameTilt / frameLift | 28 px / 3° / 22 px | Gallery entry travel, tilt, and hover/focus depth. |

At 800px and below, or with coarse/no-hover pointers, decorative transforms are disabled. OS reduced motion is observed dynamically; it disables all new decorative transforms and the existing CSS disables smooth scrolling. The manual pause control also resets transforms. Only transforms animate; shadows remain static. The native cursor and page scrolling remain available.

Tailwind Preflight is intentionally omitted to preserve the existing typography and spacing. `_headers` permits inline style attributes required by animation libraries while keeping scripts restricted to self.

### Camera asset provenance

`assets/images/nikon-camera.png` is a transparent RGBA asset prepared from the user-supplied Nikon photograph using the built-in image generation/editing tool (not a CLI). The original upload remains untouched.

Prompt: “Background extraction for a website asset. Remove the white and light gray background from this supplied vintage Nikon camera photograph. Preserve the exact original camera, its shape, silver and black materials, lens, Nikon logo and all lettering. No redesign, no added scene. Produce an isolated camera on a genuinely transparent RGBA background, closely cropped with a small transparent margin on every side, front view as supplied. No baked-in shadow.”
