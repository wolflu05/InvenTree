import { t } from '@lingui/macro';
import {
  IconAngle,
  IconArrowsRightDown,
  IconBorderOuter,
  IconDimensions,
  IconPalette,
  IconTag
} from '@tabler/icons-react';
import { fabric } from 'fabric';
import { useEffect, useMemo } from 'react';

import { useEvents } from '../../../../../hooks/UseEvents';
import { useLabelEditorState } from '../LabelEditorContext';
import {
  InputGroup,
  UseInputGroupProps,
  unitInputGroupBlur,
  useInputGroupState
} from '../panels/Components';
import { pixelToUnit, unitToPixel } from '../utils';

type UseObjectInputGroupStateProps<T extends any[]> = {
  unitKey?: string;
  valueKeys?: string[];
  connectionUnitKey?: string;
  connections: {
    objAttr: string;
    inputKey: string;
  }[];
  triggerUpdateEvents?: fabric.EventName[];
} & UseInputGroupProps<T>;

export const useObjectInputGroupState = <T extends any[]>(
  props: UseObjectInputGroupStateProps<T>
) => {
  const [selectedObjects, editor] = useLabelEditorState((s) => [
    s.selectedObjects,
    s.editor
  ]);

  const onBlur = useMemo(() => {
    if (props.unitKey) {
      return unitInputGroupBlur({
        unitKey: props.unitKey,
        valueKeys: props.valueKeys || []
      });
    } else {
      return undefined;
    }
  }, [props.unitKey, props.valueKeys]);

  const inputState = useInputGroupState({
    ...props,
    onBlur,
    updateCanvas: (values) => {
      if (selectedObjects?.length !== 1) return;
      const obj = selectedObjects[0];

      for (const { objAttr, inputKey } of props.connections) {
        let value = values[inputKey];
        if (
          props.unitKey &&
          props.valueKeys &&
          props.valueKeys.includes(inputKey)
        ) {
          value = unitToPixel(value, values[props.unitKey]);
        }

        obj.set({ [objAttr]: value });
      }

      if (props.unitKey && props.connectionUnitKey) {
        // @ts-ignore-next-line
        obj[props.connectionUnitKey] = values[props.unitKey];
      }

      editor?.canvas.requestRenderAll();
    },
    updateInputs: (obj: fabric.Object) => {
      // @ts-ignore-next-line
      const unit = obj[props.connectionUnitKey];

      for (const { objAttr, inputKey } of props.connections) {
        // @ts-ignore-next-line
        let value = obj[objAttr];
        if (
          props.unitKey &&
          props.valueKeys &&
          props.valueKeys.includes(inputKey) &&
          unit
        ) {
          value = pixelToUnit(value || 0, unit);
        }

        inputState.setValue(inputKey, value);
      }

      if (props.unitKey && unit) {
        inputState.setValue(props.unitKey, unit);
      }
    }
  });

  useEvents(
    editor?.canvas,
    (on) => {
      for (const event of props.triggerUpdateEvents || []) {
        on(event, (e) => inputState.triggerUpdate(e.target as fabric.Object));
      }
    },
    [editor]
  );

  useEffect(() => {
    if (selectedObjects?.length === 1) {
      inputState.triggerUpdate(selectedObjects[0]);
    }
  }, [selectedObjects]);

  return inputState;
};

export const NameInputGroup = () => {
  const name = useObjectInputGroupState({
    name: t`Name`,
    icon: IconTag,
    connections: [{ objAttr: 'name', inputKey: 'name.name' }],
    inputRows: [
      {
        key: 'name',
        columns: [{ key: 'name', type: 'text' }]
      }
    ],
    triggerUpdateEvents: ['object:modified']
  });

  return <InputGroup state={name} />;
};

export const PositionInputGroup = () => {
  const position = useObjectInputGroupState({
    name: t`Position`,
    icon: IconArrowsRightDown,
    unitKey: 'position.unit',
    valueKeys: ['position.x', 'position.y'],
    connectionUnitKey: 'positionUnit',
    connections: [
      { objAttr: 'left', inputKey: 'position.x' },
      { objAttr: 'top', inputKey: 'position.y' }
    ],
    inputRows: [
      {
        key: 'position',
        columns: [
          { key: 'x', label: 'X', type: 'number' },
          { key: 'y', label: 'Y', type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      }
    ],
    triggerUpdateEvents: ['object:moving', 'object:added']
  });

  return <InputGroup state={position} />;
};

export const SizeInputGroup = () => {
  const size = useObjectInputGroupState({
    name: t`Size`,
    icon: IconDimensions,
    unitKey: 'size.unit',
    valueKeys: ['size.width', 'size.height'],
    connectionUnitKey: 'sizeUnit',
    connections: [
      { objAttr: 'width', inputKey: 'size.width' },
      { objAttr: 'height', inputKey: 'size.height' }
    ],
    inputRows: [
      {
        key: 'size',
        columns: [
          { key: 'width', label: t`Width`, type: 'number' },
          { key: 'height', label: t`Height`, type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      }
    ],
    triggerUpdateEvents: ['object:scaling', 'object:added']
  });

  return <InputGroup state={size} />;
};

export const AngleInputGroup = () => {
  const angle = useObjectInputGroupState({
    name: t`Angle`,
    icon: IconAngle,
    connections: [{ objAttr: 'angle', inputKey: 'angle.value' }],
    inputRows: [
      {
        key: 'angle',
        columns: [{ key: 'value', label: t`Angle [°]`, type: 'number' }]
      }
    ],
    triggerUpdateEvents: ['object:rotating', 'object:added']
  });

  return <InputGroup state={angle} />;
};

export const BackgroundColorInputGroup = () => {
  const backgroundColor = useObjectInputGroupState({
    name: t`Background Color`,
    icon: IconPalette,
    connections: [{ objAttr: 'fill', inputKey: 'backgroundColor.value' }],
    inputRows: [
      {
        key: 'backgroundColor',
        columns: [{ key: 'value', type: 'color' }]
      }
    ],
    triggerUpdateEvents: ['object:modified']
  });

  return <InputGroup state={backgroundColor} />;
};

export const BorderStyleInputGroup = () => {
  const borderStyle = useObjectInputGroupState({
    name: t`Border Style`,
    icon: IconBorderOuter,
    unitKey: 'width.unit',
    valueKeys: ['width.value'],
    connectionUnitKey: 'strokeWidthUnit',
    connections: [
      { objAttr: 'stroke', inputKey: 'color.value' },
      { objAttr: 'strokeWidth', inputKey: 'width.value' }
    ],
    inputRows: [
      {
        key: 'color',
        columns: [{ key: 'value', type: 'color', defaultValue: '#000000' }]
      },
      {
        key: 'width',
        columns: [
          { key: 'value', type: 'number', label: t`Width`, defaultValue: 1 },
          { key: 'unit', template: 'unit' }
        ]
      }
    ],
    triggerUpdateEvents: ['object:modified']
  });

  return <InputGroup state={borderStyle} />;
};
