import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { createGalleryBuilderMachine } from "./gallery-builder.state";
import type { ImageItem } from "@/components/image-gallery";

const mockImage: ImageItem = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Test Image",
};

describe("GalleryBuilderMachine", () => {
  it("should start in idle state", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.galleries).toEqual([]);
  });

  it("should add a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY" });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries).toHaveLength(1);
    expect(snapshot.context.galleries[0].layout).toBe("horizontal");
    expect(snapshot.context.galleries[0].title).toMatch(/Gallery \d+/);
  });

  it("should add a gallery with initial images", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY", images: [mockImage] });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries).toHaveLength(1);
    expect(snapshot.context.galleries[0].images).toHaveLength(1);
    expect(snapshot.context.galleries[0].images[0]).toEqual(mockImage);
  });

  it("should remove a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY" });
    const galleryId = actor.getSnapshot().context.galleries[0].id;

    actor.send({ type: "REMOVE_GALLERY", galleryId });

    expect(actor.getSnapshot().context.galleries).toHaveLength(0);
  });

  it("should update a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY" });
    const galleryId = actor.getSnapshot().context.galleries[0].id;

    actor.send({
      type: "UPDATE_GALLERY",
      galleryId,
      updates: { layout: "vertical", title: "Updated Title" },
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries[0].layout).toBe("vertical");
    expect(snapshot.context.galleries[0].title).toBe("Updated Title");
  });

  it("should add images to a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY" });
    const galleryId = actor.getSnapshot().context.galleries[0].id;

    actor.send({
      type: "ADD_IMAGES",
      galleryId,
      images: [mockImage],
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries[0].images).toHaveLength(1);
    expect(snapshot.context.galleries[0].images[0]).toEqual(mockImage);
  });

  it("should remove an image from a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY", images: [mockImage] });
    const galleryId = actor.getSnapshot().context.galleries[0].id;

    actor.send({
      type: "REMOVE_IMAGE",
      galleryId,
      imageId: mockImage.id,
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries[0].images).toHaveLength(0);
  });

  it("should update an image in a gallery", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_GALLERY", images: [mockImage] });
    const galleryId = actor.getSnapshot().context.galleries[0].id;

    actor.send({
      type: "UPDATE_IMAGE",
      galleryId,
      imageId: mockImage.id,
      updates: { caption: "New Caption" },
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.galleries[0].images[0].caption).toBe("New Caption");
  });

  it("should transition to uploading state", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });

    expect(actor.getSnapshot().value).toBe("uploading");
    expect(actor.getSnapshot().context.uploading).toBe(true);
  });

  it("should handle upload success", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_SUCCESS", images: [mockImage] });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.uploading).toBe(false);
    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should handle upload error", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_ERROR", error: "Upload failed" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.uploading).toBe(false);
    expect(actor.getSnapshot().context.error).toBe("Upload failed");
  });

  it("should transition to loadingUnsplash state", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });

    expect(actor.getSnapshot().value).toBe("loadingUnsplash");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(true);
  });

  it("should handle Unsplash load success", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });
    actor.send({ type: "LOAD_UNSPLASH_SUCCESS", images: [] });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(false);
    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should handle Unsplash load error", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "LOAD_UNSPLASH_START" });
    actor.send({ type: "LOAD_UNSPLASH_ERROR", error: "Load failed" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.loadingFromUnsplash).toBe(false);
    expect(actor.getSnapshot().context.error).toBe("Load failed");
  });

  it("should clear error", () => {
    const machine = createGalleryBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "UPLOAD_IMAGES_START" });
    actor.send({ type: "UPLOAD_IMAGES_ERROR", error: "Upload failed" });
    actor.send({ type: "CLEAR_ERROR" });

    expect(actor.getSnapshot().context.error).toBeNull();
  });
});
