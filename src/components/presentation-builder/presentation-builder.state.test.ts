import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { createPresentationBuilderMachine } from "./presentation-builder.state";
import type { ImageItem } from "@/components/image-gallery";

const mockImage: ImageItem = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Test Image",
};

describe("PresentationBuilderMachine", () => {
  it("should start in idle state", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.slides).toEqual([]);
  });

  it("should add a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.slides).toHaveLength(1);
    expect(snapshot.context.slides[0].title).toMatch(/Slide \d+/);
    expect(snapshot.context.slides[0].widgets).toEqual([]);
  });

  it("should remove a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;

    actor.send({ type: "REMOVE_SLIDE", slideId });

    expect(actor.getSnapshot().context.slides).toHaveLength(0);
  });

  it("should update a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;

    actor.send({
      type: "UPDATE_SLIDE",
      slideId,
      updates: { title: "Updated Title" },
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.slides[0].title).toBe("Updated Title");
  });

  it("should add an image gallery widget to a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;

    actor.send({
      type: "ADD_WIDGET",
      slideId,
      widgetType: "image-gallery",
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.slides[0].widgets).toHaveLength(1);
    expect(snapshot.context.slides[0].widgets[0].type).toBe("image-gallery");
    expect((snapshot.context.slides[0].widgets[0] as any).layout).toBe(
      "horizontal"
    );
  });

  it("should remove a widget from a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;
    actor.send({
      type: "ADD_WIDGET",
      slideId,
      widgetType: "image-gallery",
    });
    const widgetId = actor.getSnapshot().context.slides[0].widgets[0].id;

    actor.send({ type: "REMOVE_WIDGET", slideId, widgetId });

    expect(actor.getSnapshot().context.slides[0].widgets).toHaveLength(0);
  });

  it("should update a widget", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;
    actor.send({
      type: "ADD_WIDGET",
      slideId,
      widgetType: "image-gallery",
    });
    const widgetId = actor.getSnapshot().context.slides[0].widgets[0].id;

    actor.send({
      type: "UPDATE_WIDGET",
      slideId,
      widgetId,
      updates: { layout: "vertical", title: "Updated Gallery" },
    });

    const snapshot = actor.getSnapshot();
    const widget = snapshot.context.slides[0].widgets[0] as any;
    expect(widget.layout).toBe("vertical");
    expect(widget.title).toBe("Updated Gallery");
  });

  it("should select a slide", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;

    actor.send({ type: "SELECT_SLIDE", slideId });

    expect(actor.getSnapshot().context.selectedSlideId).toBe(slideId);
  });

  it("should select a widget", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "ADD_SLIDE" });
    const slideId = actor.getSnapshot().context.slides[0].id;
    actor.send({
      type: "ADD_WIDGET",
      slideId,
      widgetType: "image-gallery",
    });
    const widgetId = actor.getSnapshot().context.slides[0].widgets[0].id;

    actor.send({ type: "SELECT_WIDGET", slideId, widgetId });

    expect(actor.getSnapshot().context.selectedSlideId).toBe(slideId);
    expect(actor.getSnapshot().context.selectedWidgetId).toBe(widgetId);
  });

  it("should clear error", () => {
    const machine = createPresentationBuilderMachine("test");
    const actor = createActor(machine).start();

    actor.send({ type: "CLEAR_ERROR" });

    expect(actor.getSnapshot().context.error).toBeNull();
  });
});
