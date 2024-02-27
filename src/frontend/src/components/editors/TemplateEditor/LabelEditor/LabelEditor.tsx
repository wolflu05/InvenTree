import { Button, Stack, createStyles } from '@mantine/core';
import Split from '@uiw/react-split';
import { fabric } from 'fabric';
import {
  FabricJSCanvas,
  FabricJSEditor,
  useFabricJSEditor
} from 'fabricjs-react';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';

import { useEvents } from '../../../../hooks/UseEvents';
import { EditorComponent } from '../TemplateEditor';
import { FooterPanel } from './panels/FooterPanel';
import { LeftPanel } from './panels/LeftPanel';
import { RightPanel } from './panels/RightPanel';

const useStyles = createStyles((theme) => ({
  editorCanvas: {
    border: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    flex: 1
  }
}));

export type LabelEditorContextType = {
  editor?: FabricJSEditor;
  objects: fabric.Object[];
  selectedObjects?: fabric.Object[];
  handleDrag: (clientX?: number, clientY?: number) => void;
  zoomToFit: () => void;
  pageWidth: number;
  pageHeight: number;
  template?: any;
};

export const LabelEditorContext = createContext<LabelEditorContextType | null>(
  null
);
export const useLabelEditorContext = () => {
  const ctx = useContext(LabelEditorContext);
  // if (!ctx) throw new Error("LabelEditorContext not found");
  return ctx || ({} as LabelEditorContextType);
};

