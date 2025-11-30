import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PresentationBuilderProvider,
  usePresentationBuilder,
} from "./presentation-builder.context";

const TestComponent = () => {
  const { state, send } = usePresentationBuilder();

  return (
    <div>
      <div data-testid="slide-count">{state.context.slides.length}</div>
      <button
        onClick={() => send({ type: "ADD_SLIDE" })}
        data-testid="add-slide-button"
      >
        Add Slide
      </button>
    </div>
  );
};

describe("PresentationBuilderContext", () => {
  it("should provide presentation builder context", () => {
    render(
      <PresentationBuilderProvider>
        <TestComponent />
      </PresentationBuilderProvider>
    );

    expect(screen.getByTestId("slide-count")).toHaveTextContent("0");
  });

  it("should allow adding slides through context", async () => {
    const user = userEvent.setup();

    render(
      <PresentationBuilderProvider>
        <TestComponent />
      </PresentationBuilderProvider>
    );

    const addButton = screen.getByTestId("add-slide-button");
    await user.click(addButton);

    expect(screen.getByTestId("slide-count")).toHaveTextContent("1");
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
        "usePresentationBuilder must be used within a PresentationBuilderProvider"
      );
    }

    consoleError.mockRestore();
  });
});
