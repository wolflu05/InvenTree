import { t } from '@lingui/macro';
import { IconRectangleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';
import { LayoutPanelBlock } from './Rectangle.settings';
import { createFabricObject } from './_BaseObject';

export const Rectangle: LabelEditorObject = {
  key: 'rectangle',
  name: t`Rectangle`,
  icon: IconRectangleFilled,
  settingBlocks: [
    {
      key: 'layout',
      name: t`Layout`,
      component: LayoutPanelBlock
    }
  ],
  fabricElement: createFabricObject(fabric.Rect, {
    type: 'rectangle'
  })
};
