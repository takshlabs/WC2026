// =============================================================================
//  Fantasy World Cup 2026 — Custom League Rules & Config
//  "Chaos" ruleset: flat $100M cap, United-Clubs constraint, infinite transfers,
//  Super-Sub multiplier, custom booster inventory, official scoring matrix.
// =============================================================================

// ── Budget ───────────────────────────────────────────────────────────────────
// Flat-cap: stays locked at $100M for the ENTIRE tournament (no knockout bump).
export const BUDGET = 100 // $ millions

// ── Squad composition (15-man squad) ─────────────────────────────────────────
export const SQUAD = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
export const SQUAD_SIZE = 15

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']
export const POS_LABEL = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' }
export const POS_SHORT = { GK: 'GKP', DEF: 'DEF', MID: 'MID', FWD: 'FWD' }

// United-Clubs constraint: no two players in the 15-man squad from the same club.
export const MAX_PER_CLUB = 1

// ── Country limits per stage (in ADDITION to the United-Clubs rule) ───────────
// id matches the MATCHES[].round codes used elsewhere where possible.
export const STAGES = [
  { id: 'gs',    label: 'Group Stage / Round of 32', countryLimit: 3 },
  { id: 'r16',   label: 'Round of 16',               countryLimit: 4 },
  { id: 'qf',    label: 'Quarter-finals',            countryLimit: 5 },
  { id: 'sf',    label: 'Semi-finals',               countryLimit: 6 },
  { id: 'final', label: 'Finals',                    countryLimit: 8 },
]
export const DEFAULT_STAGE = 'gs'

// ── Valid starting formations (GK is always 1) ───────────────────────────────
// [DEF, MID, FWD]
export const FORMATIONS = {
  '4-4-2': { DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { DEF: 4, MID: 3, FWD: 3 },
  '4-5-1': { DEF: 4, MID: 5, FWD: 1 },
  '3-4-3': { DEF: 3, MID: 4, FWD: 3 },
  '3-5-2': { DEF: 3, MID: 5, FWD: 2 },
  '5-4-1': { DEF: 5, MID: 4, FWD: 1 },
  '5-3-2': { DEF: 5, MID: 3, FWD: 2 },
}
export const DEFAULT_FORMATION = '4-3-3'

// ── Booster inventory (5 total, one active per round) ─────────────────────────
export const BOOSTERS = [
  {
    id: 'captainRoulette',
    name: "Captain's Roulette",
    icon: '🎲',
    limit: 'Once per tournament',
    multiplier: '3×',
    desc: 'No manual captain. After the final match of the round, an RNG picks one player from your starting XI to wear the armband — that player scores TRIPLED (3×) points instead of the usual 2×.',
  },
  {
    id: 'twelfthMan',
    name: '12th Man',
    icon: '🧤',
    limit: '',
    multiplier: '+1 scorer',
    desc: 'Add 1 extra player who scores points for your team this round. They cannot be subbed, captained, or transferred, and completely ignore the budget, country, and United-Clubs restrictions.',
  },
  {
    id: 'maxCaptain',
    name: 'Maximum Captain',
    icon: '👑',
    limit: '',
    multiplier: '2×',
    desc: 'Automatically gives the 2× armband to whichever player scores the most points in your starting XI at the end of the round.',
  },
  {
    id: 'qualification',
    name: 'Qualification Booster',
    icon: '🚀',
    limit: 'Round of 32 onwards',
    multiplier: '+2',
    desc: 'Grants +2 points to any starting-XI player who progresses to the next round (must play 1+ minute). Captain bonuses do NOT double this +2.',
  },
  {
    id: 'mystery',
    name: 'Mystery Booster',
    icon: '❓',
    limit: 'Unlocks when Round of 32 opens',
    multiplier: '???',
    desc: 'A sealed booster. Its effect is revealed automatically once the Round of 32 begins.',
  },
]
export const BOOSTER_COUNT = 5

// ── Official scoring matrix ───────────────────────────────────────────────────
export const SCORING = {
  all: [
    { label: 'Appearance (up to 60 mins)', pts: '+1' },
    { label: 'Appearance (60+ mins)', pts: '+1' },
    { label: 'Assist', pts: '+3' },
    { label: 'Yellow card', pts: '-1' },
    { label: 'Red card', pts: '-2' },
    { label: 'Own goal', pts: '-2' },
    { label: 'Winning a penalty', pts: '+2' },
    { label: 'Conceding a penalty', pts: '-1' },
  ],
  GK: [
    { label: 'Clean sheet (60+ mins)', pts: '+5' },
    { label: 'Goal scored', pts: '+9' },
    { label: 'Penalty save', pts: '+3' },
    { label: 'Every 3 saves', pts: '+1' },
    { label: 'Goals conceded (1st = 0, each extra)', pts: '-1' },
  ],
  DEF: [
    { label: 'Clean sheet (60+ mins)', pts: '+5' },
    { label: 'Goal scored', pts: '+7' },
    { label: 'Goals conceded (1st = 0, each extra)', pts: '-1' },
  ],
  MID: [
    { label: 'Clean sheet (60+ mins)', pts: '+1' },
    { label: 'Goal scored', pts: '+6' },
    { label: 'Every 3 tackles', pts: '+1' },
    { label: 'Every 2 chances created', pts: '+1' },
  ],
  FWD: [
    { label: 'Goal scored', pts: '+5' },
    { label: 'Every 2 shots on target', pts: '+1' },
  ],
  bonus: [
    { label: 'Direct free-kick goal (on top of goal)', pts: '+1' },
    { label: 'Scouting bonus (>4 pts & owned by <5% of managers)', pts: '+2' },
  ],
}

// Super-Sub multiplier note (custom rule)
export const SUPER_SUB_NOTE =
  'Super-Sub: if an outfield player on your bench comes on in their real WC match and records a Goal or Assist, their bench status is overridden and their matchday score is TRIPLED (3×) and added to your total.'