export const LabelEditorComponentE: EditorComponent = forwardRef(
  (props, ref) => {
    const { template } = props as { template: any };

    const { classes } = useStyles();
    const [code, setCode] = useState('');
    const { editor, onReady } = useFabricJSEditor();
    const editorState = useRef({
      isDragging: false,
      lastPosX: 0,
      lastPosY: 0,
      pageElement: null as fabric.Object | null
    });

    const [pageWidth, pageHeight] = useMemo(
      () => [
        fabric.util.parseUnit(template?.width + 'mm') as number,
        fabric.util.parseUnit(template?.height + 'mm') as number
      ],
      [template?.width, template?.height]
    );

    const [objects, setObjects] = useState<fabric.Object[]>([]);
    const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

    useImperativeHandle(ref, () => ({
      setCode: (code) => setCode(code),
      getCode: () => code
    }));

    const SPACE_X = pageWidth / 2;
    const SPACE_Y = pageHeight / 2;
    const handleDrag = (clientX?: number, clientY?: number) => {
      if (!editor) return;
      const vpt = editor.canvas.viewportTransform;
      const zoom = editor.canvas.getZoom();
      const [canvasWidth, canvasHeight] = [
        editor.canvas.getWidth(),
        editor.canvas.getHeight()
      ];
      if (vpt) {
        // limit x panning to page width
        if (zoom < canvasWidth / pageWidth) {
          vpt[4] = canvasWidth / 2 - (pageWidth * zoom) / 2;
        } else {
          if (clientX) {
            vpt[4] += clientX - editorState.current.lastPosX;
          }
          if (vpt[4] >= SPACE_X * zoom) {
            vpt[4] = SPACE_X * zoom;
          } else if (vpt[4] < canvasWidth - pageWidth * zoom - SPACE_X * zoom) {
            vpt[4] = canvasWidth - pageWidth * zoom - SPACE_X * zoom;
          }
        }

        // limit y panning to page height
        if (zoom < canvasHeight / pageHeight) {
          vpt[5] = canvasHeight / 2 - (pageHeight * zoom) / 2;
        } else {
          if (clientY) {
            vpt[5] += clientY - editorState.current.lastPosY;
          }
          if (vpt[5] >= SPACE_Y * zoom) {
            vpt[5] = SPACE_Y * zoom;
          } else if (
            vpt[5] <
            canvasHeight - pageHeight * zoom - SPACE_Y * zoom
          ) {
            vpt[5] = canvasHeight - pageHeight * zoom - SPACE_Y * zoom;
          }
        }
      }
    };

    const zoomToFit = () => {
      if (!editor) return;
      const [width, height] = [
        editor.canvas.getWidth(),
        editor.canvas.getHeight()
      ];

      const minZoom = Math.min(
        width / (pageWidth + 10),
        height / (pageHeight + 10)
      );

      editor.canvas.zoomToPoint({ x: width / 2, y: height / 2 }, minZoom);
    };

    useEvents(
      editor?.canvas,
      (on) => {
        if (!editor) return;

        editor.canvas.fireMiddleClick = true;

        on('mouse:wheel', (event) => {
          const delta = event.e.deltaY;
          const zoom = editor.canvas.getZoom();
          let new_zoom = zoom + delta / 200;

          let minZoom = Math.min(
            editor.canvas.getWidth() / (pageWidth + SPACE_X * zoom),
            editor.canvas.getHeight() / (pageHeight + SPACE_Y * zoom),
            0.5
          );

          if (new_zoom > 20) new_zoom = 20;
          if (new_zoom < minZoom) new_zoom = minZoom;
          editor.canvas.zoomToPoint(
            { x: event.e.offsetX, y: event.e.offsetY },
            new_zoom
          );
          event.e.preventDefault();
          event.e.stopPropagation();
          handleDrag();
        });

        on('mouse:down', (event) => {
          if (event.e.altKey === true || event.e.button === 1) {
            editorState.current.isDragging = true;
            editorState.current.lastPosX = event.e.clientX;
            editorState.current.lastPosY = event.e.clientY;
            editor.canvas.selection = false;
          }
        });

        on('mouse:move', (event) => {
          if (editorState.current.isDragging) {
            handleDrag(event.e.clientX, event.e.clientY);
            editor.canvas.requestRenderAll();
            editorState.current.lastPosX = event.e.clientX;
            editorState.current.lastPosY = event.e.clientY;
          }
        });

        on('mouse:up', () => {
          editorState.current.isDragging = false;
          editor.canvas.selection = true;
          const vpt = editor.canvas.viewportTransform;
          if (vpt) {
            editor.canvas.setViewportTransform(vpt);
          }
        });

        on('object:added', (e) => {
          if (e.target === editorState.current.pageElement) return;
          setObjects((obj) => [...obj, e.target as fabric.Object]);
        });

        on('object:removed', (e) => {
          setObjects((obj) => obj.filter((o) => o !== e.target));
        });

        on('selection:cleared', (e) => {
          console.log('cleared', e);
          setSelectedObjects([]);
        });

        on('selection:created', (e) => {
          console.log('created', e.selected);
          setSelectedObjects(e.selected as fabric.Object[]);
        });

        on('selection:updated', (e) => {
          console.log('created', e.selected);
          setSelectedObjects(e.selected as fabric.Object[]);
        });
      },
      [editor, setSelectedObjects]
    );

    useEvents(
      window,
      (on) => {
        on('keyup', (event) => {
          if (event.key === 'Backspace' || event.key === 'Delete') {
            if (selectedObjects) {
              selectedObjects.forEach((object) => {
                editor?.canvas.remove(object);
              });
              editor?.canvas.discardActiveObject();
              editor?.canvas.renderAll();
            }
          }
        });
      },
      [editor]
    );

    // add page element
    useEffect(() => {
      if (!editor) return;
      if (editorState.current.pageElement) {
        editor.canvas.remove(editorState.current.pageElement);
      }

      const pageElement = new fabric.Rect({
        left: -0.5,
        top: -0.5,
        width: pageWidth + 1,
        height: pageHeight + 1,
        fill: 'rgba(0,0,0,0)',
        stroke: 'black',
        strokeWidth: 1,
        evented: false,
        selectable: false,
        hoverCursor: 'default'
      });

      editorState.current.pageElement = pageElement;
      editor.canvas.add(pageElement);

      handleDrag();
      zoomToFit();
    }, [editor, pageHeight, pageWidth]);

    // handle canvas resizing
    useEffect(() => {
      const outerContainer = editor?.canvas?.getElement?.()?.parentElement;
      if (!outerContainer) return;

      const onResize = () => {
        editor.canvas.setWidth(outerContainer.clientWidth);
        editor.canvas.setHeight(outerContainer.clientHeight);
        editor.canvas.renderAll();
        handleDrag();
        outerContainer.style.width = '100%';
      };

      outerContainer.style.width = '100%';

      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(outerContainer);

      return () => resizeObserver.unobserve(outerContainer);
    }, [editor]);

    // useMemo<LabelEditorContextType>(() => (
    const labelEditorContext = {
      editor,
      objects,
      selectedObjects,
      handleDrag,
      zoomToFit,
      pageWidth,
      pageHeight,
      template
    };
    // ), [editor, selectedObjects, handleDrag, zoomToFit, pageWidth, pageHeight, template]);
    console.log(selectedObjects);

    return (
      <LabelEditorContext.Provider value={labelEditorContext}>
        <Stack style={{ display: 'flex', flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'nowrap', flex: 1 }}>
            <LeftPanel />
            <Split style={{ flex: 1 }}>
              <FabricJSCanvas
                onReady={onReady}
                className={classes.editorCanvas}
              />
              <RightPanel />
            </Split>
          </div>
          <FooterPanel />
        </Stack>
      </LabelEditorContext.Provider>
    );
  }
);
