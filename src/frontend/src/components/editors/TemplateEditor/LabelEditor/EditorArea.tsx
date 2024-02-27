import { createStyles } from '@mantine/core';
import { fabric } from 'fabric';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { useCallback, useEffect, useRef } from 'react';

import { useEvents } from '../../../../hooks/UseEvents';
import { useLabelEditorState, useLabelEditorStore } from './LabelEditorContext';

const useStyles = createStyles((theme) => ({
  editorCanvas: {
    border: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    flex: 1
  }
}));

export const EditorArea = () => {
  const { classes } = useStyles();

  const { editor, onReady } = useFabricJSEditor();
  const editorState = useRef({
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0,
    pageElement: null as fabric.Object | null
  });

  const { pageWidth, pageHeight } = useLabelEditorState((s) => ({
    pageWidth: s.pageWidth,
    pageHeight: s.pageHeight
  }));
  const labelEditorStore = useLabelEditorStore();

  const handleDrag = useCallback(
    (clientX?: number, clientY?: number) => {
      if (!editor) return;
      const SPACE_X = labelEditorStore.getState().pageWidth / 2;
      const SPACE_Y = labelEditorStore.getState().pageHeight / 2;
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
    },
    [editor]
  );

  const zoomToFit = useCallback(() => {
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
  }, [editor]);

  useEffect(() => {
    labelEditorStore.setState({ handleDrag, zoomToFit });
  }, [handleDrag, zoomToFit]);

  useEvents(
    editor?.canvas,
    (on) => {
      if (!editor) return;

      editor.canvas.fireMiddleClick = true;

      on('mouse:wheel', (event) => {
        const delta = event.e.deltaY;
        const zoom = editor.canvas.getZoom();
        let new_zoom = zoom + delta / 200;

        const SPACE_X = labelEditorStore.getState().pageWidth / 2;
        const SPACE_Y = labelEditorStore.getState().pageHeight / 2;
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
        labelEditorStore.setState((s) => ({
          objects: [...s.objects, e.target as fabric.Object]
        }));
      });

      on('object:removed', (e) => {
        labelEditorStore.setState((s) => ({
          objects: s.objects.filter((o) => o !== e.target)
        }));
      });

      on('selection:cleared', (e) => {
        labelEditorStore.setState({ selectedObjects: [] });
      });

      on('selection:created', (e) => {
        labelEditorStore.setState({
          selectedObjects: e.selected as fabric.Object[]
        });
      });

      on('selection:updated', (e) => {
        labelEditorStore.setState({
          selectedObjects: e.selected as fabric.Object[]
        });
      });

      on('object:scaling', (e) => {
        const obj = e.target as fabric.Object;

        // change width and height instead of scaling the object
        obj.set({
          height: obj.height! * obj.scaleY!,
          width: obj.width! * obj.scaleX!,
          scaleX: 1,
          scaleY: 1,
          noScaleCache: false
        });
      });
    },
    [editor]
  );

  useEvents(
    window,
    (on) => {
      on('keyup', (event) => {
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const selectedObjects = labelEditorStore.getState().selectedObjects;
          if (selectedObjects) {
            selectedObjects.forEach((object: any) => {
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

    const strokeWidth = 0.2;

    const pageElement = new fabric.Rect({
      left: -(strokeWidth / 2),
      top: -(strokeWidth / 2),
      width: pageWidth + strokeWidth,
      height: pageHeight + strokeWidth,
      fill: 'rgba(0,0,0,0)',
      stroke: 'black',
      strokeWidth: strokeWidth,
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

  useEffect(() => {
    if (!editor) return;
    labelEditorStore.setState({ editor });
  }, [editor]);

  return <FabricJSCanvas onReady={onReady} className={classes.editorCanvas} />;
};
