import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { createImageGalleryMachine } from "./image-gallery.state";
import type { ImageItem } from "./image-gallery";
import type { UnsplashPhoto } from "./image-gallery.utils";

const mockImage: ImageItem = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Test Image",
};

const mockUnsplashPhoto: UnsplashPhoto = {
  id: "photo-1",
  urls: {
    regular: "https://example.com/regular.jpg",
    small: "https://example.com/small.jpg",
    thumb: "https://example.com/thumb.jpg",
  },
  alt_description: "Test photo",
  description: "Test description",
  user: {
    name: "Test User",
  },
};

describe("ImageGalleryMachine", () => {
  it("should start in idle state", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.images).toEqual([]);
  });

  it("should transition to selected state when image is clicked", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "IMAGE_CLICKED", image: mockImage });

    expect(actor.getSnapshot().value).toBe("selected");
  });

  it("should transition back to idle when image is clicked again", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "IMAGE_CLICKED", image: mockImage });
    expect(actor.getSnapshot().value).toBe("selected");

    actor.send({ type: "IMAGE_CLICKED", image: mockImage });
    expect(actor.getSnapshot().value).toBe("idle");
  });

  it("should add images", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_IMAGES", images: [mockImage] });

    expect(actor.getSnapshot().context.images).toHaveLength(1);
    expect(actor.getSnapshot().context.images[0]).toEqual(mockImage);
  });

  it("should remove an image", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "SET_IMAGES", images: [mockImage] });
    actor.send({ type: "REMOVE_IMAGE", imageId: mockImage.id });

    expect(actor.getSnapshot().context.images).toHaveLength(0);
  });

  it("should update an image", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "SET_IMAGES", images: [mockImage] });
    actor.send({
      type: "UPDATE_IMAGE",
      imageId: mockImage.id,
      updates: { caption: "New Caption" },
    });

    expect(actor.getSnapshot().context.images[0].caption).toBe("New Caption");
  });

  it("should transition to uploading state", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });

    expect(actor.getSnapshot().value).toBe("uploading");
    expect(actor.getSnapshot().context.uploading).toBe(true);
  });

  it("should handle upload success", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_SUCCESS" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.uploading).toBe(false);
    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should handle upload error", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_ERROR", error: "Upload failed" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.uploading).toBe(false);
    expect(actor.getSnapshot().context.error).toBe("Upload failed");
  });

  it("should transition to loadingUnsplash state", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });

    expect(actor.getSnapshot().value).toBe("loadingUnsplash");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(true);
  });

  it("should handle Unsplash load success", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });
    actor.send({ type: "LOAD_UNSPLASH_SUCCESS" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(false);
    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should handle Unsplash load error", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });
    actor.send({ type: "LOAD_UNSPLASH_ERROR", error: "Load failed" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(false);
    expect(actor.getSnapshot().context.error).toBe("Load failed");
  });

  it("should clear error", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_ERROR", error: "Upload failed" });
    actor.send({ type: "CLEAR_ERROR" });

    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should set images", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "SET_IMAGES", images: [mockImage] });

    expect(actor.getSnapshot().context.images).toHaveLength(1);
    expect(actor.getSnapshot().context.images[0]).toEqual(mockImage);
  });

  describe("Unsplash search state", () => {
    it("should initialize with empty Unsplash state", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      expect(actor.getSnapshot().context.unsplashQuery).toBe("");
      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(false);
      expect(actor.getSnapshot().context.unsplashResults).toEqual([]);
      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(0);
    });

    it("should set Unsplash query", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({ type: "SET_UNSPLASH_QUERY", query: "nature" });

      expect(actor.getSnapshot().context.unsplashQuery).toBe("nature");
    });

    it("should toggle Unsplash search visibility", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(false);

      actor.send({ type: "TOGGLE_UNSPLASH_SEARCH" });

      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(true);

      actor.send({ type: "TOGGLE_UNSPLASH_SEARCH" });

      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(false);
    });

    it("should clear Unsplash state when closing search", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({ type: "TOGGLE_UNSPLASH_SEARCH" });
      actor.send({ type: "SET_UNSPLASH_QUERY", query: "nature" });
      actor.send({
        type: "SET_UNSPLASH_RESULTS",
        results: [mockUnsplashPhoto],
      });
      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-1" });

      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(true);
      expect(actor.getSnapshot().context.unsplashQuery).toBe("nature");

      actor.send({ type: "TOGGLE_UNSPLASH_SEARCH" });

      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(false);
      expect(actor.getSnapshot().context.unsplashQuery).toBe("");
      expect(actor.getSnapshot().context.unsplashResults).toEqual([]);
      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(0);
    });

    it("should set Unsplash results", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "SET_UNSPLASH_RESULTS",
        results: [mockUnsplashPhoto],
      });

      expect(actor.getSnapshot().context.unsplashResults).toHaveLength(1);
      expect(actor.getSnapshot().context.unsplashResults[0]).toEqual(
        mockUnsplashPhoto
      );
      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(0);
    });

    it("should toggle image selection", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-1" });

      expect(actor.getSnapshot().context.selectedImageIds.has("photo-1")).toBe(
        true
      );

      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-1" });

      expect(actor.getSnapshot().context.selectedImageIds.has("photo-1")).toBe(
        false
      );
    });

    it("should clear image selection", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-1" });
      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-2" });

      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(2);

      actor.send({ type: "CLEAR_IMAGE_SELECTION" });

      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(0);
    });

    it("should reset Unsplash search", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({ type: "SET_UNSPLASH_QUERY", query: "nature" });
      actor.send({
        type: "SET_UNSPLASH_RESULTS",
        results: [mockUnsplashPhoto],
      });
      actor.send({ type: "TOGGLE_IMAGE_SELECTION", imageId: "photo-1" });
      actor.send({ type: "TOGGLE_UNSPLASH_SEARCH" });

      actor.send({ type: "RESET_UNSPLASH_SEARCH" });

      expect(actor.getSnapshot().context.unsplashQuery).toBe("");
      expect(actor.getSnapshot().context.unsplashResults).toEqual([]);
      expect(actor.getSnapshot().context.selectedImageIds.size).toBe(0);
      expect(actor.getSnapshot().context.showUnsplashSearch).toBe(false);
    });
  });

  describe("Upload preview state", () => {
    it("should initialize with empty upload state", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      expect(actor.getSnapshot().context.uploadedPreviews).toEqual([]);
      expect(actor.getSnapshot().context.selectedUploadIds.size).toBe(0);
      expect(actor.getSnapshot().context.showUploadPreview).toBe(false);
    });

    it("should set uploaded previews", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "SET_UPLOADED_PREVIEWS",
        previews: [mockImage],
      });

      expect(actor.getSnapshot().context.uploadedPreviews).toHaveLength(1);
      expect(actor.getSnapshot().context.uploadedPreviews[0]).toEqual(
        mockImage
      );
      expect(actor.getSnapshot().context.showUploadPreview).toBe(true);
      expect(
        actor.getSnapshot().context.selectedUploadIds.has(mockImage.id)
      ).toBe(true);
    });

    it("should toggle upload selection", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "SET_UPLOADED_PREVIEWS",
        previews: [mockImage],
      });

      expect(
        actor.getSnapshot().context.selectedUploadIds.has(mockImage.id)
      ).toBe(true);

      actor.send({ type: "TOGGLE_UPLOAD_SELECTION", imageId: mockImage.id });

      expect(
        actor.getSnapshot().context.selectedUploadIds.has(mockImage.id)
      ).toBe(false);
    });

    it("should clear upload selection", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      const image2: ImageItem = { ...mockImage, id: "2" };
      actor.send({
        type: "SET_UPLOADED_PREVIEWS",
        previews: [mockImage, image2],
      });

      expect(actor.getSnapshot().context.selectedUploadIds.size).toBe(2);

      actor.send({ type: "CLEAR_UPLOAD_SELECTION" });

      expect(actor.getSnapshot().context.selectedUploadIds.size).toBe(0);
    });

    it("should close upload preview", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "SET_UPLOADED_PREVIEWS",
        previews: [mockImage],
      });

      expect(actor.getSnapshot().context.showUploadPreview).toBe(true);

      actor.send({ type: "CLOSE_UPLOAD_PREVIEW" });

      expect(actor.getSnapshot().context.showUploadPreview).toBe(false);
      expect(actor.getSnapshot().context.uploadedPreviews).toEqual([]);
      expect(actor.getSnapshot().context.selectedUploadIds.size).toBe(0);
    });
  });

  describe("Caption editing state", () => {
    it("should initialize with empty caption editing state", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      expect(actor.getSnapshot().context.editingCaption).toBeNull();
      expect(actor.getSnapshot().context.captionValue).toBe("");
    });

    it("should start editing caption", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "START_EDIT_CAPTION",
        imageId: "1",
        currentCaption: "Existing caption",
      });

      expect(actor.getSnapshot().context.editingCaption).toEqual({
        imageId: "1",
      });
      expect(actor.getSnapshot().context.captionValue).toBe("Existing caption");
    });

    it("should start editing caption with empty current caption", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "START_EDIT_CAPTION",
        imageId: "1",
        currentCaption: undefined,
      });

      expect(actor.getSnapshot().context.editingCaption).toEqual({
        imageId: "1",
      });
      expect(actor.getSnapshot().context.captionValue).toBe("");
    });

    it("should update caption value", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "START_EDIT_CAPTION",
        imageId: "1",
        currentCaption: "Old",
      });

      actor.send({ type: "UPDATE_CAPTION_VALUE", value: "New caption" });

      expect(actor.getSnapshot().context.captionValue).toBe("New caption");
    });

    it("should cancel editing caption", () => {
      const machine = createImageGalleryMachine("test");
      const actor = createActor(machine).start();

      actor.send({
        type: "START_EDIT_CAPTION",
        imageId: "1",
        currentCaption: "Old",
      });
      actor.send({ type: "UPDATE_CAPTION_VALUE", value: "New" });

      actor.send({ type: "CANCEL_EDIT_CAPTION" });

      expect(actor.getSnapshot().context.editingCaption).toBeNull();
      expect(actor.getSnapshot().context.captionValue).toBe("");
    });
  });
});
