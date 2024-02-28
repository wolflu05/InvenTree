import { t } from '@lingui/macro';
import { IconRectangleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';
import { LayoutPanelBlock } from './Rectangle.settings';
import { GeneralSettingBlock, createFabricObject } from './_BaseObject';

export const Rectangle: LabelEditorObject = {
  key: 'rect',
  name: t`Rectangle`,
  icon: IconRectangleFilled,
  defaultOpen: ['general', 'layout'],
  settingBlocks: [
    GeneralSettingBlock,
    {
      key: 'layout',
      name: t`Layout`,
      component: LayoutPanelBlock
    }
  ],
  fabricElement: createFabricObject(fabric.Rect, {
    type: 'rect',

    initialize(props) {
      this.width = 50;
      this.height = 50;

      this.callSuper('initialize', props);
    }
  })
};
