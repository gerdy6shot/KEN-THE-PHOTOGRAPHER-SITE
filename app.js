const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cm5zeHl5YWhsdGx0ZnJsamxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc1OTQsImV4cCI6MjEwNTkxMzU5NH0.u975ePxn0cwMeVnZUo2PI8RPy_DyE4k6jseb-qcUkoM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadArchiveAssets() {
  const galleryGrid = document.getElementById('vault-grid');
  const loadingText = null;

  const { data: assets, error } = await supabaseClient
    .from('archive_assets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching assets:', error);
    if (loadingText) loadingText.textContent = 'Failed to load archival records.';
    return;
  }

  galleryGrid.innerHTML = '';

  assets.forEach(asset => {
    const card = document.createElement('div');
    card.innerHTML = `
      <figure class="group flex flex-col justify-between cursor-pointer">
        <!-- Fine Art Frame & Matting -->
        <div class="relative bg-[#050505] p-3 md:p-4 border border-[#1a1a1a] transition-all duration-700 ease-out group-hover:border-[#333333]">
          <div class="overflow-hidden aspect-[4/3] flex items-center justify-center bg-[#000000]">
            <img
              src="${asset.image_url}"
              alt="${asset.title}"
              class="object-cover w-full h-full opacity-90 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        <!-- Fine Art Caption (Museum Tombstone) -->
        <figcaption class="mt-6 space-y-1">
          <div class="flex justify-between items-baseline gap-6">
            <h2 class="art-serif text-xl text-[#eeeeee] font-normal tracking-wide group-hover:text-[#ffffff] transition-colors">
              ${asset.title}
            </h2>
            <span class="text-[11px] font-light text-[#666666] tracking-widest shrink-0">
              ${asset.year_taken || ''}
            </span>
          </div>

          ${asset.inscription ? `
            <p class="text-xs text-[#777777] font-light italic leading-relaxed pt-1">
              ${asset.inscription}
            </p>
          ` : ''}
        </figcaption>
      </figure>
    `;
    galleryGrid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadArchiveAssets);
