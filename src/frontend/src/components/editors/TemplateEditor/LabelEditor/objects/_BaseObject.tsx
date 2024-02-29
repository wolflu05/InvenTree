import { t } from '@lingui/macro';
import { Stack } from '@mantine/core';
import { fabric } from 'fabric';

import { ObjectPanelBlock, SettingBlock } from '.';
import { LabelEditorState } from '../LabelEditorContext';
import { NameInputGroup } from './_InputGroups';

type InitializeProps = {
  left: number;
  top: number;
  state: LabelEditorState;
};

export const createFabricObject = (
  base: typeof fabric.Object,
  properties: Record<any, any> & {
    initialize?: (props: InitializeProps) => void;
  }
) => {
  const customBase = fabric.util.createClass(base, {
    positionUnit: 'mm',
    sizeUnit: 'mm',
    strokeWidth: 0,
    strokeWidthUnit: 'mm',

    initialize(props: InitializeProps) {
      this.positionUnit = props.state.pageSettings.unit['length.unit'];
      this.sizeUnit = props.state.pageSettings.unit['length.unit'];
      this.strokeWidthUnit = props.state.pageSettings.unit['length.unit'];
      this.callSuper('initialize', props);

      setTimeout(() => {
        let nextNum = 0;
        this.canvas.getObjects().forEach((obj: fabric.Object) => {
          if (obj.type === this.type) {
            // calculate the next free number for this element
            const num = (obj.name || '').match(/\((\d+)\)/);
            if (num) {
              nextNum = Math.max(nextNum, parseInt(num[1], 10) + 1);
            }
          }
        });

        this.name = `${this.type} (${nextNum})`;
        this.canvas.fire('object:modified', { target: this });
      }, 1);
    }
  });

  return fabric.util.createClass(customBase, properties);
};

const GeneralPanelBlock: ObjectPanelBlock = () => {
  return (
    <Stack>
      <NameInputGroup />
    </Stack>
  );
};

export const GeneralSettingBlock: SettingBlock = {
  key: 'general',
  name: t`General`,
  component: GeneralPanelBlock
};
