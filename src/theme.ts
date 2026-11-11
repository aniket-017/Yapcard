export const APP_NAME = 'Yapcard';
export const APP_TAGLINE = 'Your group chat, wrapped';
// Shown on every shared card.
export const SHARE_LINK = 'yapcard.jasdigitaltechnologies.com';

// Palette: a deep violet stage with sticker-bright colours on top.
export const colors = {
  bg: '#1B1535',
  panel: '#2A2150',
  panel2: '#3A2F6B',
  ink: '#1B1535',
  text: '#FFF6E6',
  dim: '#BDB4DA',
  faint: '#6F6699',
  white: '#FFFFFF',
  mango: '#FFB627',
  pink: '#FF5FA2',
  mint: '#3EE6B0',
  sky: '#5CC8FF',
  lilac: '#B79CFF',
  coral: '#FF7A59',
  red: '#FF4D6D',
};

// One typeface, three weights. Never combine these with fontWeight:
// Android falls back to the system font if you do.
export const font = {
  display: 'BricolageGrotesque_800ExtraBold',
  bold: 'BricolageGrotesque_700Bold',
  body: 'BricolageGrotesque_500Medium',
};

// Flat slide backgrounds: [background, text].
export const slideColors: Record<string, [string, string]> = {
  intro: ['#B79CFF', '#1B1535'],
  total: ['#FF5FA2', '#1B1535'],
  guess: ['#1B1535', '#FFF6E6'],
  hour: ['#5CC8FF', '#1B1535'],
  lang: ['#3EE6B0', '#1B1535'],
  day: ['#FFB627', '#1B1535'],
  duo: ['#FF7A59', '#1B1535'],
  vibe: ['#B79CFF', '#1B1535'],
  outro: ['#FFB627', '#1B1535'],
};

export const fmt = (n: number) => {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** Share of the chat as a label; tiny shares show as "<1%" instead of "0%". */
export const pctLabel = (share: number) => (share > 0 && share < 0.005 ? '<1%' : `${Math.round(share * 100)}%`);

export const hourLabel = (h: number) => {
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dateLabel = (ts: number, withYear = true) => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
};

export const firstName = (name: string) => {
  const t = name.trim();
  if (/^[+\d\s()-]+$/.test(t)) return t.slice(-5); // phone number, show the tail
  return t.split(/\s+/)[0];
};
