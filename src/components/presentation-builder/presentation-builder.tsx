"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import {
  PresentationBuilderProvider,
  usePresentationBuilder,
} from "./presentation-builder.context";
import { ImageGalleryBuilder } from "@/components/image-gallery";
import type { ImageGalleryWidget } from "./presentation-builder.state";

function PresentationBuilderContent() {
  const { state, send } = usePresentationBuilder();
  const slides = state.context.slides;
  const selectedSlideId = state.context.selectedSlideId;

  const handleAddSlide = () => {
    send({ type: "ADD_SLIDE" });
  };

  const handleRemoveSlide = (slideId: string) => {
    send({ type: "REMOVE_SLIDE", slideId });
  };

  const handleUpdateSlide = (
    slideId: string,
    updates: Partial<{ title: string }>
  ) => {
    send({ type: "UPDATE_SLIDE", slideId, updates });
  };

  const handleAddImageGalleryWidget = (slideId: string) => {
    send({
      type: "ADD_WIDGET",
      slideId,
      widgetType: "image-gallery",
    });
  };

  const handleRemoveWidget = (slideId: string, widgetId: string) => {
    send({ type: "REMOVE_WIDGET", slideId, widgetId });
  };

  const handleUpdateWidget = (
    slideId: string,
    widgetId: string,
    updates: Partial<ImageGalleryWidget>
  ) => {
    send({ type: "UPDATE_WIDGET", slideId, widgetId, updates });
  };

  const getImageGalleryWidget = (widget: any): widget is ImageGalleryWidget => {
    return widget.type === "image-gallery";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full space-y-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Presentation Builder</h1>
            <Button onClick={handleAddSlide} className="gap-2">
              <Plus className="size-4" />
              Add Slide
            </Button>
          </div>

          {slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No slides yet. Click &quot;Add Slide&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {slides.map((slide) => (
                <Card
                  key={slide.id}
                  className="w-full"
                  data-testid="slide-card"
                  data-selected={selectedSlideId === slide.id}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{slide.title || "Untitled Slide"}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddImageGalleryWidget(slide.id)}
                          className="gap-2"
                        >
                          <Plus className="size-3" />
                          Add Image Gallery
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveSlide(slide.id)}
                          aria-label="Delete slide"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {slide.widgets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No widgets yet. Click &quot;Add Image Gallery&quot; to
                        add a widget.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {slide.widgets.map((widget) => {
                          if (!getImageGalleryWidget(widget)) return null;

                          return (
                            <ImageGalleryBuilder
                              key={widget.id}
                              images={widget.images}
                              layout={widget.layout}
                              title={widget.title}
                              onImagesChange={(images) => {
                                handleUpdateWidget(slide.id, widget.id, {
                                  images,
                                });
                              }}
                              onLayoutChange={(layout) => {
                                handleUpdateWidget(slide.id, widget.id, {
                                  layout,
                                });
                              }}
                              onTitleChange={(title) => {
                                handleUpdateWidget(slide.id, widget.id, {
                                  title,
                                });
                              }}
                              onRemove={() => {
                                handleRemoveWidget(slide.id, widget.id);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function PresentationBuilder() {
  return (
    <PresentationBuilderProvider>
      <PresentationBuilderContent />
    </PresentationBuilderProvider>
  );
}
