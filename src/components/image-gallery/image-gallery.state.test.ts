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
});
