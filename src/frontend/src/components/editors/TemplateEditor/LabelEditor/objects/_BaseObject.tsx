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
  },
  customFields?: string[]
) => {
  const fields = [
    'positionUnit',
    'sizeUnit',
    'strokeWidthUnit',
    'name',
    ...(customFields || [])
  ];

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
    },

    toObject() {
      return this.callSuper('toObject', fields) as Record<string, any>;
    }
  });

  const cls = fabric.util.createClass(customBase, properties);

  cls.fromObject = function (
    o: Record<string, any>,
    callback: (obj: fabric.Object) => any
  ) {
    const obj = new cls(o);

    Object.entries(o).forEach(([key, value]) => {
      obj[key] = value;
    });

    callback(obj);
  };

  return cls;
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
