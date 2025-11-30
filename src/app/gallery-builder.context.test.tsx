import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GalleryBuilderProvider,
  useGalleryBuilder,
} from "./gallery-builder.context";

const TestComponent = () => {
  const { state, send } = useGalleryBuilder();

  return (
    <div>
      <div data-testid="gallery-count">{state.context.galleries.length}</div>
      <button
        onClick={() => send({ type: "ADD_GALLERY" })}
        data-testid="add-gallery-button"
      >
        Add Gallery
      </button>
    </div>
  );
};

describe("GalleryBuilderContext", () => {
  it("should provide gallery builder context", () => {
    render(
      <GalleryBuilderProvider>
        <TestComponent />
      </GalleryBuilderProvider>
    );

    expect(screen.getByTestId("gallery-count")).toHaveTextContent("0");
  });

  it("should allow adding galleries through context", async () => {
    const user = userEvent.setup();

    render(
      <GalleryBuilderProvider>
        <TestComponent />
      </GalleryBuilderProvider>
    );

    const addButton = screen.getByTestId("add-gallery-button");
    await user.click(addButton);

    expect(screen.getByTestId("gallery-count")).toHaveTextContent("1");
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
        "useGalleryBuilder must be used within a GalleryBuilderProvider"
      );
    }

    consoleError.mockRestore();
  });
});
