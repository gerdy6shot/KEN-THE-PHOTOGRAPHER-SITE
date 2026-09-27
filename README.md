# Kenneth Harris Archive

A responsive, inquiry-led archive with React islands, Tailwind CSS utilities, Framer Motion, and GSAP ScrollTrigger. The existing editorial page and inquiry flows remain intact. React + Vite keeps the site compatible with static Cloudflare Pages hosting; no Next.js server is required.

## Preview

Use Node.js 22.12+ (or a supported newer release). Run `npm ci`, then `npm run dev`. For a production preview run `npm run build` and `npm run preview`. Run `npm test` for motion policy and smoothing checks.

The production host is the existing Cloudflare Pages project `ken-the-photographer`.

Build with `node scripts/build.mjs`, then deploy with `wrangler pages deploy dist --project-name ken-the-photographer --branch main`. The build includes only public website assets, excluding repository metadata and local configuration. Cloudflare response headers are configured in `_headers`.

The backend uses the dedicated Supabase project `koyankycsshjsezaqdbm`. See [backend operations](docs/backend-setup.md), [Google Workspace setup](docs/google-workspace-setup.md), and [Gemini setup](docs/gemini-setup.md). Google authorization and Gemini credentials are configured separately; stored requests do not depend on either integration.

## Configure inquiries and Kenny's presentation

Edit `site-config.js`:

- `inquiryEmail`: currently retains the existing website address, `info@kenthephotographer.com`. Confirm that the mailbox is monitored before publishing.
- `presentationUrl`: a relative MP4/WebM file path, an HTTPS direct video URL, or a YouTube/Vimeo link. Leave empty until Kenny's actual presentation is available; the page then explicitly says “Video presentation coming soon.”
- `presentationCaptions`: optional path/URL to English WebVTT captions for directly hosted video. For YouTube/Vimeo, manage captions on the video platform.

The video supports native playback controls, full screen, and mobile inline playback. It never autoplays. No video was present in the supplied repository.

## Inquiry behavior

All acquisition, licensing, publication, merchandise, exhibition, press, documentary, preservation, and patron buttons open a contextual form. Photograph inquiries include a stable archive reference. Licensing requests capture intended use, territory, and duration.

Submitting stores the inquiry through the Supabase `submit-inquiry` Edge Function and confirms receipt. Photograph IDs and licensing details are preserved. Loading, retry and error states do not discard the visitor’s text. The small email fallback remains `info@kenthephotographer.com`. No local email application is launched by primary submission.

## Archive and media

`archive-data.js` preserves all 57 records, titles, and collection assignments from the original curated arrays. Optimized WebP copies are in `assets/images`; originals remain untouched. Similar photographs across collections retain their original separate records. The six opening selections can be changed in `app.js`.

Captions and collection assignments are inherited from the original archive, and should be reviewed by the archive director before publication. Image rights, editions, framing, certificates, merchandise availability, and patron benefits are confirmed through an inquiry. The page does not present donation tax treatment, invented funding totals, partner logos, or a live pledge counter without verified information.

## Verification

The upgrade has been checked at desktop and phone widths. Verify search, filters, load more, photograph navigation, Escape/close behavior, contextual forms, server submission and email fallback, navigation, and all image URLs when changing content. Once a real video is configured, verify playback and captions with that source.

## Parallax components and tuning

- `src/components/ParallaxScene.jsx`: live reduced-motion and pointer/viewport policy, plus pause/resume control.
- `CustomCameraCursor.jsx`: desktop-only weighted mouse tracking, velocity-sensitive tilt, hover and shutter press states. A noninteractive manual popover keeps it above modal dialogs. Native cursor remains until the image is loaded and the mouse moves; keyboard navigation, pause, touch and reduced motion restore it.
- `HeroDepth.jsx`: layered background, title, texture and foreground parallax.
- `AudioToggle.jsx` / `shutter-audio.js`: enabled-by-default, keyboard-accessible sound toggle. A synthesized mechanical shutter buffer is precomputed locally; every press uses its own Web Audio source. No external sound recording is used.
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

At 800px and below, or with coarse/no-hover pointers, decorative transforms are disabled. OS reduced motion is observed dynamically; it disables all new decorative transforms and the existing CSS disables smooth scrolling. The manual pause control also resets transforms. Only transforms animate; shadows remain static. Native scrolling remains available. The native cursor is replaced only during active desktop mouse input.

Tailwind Preflight is intentionally omitted to preserve the existing typography and spacing. `_headers` permits inline style attributes required by animation libraries while keeping scripts restricted to self.

### Camera asset provenance

`assets/images/nikon-camera.png` is a transparent RGBA asset prepared from the user-supplied Nikon photograph using the built-in image generation/editing tool (not a CLI). The original upload remains untouched.

Prompt: “Background extraction for a website asset. Remove the white and light gray background from this supplied vintage Nikon camera photograph. Preserve the exact original camera, its shape, silver and black materials, lens, Nikon logo and all lettering. No redesign, no added scene. Produce an isolated camera on a genuinely transparent RGBA background, closely cropped with a small transparent margin on every side, front view as supplied. No baked-in shadow.”

## Camera cursor and sound tuning

The cursor replaces the former hero camera. The hero retains its scroll-to-discover link. Edit `src/cursor-config.js`:

| Setting | Default | Tune |
| --- | --- | --- |
| lag | 0.085 seconds | Higher = heavier/slower following; lower = tighter tracking. |
| rotationSensitivity | 0.16 | Higher = stronger directional tilt. |
| maxRotation | 14 degrees | Safety clamp for fast mouse movements. |
| size | 56 pixels | Resting camera width. |
| hoverScale | 1.16 | Enlargement over interactive elements. |
| pressedScale | 0.88 | Shutter-press scale. |
| volume | 0.18 | Web Audio gain; use 0–1, with low levels recommended. |

Sound starts enabled on every page load. The first mouse press creates/resumes AudioContext during that user gesture and plays the shutter; subsequent presses play overlapping 160ms shutter sounds. The SOUND ON button lets visitors mute it. Re-enabling sound plays a preview. The mute button stops all active sources and remains reachable inside modal dialogs. Touch interactions do not trigger shutter sounds; the user can still enable and preview audio using the toggle.

Audio implementation references: [AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume) and [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).

Validation: five automated tests cover motion eligibility, frame-rate-independent smoothing, bounded cursor tilt, deterministic bounded audio samples, and opt-in/overlap/mute behavior. Browser checks cover modal stacking, keyboard audio toggling, native cursor recovery, pause, and phone overflow. No browser console errors were observed. Audio output is synthesized; browser playback was exercised but not acoustically reviewed.
