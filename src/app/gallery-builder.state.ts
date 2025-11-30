import { createMachine, assign } from "xstate";
import type { ImageItem, ImageGalleryLayout } from "@/components/image-gallery";

export type GalleryWidget = {
  id: string;
  images: ImageItem[];
  layout: ImageGalleryLayout;
  title?: string;
};

type GalleryBuilderContext = {
  galleries: GalleryWidget[];
  uploading: boolean;
  loadingFromUnsplash: boolean;
  error: string | null;
};

type GalleryBuilderEvent =
  | { type: "ADD_GALLERY"; images?: ImageItem[] }
  | { type: "REMOVE_GALLERY"; galleryId: string }
  | {
      type: "UPDATE_GALLERY";
      galleryId: string;
      updates: Partial<GalleryWidget>;
    }
  | { type: "ADD_IMAGES"; galleryId: string; images: ImageItem[] }
  | { type: "REMOVE_IMAGE"; galleryId: string; imageId: string | number }
  | {
      type: "UPDATE_IMAGE";
      galleryId: string;
      imageId: string | number;
      updates: Partial<ImageItem>;
    }
  | { type: "UPLOAD_IMAGES_START" }
  | { type: "UPLOAD_IMAGES_SUCCESS"; images: ImageItem[] }
  | { type: "UPLOAD_IMAGES_ERROR"; error: string }
  | { type: "LOAD_UNSPLASH_START" }
  | { type: "LOAD_UNSPLASH_SUCCESS"; images: ImageItem[] }
  | { type: "LOAD_UNSPLASH_ERROR"; error: string }
  | { type: "CLEAR_ERROR" };

export const createGalleryBuilderMachine = (uniqueId: string) =>
  createMachine({
    id: `galleryBuilder-${uniqueId}`,
    initial: "idle",
    context: {
      galleries: [],
      uploading: false,
      loadingFromUnsplash: false,
      error: null,
    } as GalleryBuilderContext,
    states: {
      idle: {
        on: {
          ADD_GALLERY: {
            actions: assign({
              galleries: ({ context, event }) => {
                const newGallery: GalleryWidget = {
                  id: `gallery-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  images: event.images || [],
                  layout: "horizontal",
                  title: `Gallery ${context.galleries.length + 1}`,
                };
                return [...context.galleries, newGallery];
              },
            }),
          },
          REMOVE_GALLERY: {
            actions: assign({
              galleries: ({ context, event }) =>
                context.galleries.filter((g) => g.id !== event.galleryId),
            }),
          },
          UPDATE_GALLERY: {
            actions: assign({
              galleries: ({ context, event }) =>
                context.galleries.map((g) =>
                  g.id === event.galleryId ? { ...g, ...event.updates } : g
                ),
            }),
          },
          ADD_IMAGES: {
            actions: assign({
              galleries: ({ context, event }) =>
                context.galleries.map((g) =>
                  g.id === event.galleryId
                    ? { ...g, images: [...g.images, ...event.images] }
                    : g
                ),
            }),
          },
          REMOVE_IMAGE: {
            actions: assign({
              galleries: ({ context, event }) =>
                context.galleries.map((g) =>
                  g.id === event.galleryId
                    ? {
                        ...g,
                        images: g.images.filter(
                          (img) => img.id !== event.imageId
                        ),
                      }
                    : g
                ),
            }),
          },
          UPDATE_IMAGE: {
            actions: assign({
              galleries: ({ context, event }) =>
                context.galleries.map((g) =>
                  g.id === event.galleryId
                    ? {
                        ...g,
                        images: g.images.map((img) =>
                          img.id === event.imageId
                            ? { ...img, ...event.updates }
                            : img
                        ),
                      }
                    : g
                ),
            }),
          },
          UPLOAD_IMAGES_START: {
            target: "uploading",
          },
          LOAD_UNSPLASH_START: {
            target: "loadingUnsplash",
          },
        },
      },
      uploading: {
        entry: assign({ uploading: true, error: null }),
        on: {
          UPLOAD_IMAGES_SUCCESS: {
            target: "idle",
            actions: assign({
              uploading: false,
              error: null,
            }),
          },
          UPLOAD_IMAGES_ERROR: {
            target: "idle",
            actions: assign({
              uploading: false,
              error: ({ event }) => event.error,
            }),
          },
        },
      },
      loadingUnsplash: {
        entry: assign({ loadingFromUnsplash: true, error: null }),
        on: {
          LOAD_UNSPLASH_SUCCESS: {
            target: "idle",
            actions: assign({
              loadingFromUnsplash: false,
              error: null,
            }),
          },
          LOAD_UNSPLASH_ERROR: {
            target: "idle",
            actions: assign({
              loadingFromUnsplash: false,
              error: ({ event }) => event.error,
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
