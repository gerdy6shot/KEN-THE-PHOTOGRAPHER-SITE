const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cm5zeHl5YWhsdGx0ZnJsamxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc1OTQsImV4cCI6MjEwNTkxMzU5NH0.u975ePxn0cwMeVnZUo2PI8RPy_DyE4k6jseb-qcUkoM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ACT1_IMAGE_FILES = [
  '0f942ba3-2a82-4b67-98c9-219de29a8be1.JPG',
  '1ECFF515-30EB-4EA2-A8F9-1452D69AD1B2.PNG',
  '2330927b-36b7-4b45-98fd-c7e68d4ab9fc.JPG',
  '26564975-BEE5-4F7B-9D40-BC56228B6DC3.PNG',
  '450c4415-219e-4a69-a3e8-0d5d60f4949a.JPG',
  'B5482719-1D41-4FBA-8838-34F0F486823F.PNG',
  'E8A9ECB1-5AC1-46D0-8877-D8BD9F2F71E9.PNG',
  'IMG_5942.jpg',
  'IMG_6045.jpg',
  'IMG_6050.JPG',
  'IMG_6051.JPG',
  'IMG_6052.JPG',
  'IMG_6053.JPG',
  'IMG_6055.JPG',
  'Untitled - September 21, 2026 09.08.19 2.PNG',
  'Untitled - September 21, 2026 09.08.19 3.PNG',
  'Untitled - September 21, 2026 09.08.19.PNG',
  'c8b79fd6-10b5-41b3-8db7-379cbb8a4929.JPG',
  'e2af4d53-d8f9-4ae0-9b83-04e79ae65adc.JPG',
  'fb047f6b-f116-4248-9138-cf677a4e88e3.JPG',
  'fd093743-0505-448b-8ad7-8ea89559cc84.JPG'
];

function getAct1ImagePath(index) {
  const filename = ACT1_IMAGE_FILES[index % ACT1_IMAGE_FILES.length];
  return './' + encodeURIComponent('The UNDERCOVER TEENAGE PRODIGY ') + '/' + encodeURIComponent(filename);
}

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

  let act1ImageIndex = 0;

  assets.forEach(asset => {
    const targetGrid = getTargetGrid(asset);

    if (targetGrid && targetGrid.id === 'grid-act-1') {
      const act1Asset = {
        ...asset,
        image_url: getAct1ImagePath(act1ImageIndex)
      };
      act1ImageIndex += 1;
      targetGrid.appendChild(createMuseumCard(act1Asset));
      return;
    }

    if (targetGrid) targetGrid.appendChild(createMuseumCard(asset));
  });

  grids.forEach(grid => {
    if (!grid.children.length) {
      grid.innerHTML = '<p class="archival-text text-[10px] tracking-[0.2em] uppercase text-[#444444]">No works catalogued in this room yet.</p>';
    }
  });
}

document.addEventListener('DOMContentLoaded', loadArchiveAssets);
