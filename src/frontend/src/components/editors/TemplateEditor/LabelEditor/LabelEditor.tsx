import { Stack } from '@mantine/core';
import Split from '@uiw/react-split';
import { fabric } from 'fabric';
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
import { FooterPanel } from './panels/FooterPanel';
import { LeftPanel } from './panels/LeftPanel';
import { RightPanel } from './panels/RightPanel';

export const LabelEditorComponentE: EditorComponent = forwardRef(
  (props, ref) => {
    const { template } = props as { template: any };
    const [code, setCode] = useState('');

    const storeRef = useRef<LabelEditorStore>();
    if (!storeRef.current) {
      storeRef.current = createLabelEditorStore({
        template
      });
    }

    useEffect(() => {
      storeRef.current?.setState({
        pageWidth: fabric.util.parseUnit(template?.width + 'mm') as number,
        pageHeight: fabric.util.parseUnit(template?.height + 'mm') as number
      });
    }, [template?.width, template?.height]);

    useImperativeHandle(ref, () => ({
      setCode: (code) => setCode(code),
      getCode: () => code
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
