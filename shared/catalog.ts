// Template catalogue shared by the web app and the API.
// Cover art lives in web/public/covers (rendered from /covers at 3x).

export type Region = 'Europe' | 'Asia' | 'Americas' | 'Blank';

export interface Palette {
  /** Page paper colour used for inner pages. */
  paper: string;
  /** Main text / line colour. */
  ink: string;
  accent: string;
  accent2: string;
}

export interface Template {
  slug: string;
  country: string;
  region: Region;
  capital: string;
  greeting: string;
  tagline: string;
  description: string;
  /** Display font used for headings suggested inside this diary. */
  displayFont: string;
  palette: Palette;
  /** Cover background colour (spine / back cover). */
  coverColor: string;
  hasCoverArt: boolean;
  isNew?: boolean;
}

export const TEMPLATES: Template[] = [
  {
    slug: 'france', country: 'France', region: 'Europe', capital: 'Paris', greeting: 'bonjour !',
    tagline: 'croissants, rooftops & golden hours',
    description: 'A café awning, an arched Paris window and the Eiffel Tower glowing at sunset — for the trip that was all long lunches and late walks.',
    displayFont: 'Abril Fatface', coverColor: '#F4EBDD',
    palette: { paper: '#F9F3E8', ink: '#1C2A52', accent: '#D8433A', accent2: '#F5CDBF' }, hasCoverArt: true,
  },
  {
    slug: 'italy', country: 'Italia', region: 'Europe', capital: 'Roma', greeting: 'ciao bella!',
    tagline: 'lemons, sea views & gelato stops',
    description: 'A pastel Amalfi village tumbling into the sea under a lemon branch — for coastlines, trattorias and scooter rides.',
    displayFont: 'Shrikhand', coverColor: '#FBF0D6',
    palette: { paper: '#FDF6E3', ink: '#1E4B9C', accent: '#E4605A', accent2: '#F6CB2F' }, hasCoverArt: true,
  },
  {
    slug: 'spain', country: 'España', region: 'Europe', capital: 'Madrid', greeting: '¡olé!',
    tagline: 'tiles, tapas & flamenco nights',
    description: 'A polka-dot flamenco fan over blue azulejo tiles, with a carnation and Seville oranges.',
    displayFont: 'Sancreek', coverColor: '#D63A2F',
    palette: { paper: '#FFF6E6', ink: '#1F4E9E', accent: '#D63A2F', accent2: '#F2B632' }, hasCoverArt: true,
  },
  {
    slug: 'greece', country: 'Greece', region: 'Europe', capital: 'Athens', greeting: 'Γειά σου!',
    tagline: 'blue domes & island hopping',
    description: 'Santorini’s whitewashed terraces and blue domes, framed by a Greek key border and laurel sprigs.',
    displayFont: 'Cinzel Decorative', coverColor: '#F8F5EC',
    palette: { paper: '#F8F7F1', ink: '#1C4FA6', accent: '#C8337A', accent2: '#F7B447' }, hasCoverArt: true,
  },
  {
    slug: 'turkiye', country: 'Türkiye', region: 'Europe', capital: 'İstanbul', greeting: 'merhaba!',
    tagline: 'balloons, bazaars & sunrise skies',
    description: 'Hot-air balloons rising over Cappadocia’s fairy chimneys, with a lucky nazar bead along for the ride.',
    displayFont: 'Kavoon', coverColor: '#FBE4C9',
    palette: { paper: '#FDF1E4', ink: '#15525F', accent: '#D9443A', accent2: '#EDB23C' }, hasCoverArt: true, isNew: true,
  },
  {
    slug: 'japan', country: 'Japan', region: 'Asia', capital: 'Tokyo', greeting: 'こんにちは',
    tagline: 'temples, trains & cherry blossom',
    description: 'Mt Fuji under a rising sun, a torii gate in seigaiha waves and a sakura branch — with a 日本 hanko seal.',
    displayFont: 'Abril Fatface', coverColor: '#F3EAD7',
    palette: { paper: '#F7F1E4', ink: '#233058', accent: '#D8412F', accent2: '#F5B7C5' }, hasCoverArt: true,
  },
  {
    slug: 'thailand', country: 'Thailand', region: 'Asia', capital: 'Bangkok', greeting: 'สวัสดี',
    tagline: 'island boats & frangipani',
    description: 'A garlanded longtail boat drifting between limestone cliffs on turquoise water.',
    displayFont: 'Chonburi', coverColor: '#FCE3BC',
    palette: { paper: '#FEF4E2', ink: '#1F5C4A', accent: '#C4205E', accent2: '#23AFB3' }, hasCoverArt: true, isNew: true,
  },
  {
    slug: 'usa', country: 'USA', region: 'Americas', capital: 'New York', greeting: 'wish you were here!',
    tagline: 'road trips, coast to coast',
    description: 'A vintage “Greetings from” postcard — the Golden Gate, Lady Liberty and the desert live inside the letters.',
    displayFont: 'Alfa Slab One', coverColor: '#F5EAD5',
    palette: { paper: '#FBF4E6', ink: '#1E2B55', accent: '#D5373F', accent2: '#F6C543' }, hasCoverArt: true,
  },
  {
    slug: 'uk', country: 'United Kingdom', region: 'Europe', capital: 'London', greeting: 'cheers, love!',
    tagline: 'red buses & rainy-day tea',
    description: 'A King’s Guard, Big Ben and a red double-decker under bunting — a proper London postcard.',
    displayFont: 'Alfa Slab One', coverColor: '#CFE0EA',
    palette: { paper: '#F7F3EC', ink: '#1B2550', accent: '#D22B35', accent2: '#8FB6CF' }, hasCoverArt: true,
  },
  {
    slug: 'mexico', country: 'México', region: 'Americas', capital: 'CDMX', greeting: '¡hola!',
    tagline: 'fiestas, pyramids & marigolds',
    description: 'Papel picado over Chichén Itzá, with nopal cactus, agave and bright marigolds.',
    displayFont: 'Knewave', coverColor: '#E4217A',
    palette: { paper: '#FFF5E8', ink: '#6A3D9E', accent: '#E4217A', accent2: '#FFCB3D' }, hasCoverArt: true,
  },
  {
    slug: 'blank', country: 'Start from scratch', region: 'Blank', capital: 'Anywhere', greeting: 'hello, adventure!',
    tagline: 'a blank page for any trip',
    description: 'A clean notebook cover you design yourself — add a title, doodles and your favourite shot.',
    displayFont: 'Abril Fatface', coverColor: '#FFFDEF',
    palette: { paper: '#FFFDF5', ink: '#111111', accent: '#FF5A52', accent2: '#FFD93D' }, hasCoverArt: false,
  },
];

export const getTemplate = (slug: string): Template | undefined => TEMPLATES.find(t => t.slug === slug);

export const coverUrls = (slug: string) => ({
  small: `/covers/${slug}-sm.webp`,
  medium: `/covers/${slug}.webp`,
  print: `/covers/${slug}-print.jpg`,
});
