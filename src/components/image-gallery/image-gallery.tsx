"use client";

import { useMachine } from "@xstate/react";
import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider, useImageGallery } from "./image-gallery.context";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { send } = useImageGallery();
  const [editingCaption, setEditingCaption] = useState<{
    imageId: string | number;
  } | null>(null);
  const [captionValue, setCaptionValue] = useState("");
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
    setEditingCaption({ imageId });
    setCaptionValue(currentCaption || "");
  };

  const handleSaveCaption = () => {
    if (editingCaption && onEditCaption) {
      onEditCaption(editingCaption.imageId, captionValue);
      setEditingCaption(null);
      setCaptionValue("");
    }
  };

  const handleCancelEditCaption = () => {
    setEditingCaption(null);
    setCaptionValue("");
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
          alt: image.alt,
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
                "overflow-hidden transition-shadow relative group",
                {
                  "cursor-pointer hover:shadow-lg": !isEditMode,
                }
              )}
              onClick={() =>
                !isEditMode && send({ type: "IMAGE_CLICKED", image })
              }
            >
              <CardContent className="p-0 relative">
                <Image {...imageProps} />
                {isEditMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditCaption && (
                      <Button
                        size="icon-sm"
                        variant="secondary"
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
              {(image.caption || editingCaption?.imageId === image.id) && (
                <CardFooter className="p-4 pt-2">
                  {editingCaption?.imageId === image.id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        value={captionValue}
                        onChange={(e) => setCaptionValue(e.target.value)}
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
            className={cn("relative group", {
              "w-full": layout === "vertical",
              "flex-1 min-w-[200px]": layout === "horizontal",
            })}
          >
            <Image
              {...imageProps}
              className={cn(imageClasses, {
                "cursor-pointer": !isEditMode,
              })}
              onClick={() =>
                !isEditMode && send({ type: "IMAGE_CLICKED", image })
              }
            />
            {isEditMode && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEditCaption && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
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
            {editingCaption?.imageId === image.id ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={captionValue}
                  onChange={(e) => setCaptionValue(e.target.value)}
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
