const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadArchiveAssets() {
  const galleryGrid = document.getElementById('gallery-grid');
  const loadingText = document.getElementById('loading-text');

  const { data: assets, error } = await supabaseClient
    .from('archive_assets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching assets:', error);
    loadingText.textContent = 'Failed to load archival records.';
    return;
  }

  galleryGrid.innerHTML = '';

  assets.forEach(asset => {
    const card = document.createElement('div');
    card.className = 'bg-obsidian border border-zinc-800 p-4 rounded hover:border-tungsten transition duration-300';
    card.innerHTML = `
      <div class="overflow-hidden mb-4 bg-black relative">
        <img src="${asset.image_url}" alt="${asset.title}" class="w-full h-64 object-cover opacity-90 hover:opacity-100 transition duration-300">
        <span class="absolute bottom-2 right-2 bg-darkroom/80 text-tungsten text-[10px] uppercase tracking-widest px-2 py-1 font-mono">
          ${asset.year_taken}
        </span>
      </div>
      <h3 class="font-serif text-lg text-white font-semibold mb-1">${asset.title}</h3>
      <p class="text-xs text-tungsten uppercase tracking-wider mb-2">${asset.category}</p>
      ${asset.inscription ? `<p class="text-xs text-zinc-400 font-mono italic">"${asset.inscription}"</p>` : ''}
    `;
    galleryGrid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadArchiveAssets);
