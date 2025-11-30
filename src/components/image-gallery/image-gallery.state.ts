import { createMachine } from "xstate";

export const createImageGalleryMachine = (uniqueId: string) =>
  createMachine({
    id: `imageGallery-${uniqueId}`,
    initial: "idle",
    states: {
      idle: {
        on: {
          IMAGE_CLICKED: "selected",
        },
      },
      selected: {
        on: {
          IMAGE_CLICKED: {
            target: "idle",
            actions: ["setSelectedImage"],
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
  });

export const imageGalleryMachine = createImageGalleryMachine("default");
