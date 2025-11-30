"use client";

import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import Image from "next/image";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider, useImageGallery } from "./image-gallery.context";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ImageItem = {
  id: string | number;
  src: string;
  alt: string;
  caption?: string;
};

export type ImageGalleryLayout = "horizontal" | "vertical" | "card";

export type ImageGalleryProps = {
  images: ImageItem[];
  layout?: ImageGalleryLayout;
  className?: string;
};

export const ImageGallery = ({
  images,
  layout = "horizontal",
  className,
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
      />
    </ImageGalleryProvider>
  );
};

type ImageGalleryDisplayProps = {
  images: ImageItem[];
  layout: ImageGalleryLayout;
  className?: string;
};

export const ImageGalleryDisplay = ({
  images,
  layout,
  className,
}: ImageGalleryDisplayProps) => {
  const { send } = useImageGallery();

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
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => send({ type: "IMAGE_CLICKED", image })}
            >
              <CardContent className="p-0">
                <Image {...imageProps} />
              </CardContent>
              {image.caption && (
                <CardFooter className="p-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {image.caption}
                  </p>
                </CardFooter>
              )}
            </Card>
          );
        }

        return (
          <div
            key={image.id}
            className={cn("relative", {
              "w-full": layout === "vertical",
              "flex-1 min-w-[200px]": layout === "horizontal",
            })}
          >
            <Image
              {...imageProps}
              className={cn(imageClasses, "cursor-pointer")}
              onClick={() => send({ type: "IMAGE_CLICKED", image })}
            />
            {image.caption && (
              <p className="mt-2 text-sm text-muted-foreground">
                {image.caption}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
