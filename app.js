const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imp1cm5zeHl5YWhsdGx0ZnJsamxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc1OTQsImV4cCI6MjEwNTkxMzU5NH0.u975ePxn0cwMeVnZUo2PI8RPy_DyE4k6jseb-qcUkoM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Existing Act I image library already committed to the repository.
const ACT1_IMAGE_FILES = [
  '450c4415-219e-4a69-a3e8-0d5d60f4949a.JPG', // Al Green
  '2330927b-36b7-4b45-98fd-c7e68d4ab9fc.JPG', // Ray Charles
  '0f942ba3-2a82-4b67-98c9-219de29a8be1.JPG', // Knicks courtside
  'e2af4d53-d8f9-4ae0-9b83-04e79ae65adc.JPG', // Knicks game
  'IMG_6050.JPG',
  'IMG_6051.JPG',
  'IMG_6052.JPG',
  'IMG_6053.JPG',
  'IMG_6055.JPG',
  'IMG_6045.jpg',
  'c8b79fd6-10b5-41b3-8db7-379cbb8a4929.JPG',
  'fd093743-0505-448b-8ad7-8ea89559cc84.JPG'
];

function getAct1ImagePath(index) {
  const filename = ACT1_IMAGE_FILES[index % ACT1_IMAGE_FILES.length];
  return './' + encodeURIComponent('The UNDERCOVER TEENAGE PRODIGY ') + '/' + encodeURIComponent(filename);
}

// Route photos based on category first, then chronology.
function getGalleryCategory(item) {
  const category = item.category ? item.category.toLowerCase() : '';
  const title = item.title ? item.title.toLowerCase() : '';
  const year = parseInt(item.year_taken, 10) || 0;

  if (category.includes('million man march') || title.includes('million man march')) {
    return 'grid-million-man-march';
  }

  if (
    category.includes('photojournalism') ||
    category.includes('movement') ||
    category.includes('protest')
  ) {
    return 'grid-photojournalism';
  }

  if (
    category.includes('celebrity') ||
    category.includes('entertainment') ||
    category.includes('music')
  ) {
    return 'grid-entertainment';
  }

  if (year >= 1955 && year <= 1974) {
    return 'grid-act-1';
  }

  return 'grid-act-1';
}

function renderPhotoCard(item) {
  const inscriptionHTML = item.inscription
    ? `<div class="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-sm">
         <p class="archival-text text-[11px] text-[#aaaaaa] leading-relaxed">
           <span class="text-[#666666]">Note:</span> ${item.inscription}
         </p>
       </div>`
    : '';

  return `
    <figure class="group flex flex-col justify-between cursor-pointer fade-in">
      <div class="relative bg-[#0a0a0a] p-2 md:p-3 border border-[#1a1a1a] transition-all duration-700 ease-out group-hover:border-[#444444]">
        <div class="overflow-hidden aspect-[4/3] flex items-center justify-center bg-[#000000]">
          <img
            src="${item.image_url || ''}"
            alt="${item.title || 'Kenneth Harris archival photograph'}"
            class="object-cover w-full h-full opacity-80 grayscale-[20%] transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      </div>

      <figcaption class="mt-6 space-y-2">
        <div class="flex justify-between items-baseline gap-6 border-b border-[#222222] pb-2">
          <h3 class="art-serif text-xl text-[#eeeeee] font-normal tracking-wide group-hover:text-[#ffffff] transition-colors">
            ${item.title || 'Untitled'}
          </h3>
          <span class="archival-text text-[11px] text-[#777777] shrink-0">
            ${item.year_taken || 'Undated'}
          </span>
        </div>
        ${inscriptionHTML}
      </figcaption>
    </figure>
  `;
}

async function fetchAndRenderArchive() {
  const gridIds = [
    'grid-act-1',
    'grid-million-man-march',
    'grid-entertainment',
    'grid-photojournalism'
  ];

  gridIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#555555] tracking-widest">LOADING ARCHIVE...</p>';
    }
  });

  const { data: archiveItems, error } = await supabaseClient
    .from('archive_assets')
    .select('*')
    .order('year_taken', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching archive:', error);
    gridIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#8a3f3f] tracking-widest">ARCHIVE UNAVAILABLE.</p>';
      }
    });
    return;
  }

  const categories = {
    'grid-act-1': [],
    'grid-million-man-march': [],
    'grid-entertainment': [],
    'grid-photojournalism': []
  };

  archiveItems.forEach(item => {
    const gridId = getGalleryCategory(item);
    if (categories[gridId]) {
      categories[gridId].push(item);
    } else {
      categories['grid-act-1'].push(item);
    }
  });

  let act1ImageIndex = 0;

  Object.keys(categories).forEach(gridId => {
    const gridElement = document.getElementById(gridId);
    if (!gridElement) return;

    gridElement.innerHTML = '';

    if (categories[gridId].length === 0) {
      gridElement.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#555555] tracking-widest">NO WORKS CATALOGUED IN THIS ROOM YET.</p>';
      return;
    }

    categories[gridId].forEach(item => {
      const renderedItem =
        gridId === 'grid-act-1'
          ? { ...item, image_url: getAct1ImagePath(act1ImageIndex++) }
          : item;

      gridElement.insertAdjacentHTML('beforeend', renderPhotoCard(renderedItem));
    });
  });
}

document.addEventListener('DOMContentLoaded', fetchAndRenderArchive);
