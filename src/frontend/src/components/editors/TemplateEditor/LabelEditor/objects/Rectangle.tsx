import { t } from '@lingui/macro';
import { Stack } from '@mantine/core';
import {
  IconDimensions,
  IconGrid4x4,
  IconRectangleFilled
} from '@tabler/icons-react';
import { IconArrowsRightDown } from '@tabler/icons-react';
import { fabric } from 'fabric';
import { useCallback, useEffect } from 'react';

import { LabelEditorObject, ObjectPanelBlock } from '.';
import { useEvents } from '../../../../../hooks/UseEvents';
import { useLabelEditorContext } from '../LabelEditor';
import { InputGroup, useInputGroupState } from '../panels/Components';
import { pixelToUnit, unitToPixel } from '../utils';

export const RectangleComponentPanelBlock: ObjectPanelBlock = ({}) => {
  const grid = useInputGroupState({
    name: t`Grid`,
    icon: IconGrid4x4,
    onChange: (key, value) => {
      console.log(key, value);
    },
    inputRows: [
      {
        key: 'grid',
        columns: [
          { key: 'size', label: t`Size`, type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      },
      {
        key: 'showGrid',
        columns: [{ key: 'showGrid', label: t`Show grid`, type: 'boolean' }]
      }
    ]
  });

  return (
    <Stack>
      <InputGroup state={grid} />
    </Stack>
  );
};

const PositionInputGroup = () => {
  const { selectedObjects, editor } = useLabelEditorContext();

  const position = useInputGroupState({
    name: t`Position`,
    icon: IconArrowsRightDown,
    onBlur: (_key, _value, values) => {
      if (selectedObjects?.length !== 1) return;
      selectedObjects[0].left = unitToPixel(
        values['position.x'],
        values['position.unit']
      );
      selectedObjects[0].top = unitToPixel(
        values['position.y'],
        values['position.unit']
      );
      // @ts-ignore-next-line
      selectedObjects[0].positionUnit = values['position.unit'];
      editor?.canvas.requestRenderAll();
    },
    inputRows: [
      {
        key: 'position',
        columns: [
          { key: 'x', label: t`X`, type: 'number' },
          { key: 'y', label: t`Y`, type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      }
    ]
  });

  const handler = useCallback((obj: fabric.Object) => {
    // @ts-ignore-next-line
    const unit = obj.positionUnit;
    position.setValue('position.x', pixelToUnit(obj.left || 0, unit));
    position.setValue('position.y', pixelToUnit(obj.top || 0, unit));
    position.setValue('position.unit', unit);
  }, []);

  useEvents(
    editor?.canvas,
    (on) => {
      on('object:moving', (e) => handler(e.target as fabric.Object));
      on('object:added', (e) => handler(e.target as fabric.Object));
    },
    [editor]
  );

  useEffect(() => {
    console.log(selectedObjects);
    if (selectedObjects?.length === 1) {
      handler(selectedObjects[0]);
    }
  }, [selectedObjects]);

  return <InputGroup state={position} />;
};

export const LayoutPanelBlock: ObjectPanelBlock = () => {
  const dimensions = useInputGroupState({
    name: t`Dimensions`,
    icon: IconDimensions,
    onChange: (key, value) => {
      console.log(key, value);
    },
    inputRows: [
      {
        key: 'dimensions',
        columns: [
          { key: 'width', label: t`Width`, type: 'number' },
          { key: 'height', label: t`Height`, type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      }
    ]
  });

  return (
    <Stack>
      <PositionInputGroup />
      <InputGroup state={dimensions} />
    </Stack>
  );
};

export const Rectangle: LabelEditorObject = {
  key: 'rectangle',
  name: t`Rectangle`,
  icon: IconRectangleFilled,
  settingBlocks: [
    {
      key: 'layout',
      name: t`Layout`,
      component: LayoutPanelBlock
    },
    {
      key: 'common1',
      name: t`Hello world`,
      component: RectangleComponentPanelBlock
    },
    {
      key: 'common2',
      name: t`ABCDEF`,
      component: RectangleComponentPanelBlock
    },
    {
      key: 'common3',
      name: t`ABCDEF`,
      component: RectangleComponentPanelBlock
    },
    {
      key: 'common4',
      name: t`ABCDEF`,
      component: RectangleComponentPanelBlock
    },
    {
      key: 'common5',
      name: t`ABCDEF`,
      component: RectangleComponentPanelBlock
    }
  ],
  fabricElement: fabric.util.createClass(fabric.Rect, {
    type: 'rectangle',
    positionUnit: 'mm'
  })
};
