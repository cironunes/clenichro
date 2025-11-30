import { createMachine, assign } from "xstate";
import type { ImageItem } from "./image-gallery";

type ImageGalleryContext = {
  images: ImageItem[];
  uploading: boolean;
  loadingFromUnsplash: boolean;
  error: string | null;
};

export const createImageGalleryMachine = (uniqueId: string) =>
  createMachine({
    id: `imageGallery-${uniqueId}`,
    initial: "idle",
    context: {
      images: [],
      uploading: false,
      loadingFromUnsplash: false,
      error: null,
    } as ImageGalleryContext,
    states: {
      idle: {
        on: {
          IMAGE_CLICKED: "selected",
          ADD_IMAGES: {
            actions: assign({
              images: ({ context, event }) => [
                ...context.images,
                ...event.images,
              ],
            }),
          },
          REMOVE_IMAGE: {
            actions: assign({
              images: ({ context, event }) =>
                context.images.filter((img) => img.id !== event.imageId),
            }),
          },
          UPDATE_IMAGE: {
            actions: assign({
              images: ({ context, event }) =>
                context.images.map((img) =>
                  img.id === event.imageId ? { ...img, ...event.updates } : img
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
      selected: {
        on: {
          IMAGE_CLICKED: {
            target: "idle",
            actions: ["setSelectedImage"],
          },
          ADD_IMAGES: {
            actions: assign({
              images: ({ context, event }) => [
                ...context.images,
                ...event.images,
              ],
            }),
          },
          REMOVE_IMAGE: {
            actions: assign({
              images: ({ context, event }) =>
                context.images.filter((img) => img.id !== event.imageId),
            }),
          },
          UPDATE_IMAGE: {
            actions: assign({
              images: ({ context, event }) =>
                context.images.map((img) =>
                  img.id === event.imageId ? { ...img, ...event.updates } : img
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
      error: {
        on: {
          RETRY: "loading",
        },
      },
      loading: {
        on: {
          IMAGE_LOADED: "selected",
          IMAGE_ERROR: "error",
        },
      },
    },
    on: {
      CLEAR_ERROR: {
        actions: assign({ error: null }),
      },
      SET_IMAGES: {
        actions: assign({
          images: ({ event }) => event.images,
        }),
      },
    },
  });

export const imageGalleryMachine = createImageGalleryMachine("default");
