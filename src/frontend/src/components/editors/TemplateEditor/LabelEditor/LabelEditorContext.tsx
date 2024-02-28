import { fabric } from 'fabric';
import { FabricJSEditor } from 'fabricjs-react';
import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';

import { RightPanelKeyType } from './panels/RightPanel';

export type LabelEditorState = {
  editor?: FabricJSEditor;
  objects: fabric.Object[];
  selectedObjects: fabric.Object[];
  handleDrag?: (clientX?: number, clientY?: number) => void;
  zoomToFit?: () => void;
  setRightPanel?: (panel: RightPanelKeyType) => void;
  pageWidth: number;
  pageHeight: number;
  template: Record<string, any>;
  pageSettings: PageSettingsType;
};
type LabelEditorStateInitProps = Pick<LabelEditorState, 'template'>;

export type LabelEditorStore = ReturnType<typeof createLabelEditorStore>;

const defaultPageSettings = {
  grid: {
    'show.show': false,
    'size.size': 1 / 600,
    'size.unit': 'in',
    'dpi.value': 600
  },
  unit: {
    'length.unit': 'mm'
  },
  snap: {
    'grid.enable': true,
    'angle.enable': true,
    'angle.value': 45
  },
  scale: {
    'uniform.enable': true
  }
};
export type PageSettingsType = typeof defaultPageSettings;

export const createLabelEditorStore = (
  initState: LabelEditorStateInitProps
) => {
  return createStore<LabelEditorState>()((set) => ({
    ...initState,
    pageWidth: 0,
    pageHeight: 0,
    objects: [],
    selectedObjects: [],
    pageSettings: defaultPageSettings
  }));
};

export const LabelEditorContext = createContext<LabelEditorStore | null>(null);

export const useLabelEditorStore = () => {
  const store = useContext(LabelEditorContext);
  if (!store)
    throw new Error(
      'Missing LabelEditorContext.Provider in the component tree'
    );
  return store;
};

export const useLabelEditorState = <T extends unknown>(
  selector: (state: LabelEditorState) => T
): T => {
  const store = useLabelEditorStore();
  return useStore(store, selector);
};
