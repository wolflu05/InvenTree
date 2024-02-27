import { fabric } from 'fabric';
import { FabricJSEditor } from 'fabricjs-react';
import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';

export type LabelEditorState = {
  editor?: FabricJSEditor;
  objects: fabric.Object[];
  selectedObjects: fabric.Object[];
  handleDrag?: (clientX?: number, clientY?: number) => void;
  zoomToFit?: () => void;
  pageWidth: number;
  pageHeight: number;
  template: Record<string, any>;
};
type LabelEditorStateInitProps = Pick<LabelEditorState, 'template'>;

export type LabelEditorStore = ReturnType<typeof createLabelEditorStore>;

export const createLabelEditorStore = (
  initState: LabelEditorStateInitProps
) => {
  return createStore<LabelEditorState>()((set) => ({
    ...initState,
    pageWidth: 0,
    pageHeight: 0,
    objects: [],
    selectedObjects: []
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
