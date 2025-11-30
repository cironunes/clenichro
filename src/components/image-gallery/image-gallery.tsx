"use client";

import { useMachine } from "@xstate/react";
import { useId, useMemo, useEffect } from "react";
import Image from "next/image";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider, useImageGallery } from "./image-gallery.context";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGallerySlideshow } from "./image-gallery-slideshow";

export type ImageItem = {
  id: string | number;
  src: string;
  alt: string;
  caption?: string;
};

export type ImageGalleryLayout = "horizontal" | "vertical" | "card";

export type ImageGalleryMode = "preview" | "edit";

export type ImageGalleryProps = {
  images: ImageItem[];
  layout?: ImageGalleryLayout;
  className?: string;
  mode?: ImageGalleryMode;
  onRemove?: (imageId: string | number) => void;
  onEditCaption?: (imageId: string | number, caption: string) => void;
};

export const ImageGallery = ({
  images,
  layout = "horizontal",
  className,
  mode = "preview",
  onRemove,
  onEditCaption,
}: ImageGalleryProps) => {
  const uniqueId = useId();
  const machine = useMemo(
    () => createImageGalleryMachine(uniqueId),
    [uniqueId]
  );
  const [state, send] = useMachine(machine);

  useEffect(() => {
    send({ type: "SET_IMAGES", images });
  }, [images, send]);

  return (
    <ImageGalleryProvider state={state} send={send}>
      <ImageGalleryDisplay
        images={images}
        layout={layout}
        className={className}
        mode={mode}
        onRemove={onRemove}
        onEditCaption={onEditCaption}
      />
      <ImageGallerySlideshow images={images} />
    </ImageGalleryProvider>
  );
};

type ImageGalleryDisplayProps = {
  images: ImageItem[];
  layout: ImageGalleryLayout;
  className?: string;
  mode: ImageGalleryMode;
  onRemove?: (imageId: string | number) => void;
  onEditCaption?: (imageId: string | number, caption: string) => void;
};

export const ImageGalleryDisplay = ({
  images,
  layout,
  className,
  mode,
  onRemove,
  onEditCaption,
}: ImageGalleryDisplayProps) => {
  const { state, send } = useImageGallery();
  const isEditMode = mode === "edit";

  const containerClasses = cn(
    {
      "flex flex-row gap-4 flex-wrap": layout === "horizontal",
      "flex flex-col gap-4": layout === "vertical",
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4": layout === "card",
    },
    className
  );

  const imageClasses = cn("object-cover", {
    "w-full h-auto": layout === "horizontal" || layout === "vertical",
    "w-full h-48 sm:h-64": layout === "card",
  });

  const isDataUrl = (src: string) => src.startsWith("data:");

  const handleStartEditCaption = (
    imageId: string | number,
    currentCaption: string | undefined
  ) => {
    if (!isEditMode || !onEditCaption) return;
    send({
      type: "START_EDIT_CAPTION",
      imageId,
      currentCaption,
    });
  };

  const handleSaveCaption = () => {
    if (state.context.editingCaption && onEditCaption) {
      onEditCaption(
        state.context.editingCaption.imageId,
        state.context.captionValue
      );
      send({ type: "CANCEL_EDIT_CAPTION" });
    }
  };

  const handleCancelEditCaption = () => {
    send({ type: "CANCEL_EDIT_CAPTION" });
  };

  const handleRemove = (imageId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(imageId);
    }
  };

  return (
    <div className={containerClasses}>
      {images.map((image) => {
        const imageProps = {
          src: image.src,
          width: 400,
          height: 300,
          className: imageClasses,
          unoptimized: isDataUrl(image.src),
        };

        if (layout === "card") {
          return (
            <Card
              key={image.id}
              className={cn(
                "overflow-hidden transition-shadow relative image-gallery-item",
                {
                  "cursor-pointer hover:shadow-lg": true,
                }
              )}
              onClick={() =>
                send({
                  type: "IMAGE_CLICKED",
                  image,
                  enterSlideshow: true,
                })
              }
            >
              <CardContent className="p-0 relative">
                <Image alt={image.alt} {...imageProps} />
                {isEditMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 [.image-gallery-item:hover_&]:opacity-100 transition-opacity pointer-events-none [.image-gallery-item:hover_&]:pointer-events-auto">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        send({
                          type: "IMAGE_CLICKED",
                          image,
                          enterSlideshow: true,
                        });
                      }}
                      aria-label="View in slideshow"
                      title="View in slideshow"
                    >
                      <Maximize2 className="size-3" />
                    </Button>
                    {onEditCaption && (
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditCaption(image.id, image.caption);
                        }}
                        aria-label="Edit caption"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        onClick={(e) => handleRemove(image.id, e)}
                        aria-label="Remove image"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
              {(image.caption ||
                state.context.editingCaption?.imageId === image.id) && (
                <CardFooter className="p-4 pt-2">
                  {state.context.editingCaption?.imageId === image.id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        value={state.context.captionValue}
                        onChange={(e) =>
                          send({
                            type: "UPDATE_CAPTION_VALUE",
                            value: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveCaption();
                          } else if (e.key === "Escape") {
                            handleCancelEditCaption();
                          }
                        }}
                        placeholder="Enter caption..."
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveCaption();
                          }}
                          className="flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEditCaption();
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {image.caption}
                    </p>
                  )}
                </CardFooter>
              )}
            </Card>
          );
        }

        return (
          <div
            key={image.id}
            className={cn("relative image-gallery-item", {
              "w-full": layout === "vertical",
              "flex-1 min-w-[200px]": layout === "horizontal",
            })}
          >
            <Image
              alt={image.alt}
              {...imageProps}
              className={cn(imageClasses, {
                "cursor-pointer": true,
              })}
              onClick={() =>
                send({
                  type: "IMAGE_CLICKED",
                  image,
                  enterSlideshow: true,
                })
              }
            />
            {!isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="opacity-0 [.image-gallery-item:hover_&]:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <Maximize2 className="size-5 text-gray-700" />
                  </div>
                </div>
              </div>
            )}
            {isEditMode && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 [.image-gallery-item:hover_&]:opacity-100 transition-opacity pointer-events-none [.image-gallery-item:hover_&]:pointer-events-auto">
                {onEditCaption && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditCaption(image.id, image.caption);
                    }}
                    aria-label="Edit caption"
                  >
                    <Edit2 className="size-3" />
                  </Button>
                )}
                {onRemove && (
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onClick={(e) => handleRemove(image.id, e)}
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            )}
            {state.context.editingCaption?.imageId === image.id ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={state.context.captionValue}
                  onChange={(e) =>
                    send({
                      type: "UPDATE_CAPTION_VALUE",
                      value: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveCaption();
                    } else if (e.key === "Escape") {
                      handleCancelEditCaption();
                    }
                  }}
                  placeholder="Enter caption..."
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveCaption();
                    }}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEditCaption();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : image.caption ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {image.caption}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
