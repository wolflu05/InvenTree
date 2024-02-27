import { fabric } from 'fabric';

export const createFabricObject = (
  base: typeof fabric.Object,
  properties: object
) => {
  const customBase = fabric.util.createClass(base, {
    positionUnit: 'mm',
    sizeUnit: 'mm',
    strokeWidth: 0
  });

  return fabric.util.createClass(customBase, properties);
};
