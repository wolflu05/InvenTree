import { t } from '@lingui/macro';
import { Stack } from '@mantine/core';
import Split from '@uiw/react-split';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

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
        if (!template) throw new Error(t`Error parsing template`);
        storeRef.current?.setState({ templateStr: template[1] });
      },
      getCode: () => {
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
          JSON.stringify(data),
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
        <Stack style={{ display: 'flex', flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'nowrap', flex: 1 }}>
            <LeftPanel />
            <Split style={{ flex: 1 }}>
              <EditorArea />
              <RightPanel />
            </Split>
          </div>
          <FooterPanel />
        </Stack>
      </LabelEditorContext.Provider>
    );
  }
);
