export const unitToPixel = (value: number, unit: 'px' | 'mm' | 'cm' | 'in') => {
  const DPI = 96;

  if (!value) return 0;

  switch (unit) {
    case 'px':
      return value;
    case 'mm':
      return (value / 25.4) * DPI;
    case 'cm':
      return (value / 2.54) * DPI;
    case 'in':
      return value * DPI;
  }
};

export const pixelToUnit = (value: number, unit: 'px' | 'mm' | 'cm' | 'in') => {
  const DPI = 96;

  if (!value) return 0;

  switch (unit) {
    case 'px':
      return value;
    case 'mm':
      return (value / DPI) * 25.4;
    case 'cm':
      return (value / DPI) * 2.54;
    case 'in':
      return value / DPI;
  }
};
