import { t } from '@lingui/macro';
import { IconCircleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';
import { GeneralSettingBlock, createFabricObject } from './_BaseObject';

export const Circle: LabelEditorObject = {
  key: 'circle',
  name: t`Circle`,
  icon: IconCircleFilled,
  defaultOpen: ['general', 'common'],
  settingBlocks: [
    GeneralSettingBlock,
    {
      key: 'common',
      name: t`Common`,
      component: () => <div>Common circle</div>
    }
  ],
  fabricElement: createFabricObject(fabric.Circle as any, {
    type: 'circle',
    radius: 25,
    width: 50,
    height: 50
  })
};
