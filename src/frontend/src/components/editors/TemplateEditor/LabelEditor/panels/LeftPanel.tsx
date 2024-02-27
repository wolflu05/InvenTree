import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import { useCallback } from 'react';

import { useLabelEditorContext } from '../LabelEditor';
import { LabelEditorObject, LabelEditorObjects } from '../objects';

export function LeftPanel() {
  const { editor } = useLabelEditorContext();

  const addComponent = useCallback(
    (component: LabelEditorObject) => () => {
      if (!editor) return;

      const obj = new component.fabricElement({
        left: 10,
        top: 10,
        width: 50,
        height: 50
      });

      editor.canvas.add(obj);
      editor.canvas.setActiveObject(obj);
    },
    [editor]
  );

  return (
    <Stack p={4}>
      {LabelEditorObjects.map((component) => (
        <Tooltip label={component.name} key={component.key} position="right">
          <ActionIcon onClick={addComponent(component)}>
            <component.icon size={'1.25rem'} />
          </ActionIcon>
        </Tooltip>
      ))}
    </Stack>
  );
}
