import { t } from '@lingui/macro';
import { IconRectangleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';
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
  })
};
