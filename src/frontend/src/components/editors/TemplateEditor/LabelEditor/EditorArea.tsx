import { createStyles } from '@mantine/core';
import { fabric } from 'fabric';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { useCallback, useEffect, useRef } from 'react';

import { useEvents } from '../../../../hooks/UseEvents';
import {
  LabelEditorState,
  useLabelEditorState,
  useLabelEditorStore
} from './LabelEditorContext';
import { unitToPixel } from './utils';

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
    pageElement: null as fabric.Object | null,
    ignoreObjects: new Set<fabric.Object>()
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
      editor.canvas.uniScaleKey = 'altKey';

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
        if (editorState.current.ignoreObjects.has(e.target as fabric.Object))
          return;
        labelEditorStore.setState((s) => ({
          objects: [...s.objects, e.target as fabric.Object]
        }));
      });

      on('object:removed', (e) => {
        labelEditorStore.setState((s) => ({
          objects: s.objects.filter((o) => o !== e.target)
        }));
      });

      // handle selections
      const autoSwitchPanel = (e: fabric.IEvent<MouseEvent>) => {
        // check if selection was not set by the user
        if (e.e === undefined) return;
        const { setRightPanel, selectedObjects } = labelEditorStore.getState();

        if (selectedObjects.length === 0) {
          setRightPanel?.('document');
        } else if (
          selectedObjects.length !== 1 ||
          'group' in selectedObjects[0]
        ) {
          setRightPanel?.('objects');
        } else {
          setRightPanel?.('object-options');
        }
      };

      on('selection:cleared', (e) => {
        // clear selection after a small delay so that object options panel onBlur event can fire first
        setTimeout(() => {
          labelEditorStore.setState({ selectedObjects: [] });
          autoSwitchPanel(e);
        }, 1);
      });

      on('selection:created', (e) => {
        labelEditorStore.setState({
          selectedObjects: e.selected as fabric.Object[]
        });
        autoSwitchPanel(e);
      });

      on('selection:updated', (e) => {
        labelEditorStore.setState({
          selectedObjects: e.selected as fabric.Object[]
        });
        autoSwitchPanel(e);
      });

      // change width and height instead of scaling the object
      on('object:scaling', (e) => {
        const settings = labelEditorStore.getState().pageSettings;
        const obj = e.target as fabric.Object;
        const corner = e.transform?.corner;

        if (
          obj.left === undefined ||
          obj.width === undefined ||
          obj.scaleX === undefined ||
          obj.top === undefined ||
          obj.height === undefined ||
          obj.scaleY === undefined ||
          obj.strokeWidth === undefined ||
          corner === undefined
        )
          return;

        // if grid is enabled, snap to grid when resizing object
        // inspired by: https://stackoverflow.com/a/70673823
        if (settings.snap['grid.enable']) {
          const gridSize = unitToPixel(
            settings.grid['size.size'],
            settings.grid['size.unit']
          );

          const [width, height] = [obj.getScaledWidth(), obj.getScaledHeight()];

          const snapGrid = (n: number) => {
            return Math.round(n / gridSize) * gridSize;
          };

          // snap X axis
          if (['tl', 'ml', 'bl'].includes(corner)) {
            const tl = snapGrid(obj.left);
            obj.scaleX =
              (width + obj.left - tl) / (obj.width + obj.strokeWidth);
            obj.left = tl;
          } else if (['tr', 'mr', 'br'].includes(corner)) {
            const tl = snapGrid(obj.left + width);
            obj.scaleX = (tl - obj.left) / (obj.width + obj.strokeWidth);
          }

          // snap Y axis
          if (['tl', 'mt', 'tr'].includes(corner)) {
            const tt = snapGrid(obj.top);
            obj.scaleY =
              (height + obj.top - tt) / (obj.height + obj.strokeWidth);
            obj.top = tt;
          } else if (['bl', 'mb', 'br'].includes(corner)) {
            const tt = snapGrid(obj.top + height);
            obj.scaleY = (tt - obj.top) / (obj.height + obj.strokeWidth);
          }
        }

        obj.width = obj.width * obj.scaleX;
        obj.height = obj.height * obj.scaleY;
        obj.scaleX = 1;
        obj.scaleY = 1;
        obj.noScaleCache = false;
        obj.setCoords();
      });

      // snap to grid when moving object
      on('object:moving', (e) => {
        const settings = labelEditorStore.getState().pageSettings;
        if (!settings.snap['grid.enable']) return;
        const obj = e.target as fabric.Object;
        const gridSize = unitToPixel(
          settings.grid['size.size'],
          settings.grid['size.unit']
        );

        if (
          Math.round((obj.left! / gridSize) * 1) % 1 === 0 &&
          Math.round((obj.top! / gridSize) * 1) % 1 === 0
        ) {
          obj
            .set({
              left: Math.round(obj.left! / gridSize) * gridSize,
              top: Math.round(obj.top! / gridSize) * gridSize
            })
            .setCoords();
        }
      });

      // snap when rotating object
      on('object:rotating', (e) => {
        const snap = labelEditorStore.getState().pageSettings.snap;
        const obj = e.target as fabric.Object;
        if (snap['angle.enable']) {
          obj.snapAngle = e.e.altKey ? 0.1 : snap['angle.value'];
        } else {
          obj.snapAngle = e.e.altKey ? 45 : 0.1;
        }
      });
    },
    [editor]
  );

  // register keyboard shortcuts
  useEvents(
    window,
    (on) => {
      on('keyup', (event) => {
        // Do not trigger keyboard events when typing in input fields
        if (/INPUT|SELECT|TEXTAREA/i.test((event.target as any).tagName))
          return;

        // Delete selected objects
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const selectedObjects = labelEditorStore.getState().selectedObjects;
          if (selectedObjects) {
            selectedObjects.forEach((object: any) => {
              editor?.canvas.remove(object);
            });
            editor?.canvas.discardActiveObject();
            editor?.canvas.renderAll();
            labelEditorStore.getState().setRightPanel?.('document');
          }
        }
      });

      on('keydown', (event) => {
        // Do not trigger keyboard events when typing in input fields
        if (/INPUT|SELECT|TEXTAREA/i.test((event.target as any).tagName))
          return;

        // Move selected objects with arrow keys
        const move = (direction: [number, number]) => {
          const selectedObjects = labelEditorStore.getState().selectedObjects;
          if (!selectedObjects) return;
          const gridSettings = labelEditorStore.getState().pageSettings.grid;
          const gridSize = unitToPixel(
            gridSettings['size.size'],
            gridSettings['size.unit']
          );

          selectedObjects.forEach((object) => {
            object.set({
              left: object.left! + direction[0] * gridSize,
              top: object.top! + direction[1] * gridSize
            });
            object.setCoords();
            object.canvas?.fire('object:moving', { target: object });
          });
          editor?.canvas.renderAll();
        };

        const f = event.altKey ? 10 : 1;
        if (event.key === 'ArrowUp') move([0, -f]);
        if (event.key === 'ArrowDown') move([0, f]);
        if (event.key === 'ArrowLeft') move([-f, 0]);
        if (event.key === 'ArrowRight') move([f, 0]);
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
    editorState.current.ignoreObjects.add(pageElement);
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

  // render grid
  useEffect(() => {
    const setPageSettings = (s: LabelEditorState) => {
      if (!s.editor) return;

      if (s.pageSettings.scale['uniform.enable']) {
        s.editor.canvas.uniformScaling = true;
      } else {
        s.editor.canvas.uniformScaling = false;
      }
    };
    setPageSettings(labelEditorStore.getState());

    return labelEditorStore.subscribe((s, ps) => {
      if (
        Object.entries(s.pageSettings).some(
          ([k, v]) =>
            v !== ps.pageSettings[k as keyof LabelEditorState['pageSettings']]
        )
      ) {
        setPageSettings(s);
      }

      if (s.pageSettings === ps.pageSettings) return;
      const grid = s.pageSettings.grid;

      // TODO: draw grid if enabled
    });
  }, [editor]);

  // initialize editor in label editor store
  useEffect(() => {
    if (!editor) return;
    labelEditorStore.setState({ editor });
  }, [editor]);

  return <FabricJSCanvas onReady={onReady} className={classes.editorCanvas} />;
};
