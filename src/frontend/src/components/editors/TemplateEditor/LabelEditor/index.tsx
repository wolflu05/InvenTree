import { t } from '@lingui/macro';
import { IconPencilCode } from '@tabler/icons-react';

import { Editor } from '../TemplateEditor';
import { LabelEditorComponentE } from './LabelEditor';

export const LabelEditor: Editor = {
  key: 'label',
  name: t`Label Designer`,
  icon: IconPencilCode,
  component: LabelEditorComponentE
};
