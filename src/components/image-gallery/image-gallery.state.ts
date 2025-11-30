import { createMachine, assign } from "xstate";
import type { ImageItem } from "./image-gallery";
import type { UnsplashPhoto } from "./image-gallery.utils";

type ImageGalleryContext = {
  images: ImageItem[];
  uploading: boolean;
  loadingFromUnsplash: boolean;
  error: string | null;
  unsplashQuery: string;
  showUnsplashSearch: boolean;
  unsplashResults: UnsplashPhoto[];
  selectedImageIds: Set<string>;
  uploadedPreviews: ImageItem[];
  selectedUploadIds: Set<string | number>;
  showUploadPreview: boolean;
  editingCaption: { imageId: string | number } | null;
  captionValue: string;
  slideshowIndex: number | null;
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
      unsplashQuery: "",
      showUnsplashSearch: false,
      unsplashResults: [],
      selectedImageIds: new Set(),
      uploadedPreviews: [],
      selectedUploadIds: new Set(),
      showUploadPreview: false,
      editingCaption: null,
      captionValue: "",
      slideshowIndex: null,
    } as ImageGalleryContext,
    states: {
      idle: {
        on: {
          IMAGE_CLICKED: [
            {
              target: "slideshow",
              guard: ({ event }) => event.enterSlideshow === true,
              actions: assign({
                slideshowIndex: ({ context, event }) => {
                  const index = context.images.findIndex(
                    (img) => img.id === event.image.id
                  );
                  return index >= 0 ? index : 0;
                },
              }),
            },
            {
              target: "selected",
            },
          ],
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
          SET_UNSPLASH_QUERY: {
            actions: assign({
              unsplashQuery: ({ event }) => event.query,
            }),
          },
          TOGGLE_UNSPLASH_SEARCH: {
            actions: assign({
              showUnsplashSearch: ({ context }) => !context.showUnsplashSearch,
              unsplashQuery: ({ context }) =>
                context.showUnsplashSearch ? "" : context.unsplashQuery,
              unsplashResults: ({ context }) =>
                context.showUnsplashSearch ? [] : context.unsplashResults,
              selectedImageIds: ({ context }) =>
                context.showUnsplashSearch
                  ? new Set()
                  : context.selectedImageIds,
            }),
          },
          SET_UNSPLASH_RESULTS: {
            actions: assign({
              unsplashResults: ({ event }) => event.results,
              selectedImageIds: () => new Set(),
            }),
          },
          TOGGLE_IMAGE_SELECTION: {
            actions: assign({
              selectedImageIds: ({ context, event }) => {
                const next = new Set(context.selectedImageIds);
                if (next.has(event.imageId)) {
                  next.delete(event.imageId);
                } else {
                  next.add(event.imageId);
                }
                return next;
              },
            }),
          },
          CLEAR_IMAGE_SELECTION: {
            actions: assign({
              selectedImageIds: () => new Set(),
            }),
          },
          SET_UPLOADED_PREVIEWS: {
            actions: assign({
              uploadedPreviews: ({ event }) => event.previews,
              selectedUploadIds: ({ event }) =>
                new Set(event.previews.map((img: ImageItem) => img.id)),
              showUploadPreview: () => true,
            }),
          },
          TOGGLE_UPLOAD_SELECTION: {
            actions: assign({
              selectedUploadIds: ({ context, event }) => {
                const next = new Set(context.selectedUploadIds);
                if (next.has(event.imageId)) {
                  next.delete(event.imageId);
                } else {
                  next.add(event.imageId);
                }
                return next;
              },
            }),
          },
          CLEAR_UPLOAD_SELECTION: {
            actions: assign({
              selectedUploadIds: () => new Set(),
            }),
          },
          CLOSE_UPLOAD_PREVIEW: {
            actions: assign({
              showUploadPreview: () => false,
              uploadedPreviews: () => [],
              selectedUploadIds: () => new Set(),
            }),
          },
          START_EDIT_CAPTION: {
            actions: assign({
              editingCaption: ({ event }) => ({ imageId: event.imageId }),
              captionValue: ({ event }) => event.currentCaption || "",
            }),
          },
          UPDATE_CAPTION_VALUE: {
            actions: assign({
              captionValue: ({ event }) => event.value,
            }),
          },
          CANCEL_EDIT_CAPTION: {
            actions: assign({
              editingCaption: () => null,
              captionValue: () => "",
            }),
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
          SET_UNSPLASH_QUERY: {
            actions: assign({
              unsplashQuery: ({ event }) => event.query,
            }),
          },
          TOGGLE_UNSPLASH_SEARCH: {
            actions: assign({
              showUnsplashSearch: ({ context }) => !context.showUnsplashSearch,
              unsplashQuery: ({ context }) =>
                context.showUnsplashSearch ? "" : context.unsplashQuery,
              unsplashResults: ({ context }) =>
                context.showUnsplashSearch ? [] : context.unsplashResults,
              selectedImageIds: ({ context }) =>
                context.showUnsplashSearch
                  ? new Set()
                  : context.selectedImageIds,
            }),
          },
          SET_UNSPLASH_RESULTS: {
            actions: assign({
              unsplashResults: ({ event }) => event.results,
              selectedImageIds: () => new Set(),
            }),
          },
          TOGGLE_IMAGE_SELECTION: {
            actions: assign({
              selectedImageIds: ({ context, event }) => {
                const next = new Set(context.selectedImageIds);
                if (next.has(event.imageId)) {
                  next.delete(event.imageId);
                } else {
                  next.add(event.imageId);
                }
                return next;
              },
            }),
          },
          CLEAR_IMAGE_SELECTION: {
            actions: assign({
              selectedImageIds: () => new Set(),
            }),
          },
          SET_UPLOADED_PREVIEWS: {
            actions: assign({
              uploadedPreviews: ({ event }) => event.previews,
              selectedUploadIds: ({ event }) =>
                new Set(event.previews.map((img: ImageItem) => img.id)),
              showUploadPreview: () => true,
            }),
          },
          TOGGLE_UPLOAD_SELECTION: {
            actions: assign({
              selectedUploadIds: ({ context, event }) => {
                const next = new Set(context.selectedUploadIds);
                if (next.has(event.imageId)) {
                  next.delete(event.imageId);
                } else {
                  next.add(event.imageId);
                }
                return next;
              },
            }),
          },
          CLEAR_UPLOAD_SELECTION: {
            actions: assign({
              selectedUploadIds: () => new Set(),
            }),
          },
          CLOSE_UPLOAD_PREVIEW: {
            actions: assign({
              showUploadPreview: () => false,
              uploadedPreviews: () => [],
              selectedUploadIds: () => new Set(),
            }),
          },
          START_EDIT_CAPTION: {
            actions: assign({
              editingCaption: ({ event }) => ({ imageId: event.imageId }),
              captionValue: ({ event }) => event.currentCaption || "",
            }),
          },
          UPDATE_CAPTION_VALUE: {
            actions: assign({
              captionValue: ({ event }) => event.value,
            }),
          },
          CANCEL_EDIT_CAPTION: {
            actions: assign({
              editingCaption: () => null,
              captionValue: () => "",
            }),
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
          SET_UPLOADED_PREVIEWS: {
            actions: assign({
              uploadedPreviews: ({ event }) => event.previews,
              selectedUploadIds: ({ event }) =>
                new Set(event.previews.map((img: ImageItem) => img.id)),
              showUploadPreview: () => true,
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
              unsplashResults: () => [],
            }),
          },
          SET_UNSPLASH_RESULTS: {
            actions: assign({
              unsplashResults: ({ event }) => event.results,
              selectedImageIds: () => new Set(),
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
      slideshow: {
        on: {
          CLOSE_SLIDESHOW: {
            target: "idle",
            actions: assign({
              slideshowIndex: () => null,
            }),
          },
          NEXT_IMAGE: {
            actions: assign({
              slideshowIndex: ({ context }) => {
                if (context.slideshowIndex === null) return 0;
                return (context.slideshowIndex + 1) % context.images.length;
              },
            }),
          },
          PREVIOUS_IMAGE: {
            actions: assign({
              slideshowIndex: ({ context }) => {
                if (context.slideshowIndex === null) return 0;
                return (
                  (context.slideshowIndex - 1 + context.images.length) %
                  context.images.length
                );
              },
            }),
          },
          GO_TO_IMAGE: {
            actions: assign({
              slideshowIndex: ({ event }) => event.index,
            }),
          },
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
      CLOSE_SLIDESHOW: {
        target: ".idle",
        actions: assign({
          slideshowIndex: () => null,
        }),
      },
      RESET_UNSPLASH_SEARCH: {
        actions: assign({
          unsplashQuery: () => "",
          unsplashResults: () => [],
          selectedImageIds: () => new Set(),
          showUnsplashSearch: () => false,
        }),
      },
      SET_UNSPLASH_RESULTS: {
        actions: assign({
          unsplashResults: ({ event }) => event.results,
          selectedImageIds: () => new Set(),
        }),
      },
      SET_UPLOADED_PREVIEWS: {
        actions: assign({
          uploadedPreviews: ({ event }) => event.previews,
          selectedUploadIds: ({ event }) =>
            new Set(event.previews.map((img: ImageItem) => img.id)),
          showUploadPreview: () => true,
        }),
      },
    },
  });

export const imageGalleryMachine = createImageGalleryMachine("default");
