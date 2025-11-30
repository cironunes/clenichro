import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createActor } from "xstate";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider, useImageGallery } from "./image-gallery.context";
import type { ImageItem } from "./image-gallery";

const mockImage: ImageItem = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Test Image",
};

const TestComponent = () => {
  const { state, send } = useImageGallery();

  return (
    <div>
      <div data-testid="state">{String(state.value)}</div>
      <button
        onClick={() => send({ type: "IMAGE_CLICKED", image: mockImage })}
        data-testid="click-image-button"
      >
        Click Image
      </button>
    </div>
  );
};

describe("ImageGalleryContext", () => {
  it("should provide image gallery context", () => {
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();
    const state = actor.getSnapshot();
    const send = actor.send.bind(actor);

    render(
      <ImageGalleryProvider state={state} send={send}>
        <TestComponent />
      </ImageGalleryProvider>
    );

    expect(screen.getByTestId("state")).toHaveTextContent("idle");
  });

  it("should allow sending events through context", async () => {
    const user = userEvent.setup();
    const machine = createImageGalleryMachine("test");
    const actor = createActor(machine).start();
    const state = actor.getSnapshot();
    const send = actor.send.bind(actor);

    render(
      <ImageGalleryProvider state={state} send={send}>
        <TestComponent />
      </ImageGalleryProvider>
    );

    const clickButton = screen.getByTestId("click-image-button");
    await user.click(clickButton);

    expect(actor.getSnapshot().value).toBe("selected");
  });

  it("should throw error when used outside provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      render(<TestComponent />);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain(
        "useImageGallery must be used within an ImageGalleryProvider"
      );
    }

    consoleError.mockRestore();
  });
});
