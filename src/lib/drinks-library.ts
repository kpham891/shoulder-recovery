import { DrinkCategory, LibraryDrink } from '@/types';
import { calculateUnits, displayUnits } from './units-calculator';

function u(vol: number, abv: number) {
  return displayUnits(calculateUnits(vol, abv));
}

export const CATEGORY_EMOJI: Record<DrinkCategory, string> = {
  beer: '🍺',
  wine: '🍷',
  spirits: '🥃',
  cider: '🍏',
  other: '🍹',
};

export const VOLUME_CHIPS: Record<DrinkCategory, number[]> = {
  beer: [250, 330, 375, 440, 568],
  wine: [125, 175, 250, 750],
  spirits: [25, 50],
  cider: [330, 440, 500, 568],
  other: [150, 200, 250],
};

export const drinksLibrary: LibraryDrink[] = [
  // Beer — most common first
  { id: 'beer-bottle', name: 'Bottle of Beer', category: 'beer', volume_ml: 330, abv_percent: 5, units: u(330, 5) },
  { id: 'beer-can', name: 'Can of Beer', category: 'beer', volume_ml: 440, abv_percent: 5, units: u(440, 5) },
  { id: 'beer-pint-4', name: 'Pint of Lager', category: 'beer', volume_ml: 568, abv_percent: 4, units: u(568, 4) },
  { id: 'beer-pint-5', name: 'Pint — Strong', category: 'beer', volume_ml: 568, abv_percent: 5, units: u(568, 5) },
  { id: 'beer-schooner', name: 'Schooner', category: 'beer', volume_ml: 425, abv_percent: 4.5, units: u(425, 4.5) },
  { id: 'beer-middy', name: 'Middy / Pot', category: 'beer', volume_ml: 285, abv_percent: 4.5, units: u(285, 4.5) },

  // Wine
  { id: 'wine-small', name: 'Small Glass', category: 'wine', volume_ml: 125, abv_percent: 12, units: u(125, 12) },
  { id: 'wine-standard', name: 'Standard Glass', category: 'wine', volume_ml: 175, abv_percent: 12, units: u(175, 12) },
  { id: 'wine-large', name: 'Large Glass', category: 'wine', volume_ml: 250, abv_percent: 12, units: u(250, 12) },
  { id: 'wine-bottle', name: 'Bottle of Wine', category: 'wine', volume_ml: 750, abv_percent: 12, units: u(750, 12) },
  { id: 'wine-prosecco', name: 'Prosecco Flute', category: 'wine', volume_ml: 125, abv_percent: 11, units: u(125, 11) },
  { id: 'wine-rose', name: 'Rosé Glass', category: 'wine', volume_ml: 175, abv_percent: 11.5, units: u(175, 11.5) },

  // Spirits
  { id: 'spirits-single', name: 'Single Shot', category: 'spirits', volume_ml: 25, abv_percent: 40, units: u(25, 40) },
  { id: 'spirits-double', name: 'Double Shot', category: 'spirits', volume_ml: 50, abv_percent: 40, units: u(50, 40) },
  { id: 'spirits-nip', name: 'Nip', category: 'spirits', volume_ml: 30, abv_percent: 40, units: u(30, 40) },
  { id: 'spirits-cocktail', name: 'Cocktail', category: 'spirits', volume_ml: 60, abv_percent: 35, units: u(60, 35) },
  { id: 'spirits-long', name: 'Highball', category: 'spirits', volume_ml: 50, abv_percent: 40, units: u(50, 40) },
  { id: 'spirits-liqueur', name: 'Liqueur', category: 'spirits', volume_ml: 50, abv_percent: 20, units: u(50, 20) },

  // Cider
  { id: 'cider-pint', name: 'Pint of Cider', category: 'cider', volume_ml: 568, abv_percent: 4.5, units: u(568, 4.5) },
  { id: 'cider-can', name: 'Can of Cider', category: 'cider', volume_ml: 440, abv_percent: 5, units: u(440, 5) },
  { id: 'cider-bottle', name: 'Bottle of Cider', category: 'cider', volume_ml: 330, abv_percent: 4.5, units: u(330, 4.5) },
  { id: 'cider-strong', name: 'Strong Cider', category: 'cider', volume_ml: 500, abv_percent: 7, units: u(500, 7) },

  // Other
  { id: 'other-seltzer', name: 'Hard Seltzer', category: 'other', volume_ml: 330, abv_percent: 5, units: u(330, 5) },
  { id: 'other-alcopop', name: 'Alcopop', category: 'other', volume_ml: 275, abv_percent: 4, units: u(275, 4) },
];

export function getDrinksByCategory(category: DrinkCategory): LibraryDrink[] {
  return drinksLibrary.filter((d) => d.category === category);
}
