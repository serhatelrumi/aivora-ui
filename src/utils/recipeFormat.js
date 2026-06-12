/** Reçete girişi ve maden ayarlama — xx,xxx formatı */

export const RECIPE_DECIMALS = 3;

export const fmtRecipe = (n) => (typeof n === 'number'
  ? n.toLocaleString('tr-TR', {
    minimumFractionDigits: RECIPE_DECIMALS,
    maximumFractionDigits: RECIPE_DECIMALS,
  })
  : '—');

/** Fare tekerleği ile değerin max'a (100) zıplamasını önler */
export const preventInputNumberWheel = (e) => {
  e.currentTarget.blur();
};

const recipeBaseInputProps = {
  precision: RECIPE_DECIMALS,
  step: 0.001,
  decimalSeparator: ',',
  onWheel: preventInputNumberWheel,
};

/** Reçete — % girişi */
export const recipePercentInputProps = {
  ...recipeBaseInputProps,
  min: 0,
  max: 100,
};

/** Reçete — gram girişi ve maden ayarlama */
export const recipeGramInputProps = {
  ...recipeBaseInputProps,
  min: 0.001,
};

/** @deprecated recipePercentInputProps veya recipeGramInputProps kullanın */
export const recipeInputProps = recipeGramInputProps;
