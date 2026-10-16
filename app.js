import { submitInquiry } from './src/inquiry-client.js';
import { submitBooking } from './src/booking-client.js';
(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const items = window.ARCHIVE_ITEMS || [];
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.inquiryEmail || '') ? config.inquiryEmail : 'info@kenthephotographer.com';
  const labels = { early: 'THE EARLY YEARS', prodigy: 'THE UNDERCOVER TEENAGE PRODIGY', culture: 'MUSIC & CULTURE', march: 'MILLION MAN MARCH', movements: 'THE MOVEMENT' };
  const teenageIds = new Set([
    'KTP-EARLY-001', 'KTP-EARLY-002', 'KTP-EARLY-004', 'KTP-EARLY-005',
    'KTP-EARLY-006', 'KTP-EARLY-009', 'KTP-EARLY-010', 'KTP-EARLY-011',
    'KTP-MOVEMENTS-003', 'KTP-MOVEMENTS-004', 'KTP-MOVEMENTS-005', 'KTP-MOVEMENTS-006',
    'KTP-MOVEMENTS-007', 'KTP-MOVEMENTS-008', 'KTP-MOVEMENTS-009', 'KTP-MOVEMENTS-010', 'KTP-MOVEMENTS-011'
  ]);
  const featured = ['KTP-EARLY-010', 'KTP-EARLY-006', 'KTP-EARLY-004', 'KTP-CULTURE-007', 'KTP-CULTURE-012', 'KTP-EARLY-002'];
  const orderedItems = [...items].sort((a, b) => {
    const rank = item => featured.includes(item.id) ? featured.indexOf(item.id) : featured.length;
    return rank(a) - rank(b);
  });
  let category = 'all';
  let query = '';
  let visibleCount = 6;
  let activePhoto = null;
  let inquiryPhoto = null;
  let inquiryGeneration = 0;
  let lastPayload = null;
  let submissionKey = null;
  const grid = document.querySelector('#photo-grid');
  const photoDialog = document.querySelector('#photo-dialog');
  const inquiryDialog = document.querySelector('#inquiry-dialog');
  const form = document.querySelector('#inquiry-form');
  const interest = document.querySelector('#inquiry-type');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredItems = () => orderedItems.filter(item => (category === 'all' || item.category === category || (category === 'prodigy' && teenageIds.has(item.id))) && normalized(`${item.title} ${labels[item.category]} ${teenageIds.has(item.id) ? labels.prodigy : ''} ${item.id}`).includes(normalized(query)));

  function renderGallery() {
    const filtered = filteredItems();
    window.renderArchiveGallery(filtered.slice(0, visibleCount).map(item => category === 'prodigy' ? { ...item, category: 'prodigy' } : item), labels);
    document.querySelector('#results-count').textContent = `${Math.min(visibleCount, filtered.length)} OF ${filtered.length} PHOTOGRAPHS`;
    document.querySelector('#no-results').hidden = filtered.length > 0;
    document.querySelector('#load-more').hidden = visibleCount >= filtered.length;
  }
  function openDialog(dialog) { dialog.showModal(); document.body.classList.add('modal-open'); }
  function showPhoto(item) {
    if (!item) return;
    activePhoto = item;
    const img = document.querySelector('#lightbox-image');
    img.src = item.image;
    img.alt = item.credit ? `${item.title} — ${item.credit}` : `${item.title} — photograph by Kenneth Harris`;
    document.querySelector('#lightbox-title').textContent = item.title;
    document.querySelector('#lightbox-id').textContent = `${item.id} / ${category === 'prodigy' && teenageIds.has(item.id) ? labels.prodigy : labels[item.category]}`;
    const creditEl = document.querySelector('#lightbox-credit');
    if (creditEl) creditEl.textContent = item.credit || 'Photograph by Kenneth Harris';
    document.querySelector('#previous-photo').hidden = filteredItems().length < 2;
    document.querySelector('#next-photo').hidden = filteredItems().length < 2;
    if (!photoDialog.open) openDialog(photoDialog);
  }
  function stepPhoto(direction) {
    const filtered = filteredItems();
    const index = filtered.findIndex(item => item.id === activePhoto?.id);
    showPhoto(filtered[(index + direction + filtered.length) % filtered.length]);
  }
  function updateInquiryFields() {
    document.querySelector('#licensing-fields').hidden = interest.value !== 'Image licensing';
    const prompts = {
      'Fine art print': 'Tell us which photograph, preferred size, and framing interests you.',
      'Image licensing': 'Describe your project, image selection, distribution, and deadline.',
      'Exhibition or institutional acquisition': 'Tell us about your institution, proposed exhibition, and dates.',
      'Interview or speaking engagement': 'Tell us about your outlet or event, preferred speaker, and dates.',
      'Archival patronage': 'Tell us about your interest in the Darkroom Club or Archive Guardian program.',
    };
    form.elements.message.placeholder = prompts[interest.value] || 'Share the project, photograph, timeline, or opportunity you’d like to discuss.';
  }
  function openInquiry(type, item = null) {
    if (photoDialog.open) photoDialog.close();
    form.reset();
    inquiryPhoto = item;
    inquiryGeneration++;
    lastPayload = null;
    submissionKey = null;
    document.querySelector('#inquiry-error').textContent = '';
    form.querySelector('[type="submit"]').disabled = false;
    form.querySelector('[type="submit"]').textContent = 'Send inquiry ↗';
    interest.value = [...interest.options].some(option => option.value === type) ? type : 'General inquiry';
    document.querySelector('#inquiry-photo').value = item ? `${item.title} (${item.id})` : '';
    document.querySelector('#image-reference-label').hidden = !item;
    form.hidden = false;
    document.querySelector('#inquiry-result').hidden = true;

    updateInquiryFields();
    openDialog(inquiryDialog);
    inquiryDialog.scrollTop = 0;
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    });
  });
  document.addEventListener('click', event => {
    const photoButton = event.target.closest('[data-photo]');
    const acquire = event.target.closest('[data-acquire]');
    const license = event.target.closest('[data-license]');
    const general = event.target.closest('[data-inquire]');
    if (photoButton) showPhoto(items.find(item => item.id === photoButton.dataset.photo));
    if (acquire) openInquiry('Fine art print', items.find(item => item.id === acquire.dataset.acquire));
    if (license) openInquiry('Image licensing', items.find(item => item.id === license.dataset.license));
    if (general) openInquiry(general.dataset.inquire);
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    visibleCount = 6;
    document.querySelectorAll('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    renderGallery();
  }));
  document.querySelectorAll('[data-show-prodigy]').forEach(button => button.addEventListener('click', () => {
    const filter = document.querySelector('[data-filter="prodigy"]');
    filter?.click();
    document.querySelector('#vault').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  document.querySelector('#archive-search').addEventListener('input', event => { query = event.target.value.trim(); visibleCount = 6; renderGallery(); });
  document.querySelector('#load-more').addEventListener('click', () => {
    const oldCount = Math.min(visibleCount, filteredItems().length);
    visibleCount += 6;
    renderGallery();
    grid.querySelectorAll('.photo-open')[oldCount]?.focus({ preventScroll: true });
  });
  document.querySelector('#previous-photo').addEventListener('click', () => stepPhoto(-1));
  document.querySelector('#next-photo').addEventListener('click', () => stepPhoto(1));
  photoDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  document.querySelector('#lightbox-acquire').addEventListener('click', () => openInquiry('Fine art print', activePhoto));
  document.querySelector('#lightbox-license').addEventListener('click', () => openInquiry('Image licensing', activePhoto));
  interest.addEventListener('change', updateInquiryFields);
  const emailHref = `mailto:${email}`;
  document.querySelector('#contact-email').href = emailHref;
  document.querySelector('#contact-email').textContent = email;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    const generation = inquiryGeneration;
    const data = new FormData(form);
    let message = String(data.get('message'));
    if (interest.value === 'Image licensing') {
      message += `\n\nIntended use: ${data.get('usage')}\nTerritory & duration: ${data.get('rights') || 'To discuss'}`;
    }
    const payload = {
      name: data.get('name'), email: data.get('email'), organization: data.get('organization'),
      inquiry_type: data.get('interest'), photograph_id: inquiryPhoto?.id || '',
      photograph_title: inquiryPhoto?.title || '', message, website: data.get('website') || '',
    };
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== lastPayload) { submissionKey = crypto.randomUUID(); lastPayload = fingerprint; }
    button.disabled = true;
    button.textContent = 'Sending…';
    const error = document.querySelector('#inquiry-error');
    error.textContent = '';
    try {
      await submitInquiry({ ...payload, idempotency_key: submissionKey });
      if (generation !== inquiryGeneration) return;
      form.hidden = true;
      document.querySelector('#inquiry-result').hidden = false;
      inquiryDialog.scrollTop = 0;
      document.querySelector('#inquiry-result').focus({ preventScroll: true });
    } catch (failure) {
      if (generation === inquiryGeneration) error.textContent = failure.name === 'TimeoutError'
        ? 'Receipt could not be confirmed yet. Please retry; the same request will not be stored twice.'
        : (failure.message || 'Please try again or email info@kenthephotographer.com.');
    } finally {
      if (generation === inquiryGeneration) { button.disabled = false; button.textContent = 'Send inquiry ↗'; }
    }
  });

  // Appointment requests use the existing server-side Supabase/Google approval workflow.
  const bookingDialog = document.querySelector('#booking-dialog');
  const bookingForm = document.querySelector('#booking-form');
  const bookingError = document.querySelector('#booking-error');
  const bookingTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  document.querySelector('#booking-timezone-label').textContent = 'Time zone: ' + bookingTimezone + ' (your device)';
  let bookingKey = null;
  let bookingFingerprint = null;
  document.querySelectorAll('[data-booking-open]').forEach(button => button.addEventListener('click', () => {
    bookingForm.reset(); bookingKey = null; bookingFingerprint = null; bookingError.textContent = '';
    bookingForm.hidden = false; document.querySelector('#booking-result').hidden = true;
    const dateField = bookingForm.elements.requested_start;
    const now = new Date(Date.now() + 3600000);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    dateField.min = local;
    openDialog(bookingDialog);
  }));
  bookingForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const values = new FormData(bookingForm);
    const localStart = String(values.get('requested_start'));
    const start = new Date(localStart);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) {
      bookingError.textContent = 'Please choose a future date and time.'; return;
    }
    const end = new Date(start.getTime() + Number(values.get('duration')) * 60000);
    const payload = { name: String(values.get('name')), email: String(values.get('email')),
      organization: String(values.get('organization') || ''), phone: String(values.get('phone') || ''),
      booking_type: String(values.get('booking_type')), requested_start: start.toISOString(),
      requested_end: end.toISOString(), timezone: bookingTimezone, notes: String(values.get('notes') || ''),
      website: String(values.get('website') || '') };
    const fingerprint = JSON.stringify(payload);
    if (bookingFingerprint !== fingerprint) { bookingFingerprint = fingerprint; bookingKey = crypto.randomUUID(); }
    const button = bookingForm.querySelector('[type="submit"]');
    button.disabled = true; button.textContent = 'Sending request…'; bookingError.textContent = '';
    try {
      await submitBooking({ ...payload, idempotency_key: bookingKey });
      bookingForm.hidden = true; document.querySelector('#booking-result').hidden = false;
      document.querySelector('#booking-result').focus({ preventScroll: true });
    } catch (e) {
      bookingError.textContent = e.name === 'TimeoutError' ? 'Receipt could not be verified. Retry safely using the same request.' : e.message;
    } finally { button.disabled = false; button.textContent = 'Send booking request ↗'; }
  });
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => { menuToggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
  nav.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); } });

  // No autoplay, simulated footage, or fabricated progress. A real video replaces the poster when configured.
  function configurePresentation() {
    if (!config.presentationUrl) return;
    const video = document.querySelector('#kenny-video');
    const embed = document.querySelector('#kenny-embed');
    try {
      const url = new URL(config.presentationUrl, window.location.href);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported presentation URL');
      let embedUrl = '';
      if (['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(url.hostname)) {
        const videoId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop();
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error('Invalid YouTube video ID');
        embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
      } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)) {
        const parts = url.pathname.split('/').filter(Boolean);
        const videoId = parts.find(part => /^\d+$/.test(part));
        if (!videoId) throw new Error('Invalid Vimeo video ID');
        const privacyHash = url.searchParams.get('h') || parts[parts.indexOf(videoId) + 1];
        embedUrl = `https://player.vimeo.com/video/${videoId}${privacyHash ? `?h=${encodeURIComponent(privacyHash)}` : ''}`;
      } else if (!/\.(mp4|webm|m4v|mov)$/i.test(url.pathname)) throw new Error('Use a direct video file, YouTube, or Vimeo URL');
      if (embedUrl) {
        embed.src = embedUrl;
        embed.hidden = false;
        embed.allowFullscreen = true;
      } else {
        video.src = url.href;
        video.hidden = false;
        if (config.presentationCaptions) {
          const captionsUrl = new URL(config.presentationCaptions, window.location.href);
          if (['http:', 'https:'].includes(captionsUrl.protocol)) {
            const track = document.createElement('track');
            track.kind = 'captions'; track.label = 'English'; track.srclang = 'en'; track.src = captionsUrl.href; track.default = true;
            video.append(track);
          }
        }
        video.addEventListener('error', () => { document.querySelector('#video-error').hidden = false; });
      }
      document.querySelector('#presentation-placeholder').hidden = true;
      document.querySelector('.presentation-poster').hidden = true;
    } catch {
      document.querySelector('#video-error').hidden = false;
    }
  }
  document.querySelector('#copyright-year').textContent = new Date().getFullYear();
  configurePresentation();
  renderGallery();
})();
