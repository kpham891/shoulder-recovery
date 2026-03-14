import { DrinkCategory, LibraryDrink } from '@/types';
import { calculateUnits, displayUnits } from './units-calculator';

function u(vol: number, abv: number) {
  return displayUnits(calculateUnits(vol, abv));
}

export const CATEGORY_EMOJI: Record<DrinkCategory, string> = {
  beer: '🍺',
  'cider-seltzer': '🫧',
  wine: '🍷',
  'sake-soju': '🍶',
  spirits: '🥃',
  cocktails: '🍹',
};

export const VOLUME_CHIPS: Record<DrinkCategory, number[]> = {
  beer: [250, 330, 375, 440, 568],
  'cider-seltzer': [330, 355, 440, 500, 568],
  wine: [125, 175, 250, 750],
  'sake-soju': [30, 50, 180, 300, 360],
  spirits: [30, 60],
  cocktails: [100, 150, 200, 250],
};

export const drinksLibrary: LibraryDrink[] = [
  // Beer
  { id: 'beer-bottle-lager', name: 'Bottle of Lager', category: 'beer', volume_ml: 330, abv_percent: 5.0, units: u(330, 5.0) },
  { id: 'beer-can-lager', name: 'Can of Lager', category: 'beer', volume_ml: 440, abv_percent: 5.0, units: u(440, 5.0) },
  { id: 'beer-pint-lager', name: 'Pint of Lager', category: 'beer', volume_ml: 568, abv_percent: 4.0, units: u(568, 4.0) },
  { id: 'beer-pint-strong', name: 'Pint of Lager — Strong', category: 'beer', volume_ml: 568, abv_percent: 5.0, units: u(568, 5.0) },
  { id: 'beer-bottle-ipa', name: 'Bottle of IPA', category: 'beer', volume_ml: 330, abv_percent: 6.5, units: u(330, 6.5) },
  { id: 'beer-pint-ipa', name: 'Pint of IPA', category: 'beer', volume_ml: 568, abv_percent: 5.5, units: u(568, 5.5) },
  { id: 'beer-bottle-stout', name: 'Bottle of Stout', category: 'beer', volume_ml: 330, abv_percent: 4.5, units: u(330, 4.5) },
  { id: 'beer-pint-stout', name: 'Pint of Stout', category: 'beer', volume_ml: 568, abv_percent: 4.3, units: u(568, 4.3) },
  { id: 'beer-schooner', name: 'Schooner', category: 'beer', volume_ml: 425, abv_percent: 4.5, units: u(425, 4.5) },
  { id: 'beer-middy', name: 'Middy / Pot', category: 'beer', volume_ml: 285, abv_percent: 4.5, units: u(285, 4.5) },

  // Cider & Seltzer
  { id: 'cs-can-seltzer', name: 'Can of Hard Seltzer', category: 'cider-seltzer', volume_ml: 355, abv_percent: 5.0, units: u(355, 5.0) },
  { id: 'cs-bottle-seltzer', name: 'Bottle of Hard Seltzer', category: 'cider-seltzer', volume_ml: 330, abv_percent: 5.0, units: u(330, 5.0) },
  { id: 'cs-can-cider', name: 'Can of Cider', category: 'cider-seltzer', volume_ml: 440, abv_percent: 5.0, units: u(440, 5.0) },
  { id: 'cs-pint-cider', name: 'Pint of Cider', category: 'cider-seltzer', volume_ml: 568, abv_percent: 4.5, units: u(568, 4.5) },
  { id: 'cs-bottle-cider', name: 'Bottle of Cider', category: 'cider-seltzer', volume_ml: 330, abv_percent: 4.5, units: u(330, 4.5) },

  // Wine
  { id: 'wine-small', name: 'Small Glass of Wine', category: 'wine', volume_ml: 125, abv_percent: 13.0, units: u(125, 13.0) },
  { id: 'wine-medium', name: 'Medium Glass of Wine', category: 'wine', volume_ml: 175, abv_percent: 13.0, units: u(175, 13.0) },
  { id: 'wine-large', name: 'Large Glass of Wine', category: 'wine', volume_ml: 250, abv_percent: 13.0, units: u(250, 13.0) },
  { id: 'wine-bottle', name: 'Bottle of Wine', category: 'wine', volume_ml: 750, abv_percent: 13.0, units: u(750, 13.0) },
  { id: 'wine-champagne', name: 'Glass of Champagne', category: 'wine', volume_ml: 125, abv_percent: 12.0, units: u(125, 12.0) },
  { id: 'wine-prosecco', name: 'Prosecco / Sparkling', category: 'wine', volume_ml: 125, abv_percent: 11.0, units: u(125, 11.0) },
  { id: 'wine-rose', name: 'Glass of Rosé', category: 'wine', volume_ml: 175, abv_percent: 12.0, units: u(175, 12.0) },

  // Sake & Soju
  { id: 'sake-glass', name: 'Glass of Sake', category: 'sake-soju', volume_ml: 180, abv_percent: 15.0, units: u(180, 15.0) },
  { id: 'sake-carafe', name: 'Small Carafe of Sake', category: 'sake-soju', volume_ml: 300, abv_percent: 15.0, units: u(300, 15.0) },
  { id: 'soju-shot', name: 'Shot of Soju', category: 'sake-soju', volume_ml: 50, abv_percent: 20.0, units: u(50, 20.0) },
  { id: 'soju-glass', name: 'Glass of Soju', category: 'sake-soju', volume_ml: 360, abv_percent: 17.0, units: u(360, 17.0) },
  { id: 'makgeolli-bowl', name: 'Bowl of Makgeolli', category: 'sake-soju', volume_ml: 300, abv_percent: 7.0, units: u(300, 7.0) },

  // Spirits
  { id: 'spirits-single', name: 'Single Shot', category: 'spirits', volume_ml: 30, abv_percent: 40.0, units: u(30, 40.0) },
  { id: 'spirits-double', name: 'Double Shot', category: 'spirits', volume_ml: 60, abv_percent: 40.0, units: u(60, 40.0) },
  { id: 'spirits-whisky', name: 'Whisky on the Rocks', category: 'spirits', volume_ml: 60, abv_percent: 40.0, units: u(60, 40.0) },
  { id: 'spirits-vodka', name: 'Vodka on the Rocks', category: 'spirits', volume_ml: 60, abv_percent: 40.0, units: u(60, 40.0) },
  { id: 'spirits-rum', name: 'Rum & Ice', category: 'spirits', volume_ml: 60, abv_percent: 40.0, units: u(60, 40.0) },
  { id: 'spirits-tequila', name: 'Tequila Shot', category: 'spirits', volume_ml: 30, abv_percent: 40.0, units: u(30, 40.0) },

  // Cocktails
  { id: 'cocktail-gt', name: 'Gin & Tonic', category: 'cocktails', volume_ml: 250, abv_percent: 5.0, units: u(250, 5.0) },
  { id: 'cocktail-vodka-soda', name: 'Vodka Soda', category: 'cocktails', volume_ml: 250, abv_percent: 5.0, units: u(250, 5.0) },
  { id: 'cocktail-margarita', name: 'Margarita', category: 'cocktails', volume_ml: 200, abv_percent: 13.0, units: u(200, 13.0) },
  { id: 'cocktail-mojito', name: 'Mojito', category: 'cocktails', volume_ml: 250, abv_percent: 8.0, units: u(250, 8.0) },
  { id: 'cocktail-negroni', name: 'Negroni', category: 'cocktails', volume_ml: 150, abv_percent: 22.0, units: u(150, 22.0) },
  { id: 'cocktail-aperol', name: 'Aperol Spritz', category: 'cocktails', volume_ml: 200, abv_percent: 8.0, units: u(200, 8.0) },
  { id: 'cocktail-espresso', name: 'Espresso Martini', category: 'cocktails', volume_ml: 150, abv_percent: 14.0, units: u(150, 14.0) },
  { id: 'cocktail-cosmo', name: 'Cosmopolitan', category: 'cocktails', volume_ml: 150, abv_percent: 14.0, units: u(150, 14.0) },
  { id: 'cocktail-old-fashioned', name: 'Old Fashioned', category: 'cocktails', volume_ml: 100, abv_percent: 32.0, units: u(100, 32.0) },
  { id: 'cocktail-daiquiri', name: 'Daiquiri', category: 'cocktails', volume_ml: 150, abv_percent: 14.0, units: u(150, 14.0) },
];

export function getDrinksByCategory(category: DrinkCategory): LibraryDrink[] {
  return drinksLibrary.filter((d) => d.category === category);
}
