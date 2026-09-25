const SUPABASE_URL = 'https://jurnsxyyahltltfrljls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imp1cm5zeHl5YWhsdGx0ZnJsamxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc1OTQsImV4cCI6MjEwNTkxMzU5NH0.u975ePxn0cwMeVnZUo2PI8RPy_DyE4k6jseb-qcUkoM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Curated Act I image set committed to the repository.
const ACT1_FEATURED_ITEMS = [
  { title: 'Al Green', image_url: getAct1ImagePath('AL GREEN.JPG') },
  { title: 'Clifford Glover Funeral', image_url: getAct1ImagePath('Clifford Glover Funeral.jpg') },
  { title: 'Kenneth Harris in High School', image_url: getAct1ImagePath('Kenneth Harris in Highschool.jpg') },
  { title: 'Knicks Courtside at 15 Years Old', image_url: getAct1ImagePath('knicks court side at 15 yearsold.JPG') },
  { title: 'Knicks Game Courtside at 15 Years', image_url: getAct1ImagePath('Knicks game courtside at 15 years.JPG') },
  { title: 'Nina Simone', image_url: getAct1ImagePath('Nina Simone.jpg') },
  { title: 'Grandfather and Aunt', image_url: getAct1ImagePath('Picture of his Grandfather and aunt.jpg') },
  { title: 'Grandfather', image_url: getAct1ImagePath('Picture of his grandfather.jpg') },
  { title: 'Protest March on the Brooklyn Bridge', image_url: getAct1ImagePath('Protest march on the Brooklyn Bridge.jpg') },
  { title: 'Ray Charles', image_url: getAct1ImagePath('Ray charles.JPG') }
];

function getAct1ImagePath(filename) {
  return './' + encodeURIComponent('The UNDERCOVER TEENAGE PRODIGY') + '/' + encodeURIComponent(filename);
}

const ENTERTAINMENT_ITEMS = [
  { title: '50 Cent', file: '50 Cent.JPG' },
  { title: 'Barack Obama', file: 'Barak Obama.JPG' },
  { title: 'Beyoncé', file: 'Beyonce.JPG' },
  { title: 'Denzel Washington & Russell Crowe', file: 'Denzel washingto, Russel Crow.JPG' },
  { title: 'Indie Irie Performing', file: 'Indie Irie Performing.JPG' },
  { title: 'Isaac Hayes', file: 'Issac Hayes.JPG' },
  { title: 'James Brown', file: 'James Brown.JPG' },
  { title: 'James Brown', file: 'Mr.James Brown.JPG' },
  { title: 'Kanye West', file: 'Kanye WEST.JPG' },
  { title: 'Kanye West and Robert', file: 'Kanye West and Robert.JPG' },
  { title: 'Mariah Carey & Sean Combs', file: 'Mariah Carey & Sean Combs.JPG' },
  { title: 'Michelle Obama', file: 'Michelle Obama.JPG' },
  { title: 'Mike Tyson', file: 'Mike Tyson.JPG' },
  { title: 'Nicki Minaj', file: 'Niki Minage.JPG' },
  { title: 'Rick Ross & Puffy', file: 'Rick Ross & Puffy.JPG' },
  { title: 'Snoop Dogg', file: 'Snoop Dogg.JPG' },
  { title: 'Spike Lee', file: 'Spike Lee.JPG' },
  { title: 'Venus & Serena Williams', file: 'Venus & Serena Williwms.JPG' },
  { title: 'Young Chris Brown & T-Pain', file: 'Young Chris Brown & T-PAIN.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_5976.jpg' },
  { title: 'Celebrity Archive', file: 'IMG_6052.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_6104.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_6110.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_6112.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_6120.JPG' },
  { title: 'Celebrity Archive', file: 'IMG_6122.JPG' },
  { title: 'Celebrity Archive', file: 'PHOTO-2026-09-04-19-40-42.jpg' },
  { title: 'Celebrity Archive', file: '08316df3-7354-457c-9f08-583e661f9742.JPG' },
  { title: 'Celebrity Archive', file: '8712101b-d159-495a-95bb-97c4084f210e.JPG' }
].map(item => ({
  ...item,
  image_url:
    './' +
    encodeURIComponent('The UNDERCOVER TEENAGE PRODIGY ') +
    '/' +
    encodeURIComponent('Celebrity, Culture & Entertainment') +
    '/' +
    encodeURIComponent(item.file)
}));

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
  const grid1 = document.getElementById('grid-act-1');
  const gridMillion = document.getElementById('grid-million-man-march');
  const gridEntertainment = document.getElementById('grid-entertainment');
  const gridPhotojournalism = document.getElementById('grid-photojournalism');

  // Act I is a curated static gallery and must render even if Supabase is unavailable.
  if (grid1) {
    grid1.innerHTML = '';
    ACT1_FEATURED_ITEMS.forEach(item => {
      grid1.insertAdjacentHTML('beforeend', renderPhotoCard(item));
    });
  }

  // Entertainment is also a curated static gallery and must render independently of Supabase.
  if (gridEntertainment) {
    gridEntertainment.innerHTML = '';
    ENTERTAINMENT_ITEMS.forEach(item => {
      gridEntertainment.insertAdjacentHTML('beforeend', renderPhotoCard(item));
    });
  }

  [gridMillion, gridPhotojournalism].filter(Boolean).forEach(grid => {
    grid.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#555555] tracking-widest">LOADING ARCHIVE...</p>';
  });

  const { data: archiveItems, error } = await supabaseClient
    .from('archive_assets')
    .select('*')
    .order('year_taken', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching archive:', error);
    [gridMillion, gridPhotojournalism].filter(Boolean).forEach(grid => {
      grid.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#8a3f3f] tracking-widest">ARCHIVE UNAVAILABLE.</p>';
    });
    return;
  }

  const categories = {
    'grid-million-man-march': [],
    'grid-photojournalism': []
  };

  archiveItems.forEach(item => {
    const gridId = getGalleryCategory(item);
    if (categories[gridId]) categories[gridId].push(item);
  });

  Object.entries(categories).forEach(([gridId, items]) => {
    const gridElement = document.getElementById(gridId);
    if (!gridElement) return;

    gridElement.innerHTML = '';

    if (!items.length) {
      gridElement.innerHTML = '<p class="col-span-full archival-text text-[11px] text-[#555555] tracking-widest">NO WORKS CATALOGUED IN THIS ROOM YET.</p>';
      return;
    }

    items.forEach(item => {
      gridElement.insertAdjacentHTML('beforeend', renderPhotoCard(item));
    });
  });
}

document.addEventListener('DOMContentLoaded', fetchAndRenderArchive);
