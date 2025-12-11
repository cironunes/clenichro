import { createMachine, assign } from "xstate";
import type {
  ImageItem,
  ImageGalleryLayout,
  ImageGalleryMode,
} from "@/components/image-gallery";

export type ImageGalleryWidget = {
  id: string;
  type: "image-gallery";
  images: ImageItem[];
  layout: ImageGalleryLayout;
  title?: string;
  mode?: ImageGalleryMode;
};

export type Widget = ImageGalleryWidget;

export type Slide = {
  id: string;
  title?: string;
  widgets: Widget[];
};

type PresentationBuilderContext = {
  slides: Slide[];
  error: string | null;
  selectedSlideId: string | null;
  selectedWidgetId: string | null;
};

export const createPresentationBuilderMachine = (uniqueId: string) =>
  createMachine({
    id: `presentationBuilder-${uniqueId}`,
    initial: "idle",
    context: {
      slides: [],
      error: null,
      selectedSlideId: null,
      selectedWidgetId: null,
    } as PresentationBuilderContext,
    states: {
      idle: {
        on: {
          ADD_SLIDE: {
            actions: assign({
              slides: ({ context }) => {
                const newSlide: Slide = {
                  id: `slide-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  title: `Slide ${context.slides.length + 1}`,
                  widgets: [],
                };
                return [...context.slides, newSlide];
              },
            }),
          },
          REMOVE_SLIDE: {
            actions: assign({
              slides: ({ context, event }) =>
                context.slides.filter((s) => s.id !== event.slideId),
              selectedSlideId: ({ context, event }) =>
                context.selectedSlideId === event.slideId
                  ? null
                  : context.selectedSlideId,
            }),
          },
          UPDATE_SLIDE: {
            actions: assign({
              slides: ({ context, event }) =>
                context.slides.map((s) =>
                  s.id === event.slideId ? { ...s, ...event.updates } : s
                ),
            }),
          },
          ADD_WIDGET: {
            actions: assign({
              slides: ({ context, event }) => {
                if (event.widgetType === "image-gallery") {
                  const newWidget: ImageGalleryWidget = {
                    id: `widget-${Date.now()}-${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    type: "image-gallery",
                    images: event.widgetData?.images || [],
                    layout: event.widgetData?.layout || "horizontal",
                    title: event.widgetData?.title || "Image Gallery",
                    mode: "edit",
                  };
                  return context.slides.map((s) =>
                    s.id === event.slideId
                      ? { ...s, widgets: [...s.widgets, newWidget] }
                      : s
                  );
                }
                return context.slides;
              },
            }),
          },
          REMOVE_WIDGET: {
            actions: assign({
              slides: ({ context, event }) =>
                context.slides.map((s) =>
                  s.id === event.slideId
                    ? {
                        ...s,
                        widgets: s.widgets.filter(
                          (w) => w.id !== event.widgetId
                        ),
                      }
                    : s
                ),
              selectedWidgetId: ({ context, event }) =>
                context.selectedWidgetId === event.widgetId
                  ? null
                  : context.selectedWidgetId,
            }),
          },
          UPDATE_WIDGET: {
            actions: assign({
              slides: ({ context, event }) =>
                context.slides.map((s) =>
                  s.id === event.slideId
                    ? {
                        ...s,
                        widgets: s.widgets.map((w) =>
                          w.id === event.widgetId
                            ? { ...w, ...event.updates }
                            : w
                        ),
                      }
                    : s
                ),
            }),
          },
        },
      },
    },
    on: {
      CLEAR_ERROR: {
        actions: assign({ error: null }),
      },
    },
  });
