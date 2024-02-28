import { TablerIconsProps } from '@tabler/icons-react';

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
};

export const LabelEditorObjects: LabelEditorObject[] = [Rectangle, Circle];

export const LabelEditorObjectsMap: Record<string, LabelEditorObject> = {
  rect: Rectangle,
  circle: Circle
};
