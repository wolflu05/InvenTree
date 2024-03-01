import { Trans, t } from '@lingui/macro';
import { Alert, Button, Group, Overlay, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import Split from '@uiw/react-split';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import { EditorComponent } from '../TemplateEditor';
import { EditorArea } from './EditorArea';
import {
  LabelEditorContext,
  LabelEditorStore,
  createLabelEditorStore
} from './LabelEditorContext';
import { LabelEditorObjectsMap } from './objects';
import { FooterPanel } from './panels/FooterPanel';
import { LeftPanel } from './panels/LeftPanel';
import { RightPanel } from './panels/RightPanel';
import { unitToPixel } from './utils';

export const LabelEditorComponentE: EditorComponent = forwardRef(
  (props, ref) => {
    const { template } = props as { template: any };
    const codeRef = useRef<string>();
    const [active, setActive] = useState<boolean>();

    const storeRef = useRef<LabelEditorStore>();
    if (!storeRef.current) {
      storeRef.current = createLabelEditorStore({
        template
      });
    }

    useEffect(() => {
      storeRef.current?.setState({
        pageWidth: unitToPixel(template?.width, 'mm'),
        pageHeight: unitToPixel(template?.height, 'mm')
      });
    }, [template?.width, template?.height]);

    useImperativeHandle(ref, () => ({
      setCode: (code) => {
        const template = code.match(
          /--- Start template ---\n(.+?)\n--- End template ---/s
        );
        if (!template) {
          codeRef.current = code;
          setActive(false);
          return;
        }
        codeRef.current = undefined;
        setActive(true);
        const restoreState = { templateStr: template[1] } as Record<
          string,
          any
        >;
        const data = JSON.parse(template[1]);
        if (data.pageSettings) {
          restoreState.pageSettings = data.pageSettings;
        }
        storeRef.current?.setState(restoreState);
      },
      getCode: () => {
        // label designer was never active
        if (codeRef.current) return codeRef.current;

        const s = storeRef.current?.getState();
        const data = s?.editor?.canvas?.toObject();
        if (!data) throw new Error(t`Error getting data from canvas`);

        const mapData = (
          objects: Record<string, any>[],
          blockName: 'style' | 'content'
        ) => {
          const code = objects
            .map((obj: Record<string, any>, idx) => {
              const generatorFunc =
                LabelEditorObjectsMap[obj.type]?.export?.[blockName];
              if (!generatorFunc) return '';

              return generatorFunc(obj, `${obj.type}-${idx}`);
            })
            .filter((x) => !!x)
            .join('\n');

          return `{% block ${blockName} %}\n${code}\n{% endblock %}\n`;
        };

        let templateStr = [
          '{% extends "label/label_base.html" %}',
          '{% comment %}',
          '==========================================================',
          '=== This template was generated by the Label Designer. ===',
          '=== DO NOT EDIT THIS TEMPLATE DIRECTLY.                ===',
          '==========================================================',
          '',
          '--- Start template ---',
          JSON.stringify({ ...data, pageSettings: s?.pageSettings }),
          '--- End template ---',
          '{% endcomment %}',
          '',
          '{% load l10n i18n barcode %}',
          '',
          mapData(data.objects, 'style'),
          mapData(data.objects, 'content')
        ].join('\n');

        return templateStr;
      }
    }));

    return (
      <LabelEditorContext.Provider value={storeRef.current}>
        <Stack style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', flexWrap: 'nowrap', flex: 1 }}>
            <LeftPanel />
            <Split style={{ flex: 1 }}>
              <EditorArea />
              <RightPanel />
            </Split>
          </div>
          <FooterPanel />
          {active === false && (
            <Overlay center>
              <Alert
                icon={<IconAlertTriangle size="1rem" />}
                title=""
                color="red"
                maw={400}
              >
                <Stack spacing="xs">
                  <Text>
                    <Trans>
                      This doesn't look like a valid label designer template,
                      are you sure you want to continue?
                    </Trans>
                  </Text>
                  <Text>
                    <Trans>THE COMPLETE TEMPLATE WILL BE LOST!</Trans>
                  </Text>
                  <Text>
                    <Trans>Consider going back to the code editor!</Trans>
                  </Text>
                </Stack>

                <Group position="right">
                  <Button
                    color="red"
                    mt={20}
                    uppercase
                    onClick={() => {
                      codeRef.current = undefined;
                      setActive(true);
                    }}
                  >
                    <Trans>Continue and delete</Trans>
                  </Button>
                </Group>
              </Alert>
            </Overlay>
          )}
        </Stack>
      </LabelEditorContext.Provider>
    );
  }
);
