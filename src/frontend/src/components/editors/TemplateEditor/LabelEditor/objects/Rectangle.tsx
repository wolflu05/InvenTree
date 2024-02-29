import { t } from '@lingui/macro';
import { IconRectangleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';
import { pixelToUnit } from '../utils';
import { LayoutPanelBlock, StylePanelBlock } from './Rectangle.settings';
import { GeneralSettingBlock, createFabricObject } from './_BaseObject';

export const Rectangle: LabelEditorObject = {
  key: 'rect',
  name: t`Rectangle`,
  icon: IconRectangleFilled,
  defaultOpen: ['general', 'layout', 'style'],
  settingBlocks: [
    GeneralSettingBlock,
    {
      key: 'layout',
      name: t`Layout`,
      component: LayoutPanelBlock
    },
    {
      key: 'style',
      name: t`Style`,
      component: StylePanelBlock
    }
  ],
  fabricElement: createFabricObject(fabric.Rect, {
    type: 'rect',
    stroke: '#000000',

    initialize(props) {
      this.width = 50;
      this.height = 50;

      this.callSuper('initialize', props);
    }
  }),
  export: {
    style: (object, id) => {
      const c = (n: number, u: string) =>
        Math.round((pixelToUnit(n, u) + Number.EPSILON) * 10 ** 15) / 10 ** 15 +
        u;
      return `      #${id} {
        position: absolute;
        top: ${c(object.top, object.positionUnit)};
        left: ${c(object.left, object.positionUnit)};
        width: ${c(object.width, object.sizeUnit)};
        height: ${c(object.height, object.sizeUnit)};
        background-color: ${object.fill};
        border: ${c(object.strokeWidth, object.strokeWidthUnit)} solid ${
        object.stroke
      };
      }`;
    },
    content: (object, id) => {
      return `<div id="${id}"></div>`;
    }
  }
};
