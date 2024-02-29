import { TablerIconsProps } from '@tabler/icons-react';
import { fabric } from 'fabric';

import { Circle } from './Circle';
import { Rectangle } from './Rectangle';

export type ObjectPanelBlock = (props: {}) => React.JSX.Element;

export type SettingBlock = {
  key: string;
  name: string;
  component: ObjectPanelBlock;
};

export type LabelEditorObject = {
  key: string;
  name: string;
  icon: (props: TablerIconsProps) => React.JSX.Element;
  settingBlocks: SettingBlock[];
  fabricElement: any;
  defaultOpen: string[];
  export: {
    style?: (object: Record<string, any>, id: string) => string;
    content?: (object: Record<string, any>, id: string) => string;
  };
};

export const LabelEditorObjects: LabelEditorObject[] = [Rectangle, Circle];

export const LabelEditorObjectsMap: Record<string, LabelEditorObject> =
  Object.fromEntries(LabelEditorObjects.map((object) => [object.key, object]));

// @ts-ignore
fabric.Custom = Object.fromEntries(
  Object.entries(LabelEditorObjectsMap).map(([key, value]) => [
    key[0].toUpperCase() + key.slice(1),
    value.fabricElement
  ])
);
