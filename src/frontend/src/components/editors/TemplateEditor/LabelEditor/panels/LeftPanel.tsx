import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import { useCallback } from 'react';

import {
  useLabelEditorState,
  useLabelEditorStore
} from '../LabelEditorContext';
import { LabelEditorObject, LabelEditorObjects } from '../objects';

export function LeftPanel() {
  const editor = useLabelEditorState((s) => s.editor);
  const labelEditorStore = useLabelEditorStore();

  const addComponent = useCallback(
    (component: LabelEditorObject) => () => {
      if (!editor) return;

      const state = labelEditorStore.getState();
      const obj = new component.fabricElement({
        left: 10,
        top: 10,
        state
      });

      editor.canvas.add(obj);
      editor.canvas.setActiveObject(obj);
      state.setRightPanel?.('object-options');
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
