import { t } from '@lingui/macro';
import { IconCircleFilled } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { LabelEditorObject } from '.';

export const Circle: LabelEditorObject = {
  key: 'circle',
  name: t`Circle`,
  icon: IconCircleFilled,
  settingBlocks: [
    {
      key: 'common',
      name: t`Common`,
      component: () => <div>Common circle</div>
    }
  ],
  fabricElement: fabric.util.createClass(fabric.Circle, {
    radius: 25
  })
};
