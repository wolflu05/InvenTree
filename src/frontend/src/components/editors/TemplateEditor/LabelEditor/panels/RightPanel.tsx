import { Trans, t } from '@lingui/macro';
import {
  Accordion,
  Container,
  Divider,
  List,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip
} from '@mantine/core';
import {
  IconDimensions,
  IconFileBarcode,
  IconGrid4x4,
  IconLayoutCards,
  IconStack2,
  TablerIconsProps
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

import { useLabelEditorState } from '../LabelEditorContext';
import { LabelEditorObjectsMap } from '../objects';
import { InputGroup, useInputGroupState } from './Components';

type RightPanelComponent = (props: {}) => JSX.Element;

type RightPanelNameComponent = (props: {}) => JSX.Element;

type RightPanelType = {
  key: string;
  name: string | RightPanelNameComponent;
  icon: (props: TablerIconsProps) => JSX.Element;
  panel: RightPanelComponent;
  header?: RightPanelComponent;
};

const DocumentRightPanel: RightPanelComponent = () => {
  const template = useLabelEditorState((s) => s.template);

  const dimensions = useInputGroupState({
    name: t`Dimensions`,
    icon: IconDimensions,
    inputRows: [
      {
        key: 'dimensions',
        columns: [
          {
            key: 'width',
            label: t`Width`,
            type: 'number',
            defaultValue: template?.width,
            disabled: true
          },
          {
            key: 'height',
            label: t`Height`,
            type: 'number',
            defaultValue: template?.height,
            disabled: true
          },
          { key: 'unit', template: 'unit', disabled: true }
        ]
      }
    ]
  });

  const grid = useInputGroupState({
    name: t`Grid`,
    icon: IconGrid4x4,
    onChange: (key, value) => {
      console.log(key, value);
    },
    inputRows: [
      {
        key: 'enable',
        columns: [{ key: 'enable', label: t`Enable grid`, type: 'boolean' }]
      },
      {
        key: 'show',
        columns: [{ key: 'show', label: t`Show grid`, type: 'boolean' }]
      },
      {
        key: 'size',
        columns: [
          { key: 'size', label: t`Size`, type: 'number' },
          { key: 'unit', template: 'unit' }
        ]
      },
      {
        key: 'dpi',
        columns: [
          {
            key: 'value',
            label: t`Dots per`,
            type: 'number'
          },
          {
            key: 'unit',
            label: t`Unit`,
            type: 'select',
            selectOptions: [
              { value: 'dpi', label: 'dpi' },
              { value: 'dpcm', label: 'dpcm' },
              { value: 'dpmm', label: 'dpmm' }
            ]
          }
        ]
      }
    ]
  });

  return (
    <Stack p={10}>
      <InputGroup state={dimensions} />
      <InputGroup state={grid} />
    </Stack>
  );
};

const ElementsRightPanel: RightPanelComponent = () => {
  const objects = useLabelEditorState((s) => s.objects);
  const editor = useLabelEditorState((s) => s.editor);
  const selectedObjects = useLabelEditorState((s) => s.selectedObjects);

  return (
    <Stack p={10}>
      <List withPadding>
        {objects.map((object, index) => (
          <List.Item key={index}>
            <Text
              onClick={() => {
                editor?.canvas.setActiveObject(object);
                editor?.canvas.renderAll();
              }}
              style={{
                cursor: 'pointer',
                fontWeight: selectedObjects?.includes(object) ? 600 : 400
              }}
            >
              {object.type} ({index})
            </Text>
          </List.Item>
        ))}
      </List>
    </Stack>
  );
};

const ObjectOptionsRightPanelName: RightPanelNameComponent = () => {
  const selectedObjects = useLabelEditorState((s) => s.selectedObjects);
  if (!selectedObjects) return <></>;

  if (selectedObjects.length === 0) {
    return <Trans>Object options</Trans>;
  }

  if (selectedObjects.length > 1 || 'group' in (selectedObjects[0] || {})) {
    return <Trans>Object options</Trans>;
  }

  const object = selectedObjects[0];
  const component = LabelEditorObjectsMap[object.type as string];

  return (
    <>
      {component.name} <Trans>options</Trans>
    </>
  );
};

const ObjectOptionsRightPanel: RightPanelComponent = () => {
  const selectedObjects = useLabelEditorState((s) => s.selectedObjects);
  const [activePanels, setActivePanels] = useState<string[]>([]);

  const component = useMemo(() => {
    if (selectedObjects?.length !== 1) return null;
    if ('group' in selectedObjects[0]) return null;

    const object = selectedObjects[0];
    return LabelEditorObjectsMap[object.type as string];
  }, [selectedObjects]);

  useEffect(() => {
    if (!component) return;
    setActivePanels([component.settingBlocks[0].key]);
  }, [component]);

  let error = null;
  if (!selectedObjects) return <></>;

  if (selectedObjects.length === 0) {
    error = <Trans>No objects selected</Trans>;
  }

  if (selectedObjects.length > 1 || 'group' in (selectedObjects[0] || {})) {
    error = (
      <Trans>Multiple objects selected, which is not supported currently</Trans>
    );
  }

  if (error || component === null) {
    return (
      <Container mt={10}>
        <Text italic>{error}</Text>
      </Container>
    );
  }

  return (
    <Stack>
      <Accordion
        value={activePanels}
        onChange={setActivePanels}
        styles={{
          control: {
            paddingLeft: 10
          },
          label: {
            paddingTop: '8px',
            paddingBottom: '8px',
            fontWeight: 600,
            fontSize: 18
          },
          content: {
            paddingLeft: 10,
            paddingRight: 10
          }
        }}
        multiple
      >
        {component.settingBlocks.map((block) => (
          <Accordion.Item key={block.key} value={block.key}>
            <Accordion.Control>{block.name}</Accordion.Control>
            <Accordion.Panel pb={10}>
              <block.component />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
};

const panels: RightPanelType[] = [
  {
    key: 'document',
    name: t`Document`,
    icon: IconFileBarcode,
    panel: DocumentRightPanel
  },
  {
    key: 'elements',
    name: t`Elements`,
    icon: IconStack2,
    panel: ElementsRightPanel
  },
  {
    key: 'object-options',
    name: ObjectOptionsRightPanelName,
    icon: IconLayoutCards,
    panel: ObjectOptionsRightPanel
  }
];

export function RightPanel() {
  const [activePanel, setActivePanel] = useState<null | string>(panels[0].key);

  return (
    <div style={{ width: '300px', minWidth: '300px', display: 'flex' }}>
      <Tabs
        orientation="vertical"
        value={activePanel}
        onTabChange={setActivePanel}
        placement="right"
        style={{ flex: 1, display: 'flex' }}
      >
        <Tabs.List>
          {panels.map((panel) => (
            <Tooltip
              label={
                typeof panel.name === 'function' ? <panel.name /> : panel.name
              }
              key={panel.key}
              position="left"
            >
              <Tabs.Tab
                key={panel.key}
                value={panel.key}
                icon={<panel.icon size="1.25rem" style={{ margin: '-4px' }} />}
              />
            </Tooltip>
          ))}
        </Tabs.List>

        {panels.map((panel) => (
          <Tabs.Panel
            key={panel.key}
            value={panel.key}
            style={
              activePanel === panel.key
                ? {
                    display: 'flex',
                    flex: '1',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%'
                  }
                : {}
            }
          >
            <Title order={3} pl={10} pt={7}>
              {typeof panel.name === 'function' ? <panel.name /> : panel.name}
            </Title>
            <Divider mt={2} />
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  overflowY: 'auto',
                  height: '100%',
                  width: '100%'
                }}
              >
                <panel.panel />
              </div>
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}
