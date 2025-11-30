import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { createImageGalleryMachine } from "./image-gallery.state";
import type { ImageItem } from "./image-gallery";

const mockImage: ImageItem = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Test Image",
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
});
