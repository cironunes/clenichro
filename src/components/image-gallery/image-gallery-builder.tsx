"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Trash2, Upload, Search, X, Check } from "lucide-react";
import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider } from "./image-gallery.context";
import {
  ImageGallery,
  type ImageGalleryLayout,
  type ImageGalleryMode,
  type ImageItem,
} from "./image-gallery";
import {
  createImagesFromFiles,
  searchUnsplashPhotos,
  convertUnsplashPhotoToImageItem,
} from "./image-gallery.utils";

type ImageGalleryBuilderProps = {
  images: ImageItem[];
  layout: ImageGalleryLayout;
  title?: string;
  mode?: ImageGalleryMode;
  onImagesChange: (images: ImageItem[]) => void;
  onLayoutChange: (layout: ImageGalleryLayout) => void;
  onTitleChange?: (title: string) => void;
  onRemove?: () => void;
  onModeChange?: (mode: ImageGalleryMode) => void;
};

export function ImageGalleryBuilder({
  images: initialImages,
  layout,
  title,
  mode = "preview",
  onImagesChange,
  onLayoutChange,
  onTitleChange,
  onRemove,
  onModeChange,
}: ImageGalleryBuilderProps) {
  const uniqueId = useId();
  const machine = useMemo(
    () => createImageGalleryMachine(uniqueId),
    [uniqueId]
  );
  const [state, send] = useMachine(machine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    send({ type: "SET_IMAGES", images: initialImages });
  }, [initialImages, send]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      send({ type: "UPLOAD_IMAGES_START" });
      const newImages = await createImagesFromFiles(files);
      send({ type: "SET_UPLOADED_PREVIEWS", previews: newImages });
      send({ type: "UPLOAD_IMAGES_SUCCESS" });
    } catch (error) {
      send({
        type: "UPLOAD_IMAGES_ERROR",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleToggleUploadSelection = (imageId: string | number) => {
    send({ type: "TOGGLE_UPLOAD_SELECTION", imageId });
  };

  const handleConfirmUpload = () => {
    const imagesToAdd = state.context.uploadedPreviews.filter((img) =>
      state.context.selectedUploadIds.has(img.id)
    );
    if (imagesToAdd.length > 0) {
      const newImages = [...initialImages, ...imagesToAdd];
      onImagesChange(newImages);
      send({ type: "CLOSE_UPLOAD_PREVIEW" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUnsplashSearch = async () => {
    if (!state.context.unsplashQuery.trim()) {
      return;
    }

    try {
      send({ type: "LOAD_UNSPLASH_START" });
      const photos = await searchUnsplashPhotos(
        state.context.unsplashQuery,
        20
      );
      send({ type: "SET_UNSPLASH_RESULTS", results: photos });
      send({ type: "LOAD_UNSPLASH_SUCCESS" });
    } catch (error) {
      send({
        type: "LOAD_UNSPLASH_ERROR",
        error: "Failed to load images",
      });
    }
  };

  const handleToggleImageSelection = (photoId: string) => {
    send({ type: "TOGGLE_IMAGE_SELECTION", imageId: photoId });
  };

  const handleAddSelectedImages = () => {
    const selectedPhotos = state.context.unsplashResults.filter((photo) =>
      state.context.selectedImageIds.has(photo.id)
    );
    const newImageItems = selectedPhotos.map(convertUnsplashPhotoToImageItem);
    if (newImageItems.length > 0) {
      const newImages = [...initialImages, ...newImageItems];
      onImagesChange(newImages);
      send({ type: "RESET_UNSPLASH_SEARCH" });
    }
  };

  return (
    <ImageGalleryProvider state={state} send={send}>
      <Card
        className={
          mode === "edit" ? "shadow-md" : "border-transparent shadow-none"
        }
        data-testid="widget-card"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {title || "Image Gallery"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {mode === "edit" && onModeChange && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onModeChange("preview")}
                  className="gap-2"
                  aria-label="Confirm and exit edit mode"
                >
                  <Check className="size-4" />
                  Confirm
                </Button>
              )}
              {mode === "edit" && onRemove && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onRemove}
                  aria-label="Remove widget"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "edit" && (
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium">Layout:</span>
                <select
                  value={layout}
                  onChange={(e) =>
                    onLayoutChange(e.target.value as ImageGalleryLayout)
                  }
                  className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                  aria-label="Layout"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={state.context.uploading}
                className="gap-2"
              >
                <Upload className="size-3" />
                {state.context.uploading ? "Uploading..." : "Upload Images"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => send({ type: "TOGGLE_UNSPLASH_SEARCH" })}
                disabled={state.context.loadingFromUnsplash}
                className="gap-2"
              >
                <Search className="size-3" />
                {state.context.loadingFromUnsplash
                  ? "Loading..."
                  : "Load from Unsplash"}
              </Button>
            </div>
          )}

          {mode === "edit" && state.context.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {state.context.error}
              <button
                onClick={() => send({ type: "CLEAR_ERROR" })}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {mode === "edit" &&
            state.context.showUploadPreview &&
            state.context.uploadedPreviews.length > 0 && (
              <div
                className="border rounded-lg p-4 bg-background"
                data-testid="upload-preview"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    {state.context.selectedUploadIds.size > 0
                      ? `${state.context.selectedUploadIds.size} image${
                          state.context.selectedUploadIds.size > 1 ? "s" : ""
                        } selected`
                      : "Select images to add"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => send({ type: "CLEAR_UPLOAD_SELECTION" })}
                      disabled={state.context.selectedUploadIds.size === 0}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmUpload}
                      disabled={state.context.selectedUploadIds.size === 0}
                    >
                      Add Selected ({state.context.selectedUploadIds.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        send({ type: "CLOSE_UPLOAD_PREVIEW" });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                  {state.context.uploadedPreviews.map((image) => {
                    const isSelected = state.context.selectedUploadIds.has(
                      image.id
                    );
                    return (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer"
                        onClick={() => handleToggleUploadSelection(image.id)}
                      >
                        <div
                          className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary ring-offset-2"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized={image.src.startsWith("data:")}
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              isSelected
                                ? "bg-primary/20 opacity-100"
                                : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "bg-background/80 border-background"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-4 h-4 text-primary-foreground"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {mode === "edit" && state.context.showUnsplashSearch && (
            <div className="space-y-4">
              <div className="flex gap-2 p-4 bg-muted rounded-md">
                <input
                  type="text"
                  placeholder="Search Unsplash..."
                  value={state.context.unsplashQuery}
                  onChange={(e) =>
                    send({ type: "SET_UNSPLASH_QUERY", query: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnsplashSearch();
                    }
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleUnsplashSearch}
                  disabled={
                    !state.context.unsplashQuery.trim() ||
                    state.context.loadingFromUnsplash
                  }
                >
                  Search
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => send({ type: "RESET_UNSPLASH_SEARCH" })}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {state.context.loadingFromUnsplash && (
                <div className="p-8 text-center text-muted-foreground">
                  Loading images...
                </div>
              )}

              {state.context.unsplashResults.length > 0 && (
                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {state.context.selectedImageIds.size > 0
                        ? `${state.context.selectedImageIds.size} image${
                            state.context.selectedImageIds.size > 1 ? "s" : ""
                          } selected`
                        : "Select images to add"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => send({ type: "CLEAR_IMAGE_SELECTION" })}
                        disabled={state.context.selectedImageIds.size === 0}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddSelectedImages}
                        disabled={state.context.selectedImageIds.size === 0}
                      >
                        Add Selected ({state.context.selectedImageIds.size})
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                    {state.context.unsplashResults.map((photo) => {
                      const isSelected = state.context.selectedImageIds.has(
                        photo.id
                      );
                      return (
                        <div
                          key={photo.id}
                          className="relative group cursor-pointer"
                          onClick={() => handleToggleImageSelection(photo.id)}
                        >
                          <div
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Image
                              src={photo.urls.thumb}
                              alt={
                                photo.alt_description ||
                                photo.description ||
                                "Unsplash photo"
                              }
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              unoptimized={false}
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                isSelected
                                  ? "bg-primary/20 opacity-100"
                                  : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "bg-background/80 border-background"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 relative group">
            <div className={mode === "preview" ? "relative" : ""}>
              {mode === "preview" && onModeChange && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onModeChange("edit")}
                    className="gap-2 pointer-events-auto"
                    aria-label="Enter edit mode"
                  >
                    <Edit2 className="size-4" />
                    Edit Gallery
                  </Button>
                </div>
              )}
              <ImageGallery
                images={initialImages}
                layout={layout}
                mode={mode}
                onRemove={(imageId) => {
                  const newImages = initialImages.filter(
                    (img) => img.id !== imageId
                  );
                  onImagesChange(newImages);
                }}
                onEditCaption={(imageId, caption) => {
                  const newImages = initialImages.map((img) =>
                    img.id === imageId ? { ...img, caption } : img
                  );
                  onImagesChange(newImages);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </ImageGalleryProvider>
  );
}
