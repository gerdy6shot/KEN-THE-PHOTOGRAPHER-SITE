const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cm5zeHl5YWhsdGx0ZnJsamxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc1OTQsImV4cCI6MjEwNTkxMzU5NH0.u975ePxn0cwMeVnZUo2PI8RPy_DyE4k6jseb-qcUkoM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getNumericYear(value) {
  const match = String(value ?? '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function getTargetGrid(asset) {
  const year = getNumericYear(asset.year_taken);

  if (year !== null && year <= 1974) return document.getElementById('grid-act-1');
  if (year !== null && year <= 1995) return document.getElementById('grid-act-2');
  return document.getElementById('grid-act-3');
}

function createMuseumCard(asset) {
  const wrapper = document.createElement('div');

  wrapper.innerHTML = `
    <figure class="group flex flex-col justify-between cursor-pointer fade-in">
      <div class="relative bg-[#050505] p-3 md:p-4 border border-[#1a1a1a] transition-all duration-700 ease-out group-hover:border-[#333333]">
        <div class="overflow-hidden aspect-[4/3] flex items-center justify-center bg-[#000000]">
          <img
            src="${asset.image_url || ''}"
            alt="${asset.title || 'Kenneth Harris archival photograph'}"
            class="object-cover w-full h-full opacity-90 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      </div>

      <figcaption class="mt-6 space-y-1">
        <div class="flex justify-between items-baseline gap-6">
          <h3 class="art-serif text-xl text-[#eeeeee] font-normal tracking-wide group-hover:text-[#ffffff] transition-colors">
            ${asset.title || 'Untitled'}
          </h3>
          <span class="archival-text text-[10px] font-light text-[#666666] tracking-widest shrink-0">
            ${asset.year_taken || ''}
          </span>
        </div>

        ${asset.category ? `
          <p class="archival-text text-[9px] uppercase tracking-[0.25em] text-[#555555] pt-1">
            ${asset.category}
          </p>
        ` : ''}

        ${asset.inscription ? `
          <p class="text-xs text-[#777777] font-light italic leading-relaxed pt-2">
            ${asset.inscription}
          </p>
        ` : ''}
      </figcaption>
    </figure>
  `;

  return wrapper.firstElementChild;
}

async function loadArchiveAssets() {
  const grids = [
    document.getElementById('grid-act-1'),
    document.getElementById('grid-act-2'),
    document.getElementById('grid-act-3')
  ].filter(Boolean);

  grids.forEach(grid => {
    grid.innerHTML = '<p class="archival-text text-[10px] tracking-[0.2em] uppercase text-[#444444]">Loading archive...</p>';
  });

  const { data: assets, error } = await supabaseClient
    .from('archive_assets')
    .select('*')
    .order('year_taken', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching assets:', error);
    grids.forEach(grid => {
      grid.innerHTML = '<p class="archival-text text-[10px] tracking-[0.2em] uppercase text-[#8a3f3f]">Archive unavailable.</p>';
    });
    return;
  }

  grids.forEach(grid => {
    grid.innerHTML = '';
  });

  assets.forEach(asset => {
    const targetGrid = getTargetGrid(asset);
    if (targetGrid) targetGrid.appendChild(createMuseumCard(asset));
  });

  grids.forEach(grid => {
    if (!grid.children.length) {
      grid.innerHTML = '<p class="archival-text text-[10px] tracking-[0.2em] uppercase text-[#444444]">No works catalogued in this room yet.</p>';
    }
  });
}

document.addEventListener('DOMContentLoaded', loadArchiveAssets);
