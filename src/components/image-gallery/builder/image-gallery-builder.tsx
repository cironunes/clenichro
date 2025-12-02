"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Trash2, Upload, Search, X, Check } from "lucide-react";
import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import { createImageGalleryMachine } from "../image-gallery.state";
import { ImageGalleryProvider } from "../image-gallery.context";
import {
  ImageGallery,
  type ImageGalleryLayout,
  type ImageGalleryMode,
  type ImageItem,
} from "../image-gallery";
import {
  createImagesFromFiles,
  searchUnsplashPhotos,
  convertUnsplashPhotoToImageItem,
  type UnsplashPhoto,
} from "../image-gallery.utils";
import { cn } from "@/lib/utils";

const LAYOUT_OPTIONS: Array<{ value: ImageGalleryLayout; label: string }> = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "card", label: "Card" },
  { value: "slideshow", label: "Slideshow" },
];

type EditControlsProps = {
  title?: string;
  onTitleChange?: (title: string) => void;
  layout: ImageGalleryLayout;
  onLayoutChange: (layout: ImageGalleryLayout) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (files: FileList | null) => void;
  uploading: boolean;
  loadingFromUnsplash: boolean;
  onToggleUnsplash: () => void;
};

function EditControls({
  title,
  onTitleChange,
  layout,
  onLayoutChange,
  fileInputRef,
  onFileUpload,
  uploading,
  loadingFromUnsplash,
  onToggleUnsplash,
}: EditControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
      <label className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-[200px]">
        <span className="text-sm font-medium">Title:</span>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            debugger;
            onTitleChange?.(e.target.value);
          }}
          className="rounded-md border border-input bg-background px-3 py-1 text-sm flex-1"
        />
      </label>
      <label className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-[200px]">
        <span className="text-sm font-medium">Layout:</span>
        <select
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value as ImageGalleryLayout)}
          className="rounded-md border border-input bg-background px-3 py-1 text-sm flex-1"
          aria-label="Layout"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2 w-full sm:w-auto"
      >
        <Upload className="size-3" />
        <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload Images"}</span>
        <span className="sm:hidden">{uploading ? "Uploading..." : "Upload"}</span>
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileUpload(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleUnsplash}
        disabled={loadingFromUnsplash}
        className="gap-2 w-full sm:w-auto"
      >
        <Search className="size-3" />
        <span className="hidden sm:inline">{loadingFromUnsplash ? "Loading..." : "Load from Unsplash"}</span>
        <span className="sm:hidden">{loadingFromUnsplash ? "Loading..." : "Unsplash"}</span>
      </Button>
    </div>
  );
}

type ErrorDisplayProps = {
  error: string;
  onDismiss: () => void;
};

function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
      {error}
      <button onClick={onDismiss} className="ml-2 underline">
        Dismiss
      </button>
    </div>
  );
}

type UploadPreviewProps = {
  uploadedPreviews: ImageItem[];
  selectedUploadIds: Set<string | number>;
  onToggleSelection: (imageId: string | number) => void;
  onClearSelection: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

function UploadPreview({
  uploadedPreviews,
  selectedUploadIds,
  onToggleSelection,
  onClearSelection,
  onConfirm,
  onClose,
}: UploadPreviewProps) {
  return (
    <div
      className="border rounded-lg p-4 bg-background"
      data-testid="upload-preview"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {selectedUploadIds.size > 0
            ? `${selectedUploadIds.size} image${
                selectedUploadIds.size > 1 ? "s" : ""
              } selected`
            : "Select images to add"}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
            disabled={selectedUploadIds.size === 0}
            className="flex-1 sm:flex-initial"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={selectedUploadIds.size === 0}
            className="flex-1 sm:flex-initial"
          >
            Add ({selectedUploadIds.size})
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
        {uploadedPreviews.map((image) => {
          const isSelected = selectedUploadIds.has(image.id);
          return (
            <div
              key={image.id}
              className="relative group cursor-pointer"
              onClick={() => onToggleSelection(image.id)}
            >
              <div
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary/50"
                )}
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
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity",
                    isSelected
                      ? "bg-primary/20 opacity-100"
                      : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded border-2 flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-background/80 border-background"
                    )}
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
  );
}

type UnsplashSearchProps = {
  unsplashQuery: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onReset: () => void;
  loadingFromUnsplash: boolean;
  unsplashResults: UnsplashPhoto[];
  selectedImageIds: Set<string>;
  onToggleSelection: (photoId: string) => void;
  onClearSelection: () => void;
  onAddSelected: () => void;
};

function UnsplashSearch({
  unsplashQuery,
  onQueryChange,
  onSearch,
  onReset,
  loadingFromUnsplash,
  unsplashResults,
  selectedImageIds,
  onToggleSelection,
  onClearSelection,
  onAddSelected,
}: UnsplashSearchProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 p-4 bg-muted rounded-md">
        <input
          type="text"
          placeholder="Search Unsplash..."
          value={unsplashQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSearch}
            disabled={!unsplashQuery.trim() || loadingFromUnsplash}
            className="flex-1 sm:flex-initial"
          >
            Search
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {loadingFromUnsplash && (
        <div className="p-8 text-center text-muted-foreground">
          Loading images...
        </div>
      )}

      {unsplashResults.length > 0 && (
        <div className="border rounded-lg p-4 bg-background">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              {selectedImageIds.size > 0
                ? `${selectedImageIds.size} image${
                    selectedImageIds.size > 1 ? "s" : ""
                  } selected`
                : "Select images to add"}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onClearSelection}
                disabled={selectedImageIds.size === 0}
                className="flex-1 sm:flex-initial"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={onAddSelected}
                disabled={selectedImageIds.size === 0}
                className="flex-1 sm:flex-initial"
              >
                Add ({selectedImageIds.size})
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
            {unsplashResults.map((photo) => {
              const isSelected = selectedImageIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => onToggleSelection(photo.id)}
                >
                  <div
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary/50"
                    )}
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
                      className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity",
                        isSelected
                          ? "bg-primary/20 opacity-100"
                          : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center",
                          isSelected
                            ? "bg-primary border-primary"
                            : "bg-background/80 border-background"
                        )}
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
  );
}

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
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    send({ type: "SET_IMAGES", images: initialImages });
  }, [initialImages, send]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsEditPopoverOpen(false);
      }
    };

    if (isEditPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditPopoverOpen]);

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
      console.log("error", error);
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <CardTitle className="text-lg">
                {title || "Image Gallery"}
              </CardTitle>
              {mode === "preview" && onModeChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditPopoverOpen(true)}
                  className="gap-2 w-full sm:w-auto"
                  aria-label="Edit gallery"
                >
                  <Edit2 className="size-4" />
                  <span className="hidden sm:inline">Edit Gallery</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === "edit" && onModeChange && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onModeChange("preview")}
                  className="gap-2 flex-1 sm:flex-initial"
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
            <EditControls
              title={title}
              onTitleChange={(title) => {
                debugger;
                onTitleChange?.(title);
              }}
              layout={layout}
              onLayoutChange={onLayoutChange}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              uploading={state.context.uploading}
              loadingFromUnsplash={state.context.loadingFromUnsplash}
              onToggleUnsplash={() => send({ type: "TOGGLE_UNSPLASH_SEARCH" })}
            />
          )}

          {mode === "edit" && state.context.error && (
            <ErrorDisplay
              error={state.context.error}
              onDismiss={() => send({ type: "CLEAR_ERROR" })}
            />
          )}

          {mode === "edit" &&
            state.context.showUploadPreview &&
            state.context.uploadedPreviews.length > 0 && (
              <UploadPreview
                uploadedPreviews={state.context.uploadedPreviews}
                selectedUploadIds={state.context.selectedUploadIds}
                onToggleSelection={handleToggleUploadSelection}
                onClearSelection={() =>
                  send({ type: "CLEAR_UPLOAD_SELECTION" })
                }
                onConfirm={handleConfirmUpload}
                onClose={() => {
                  send({ type: "CLOSE_UPLOAD_PREVIEW" });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            )}

          {mode === "edit" && state.context.showUnsplashSearch && (
            <UnsplashSearch
              unsplashQuery={state.context.unsplashQuery}
              onQueryChange={(query) =>
                send({ type: "SET_UNSPLASH_QUERY", query })
              }
              onSearch={handleUnsplashSearch}
              onReset={() => send({ type: "RESET_UNSPLASH_SEARCH" })}
              loadingFromUnsplash={state.context.loadingFromUnsplash}
              unsplashResults={state.context.unsplashResults}
              selectedImageIds={state.context.selectedImageIds}
              onToggleSelection={handleToggleImageSelection}
              onClearSelection={() => send({ type: "CLEAR_IMAGE_SELECTION" })}
              onAddSelected={handleAddSelectedImages}
            />
          )}

          <div className="space-y-2 relative group">
            <div className={mode === "preview" ? "relative" : ""}>
              {isEditPopoverOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsEditPopoverOpen(false)}
                  />
                  <div
                    ref={popoverRef}
                    className="relative z-50 w-full max-w-4xl max-h-[90vh] bg-popover border border-border rounded-lg shadow-lg overflow-hidden flex flex-col m-4"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="text-lg font-semibold">Edit Gallery</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditPopoverOpen(false)}
                        aria-label="Close"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <EditControls
                        title={title}
                        onTitleChange={onTitleChange}
                        layout={layout}
                        onLayoutChange={onLayoutChange}
                        fileInputRef={fileInputRef}
                        onFileUpload={handleFileUpload}
                        uploading={state.context.uploading}
                        loadingFromUnsplash={state.context.loadingFromUnsplash}
                        onToggleUnsplash={() =>
                          send({ type: "TOGGLE_UNSPLASH_SEARCH" })
                        }
                      />

                      {state.context.error && (
                        <ErrorDisplay
                          error={state.context.error}
                          onDismiss={() => send({ type: "CLEAR_ERROR" })}
                        />
                      )}

                      {state.context.showUploadPreview &&
                        state.context.uploadedPreviews.length > 0 && (
                          <UploadPreview
                            uploadedPreviews={state.context.uploadedPreviews}
                            selectedUploadIds={state.context.selectedUploadIds}
                            onToggleSelection={handleToggleUploadSelection}
                            onClearSelection={() =>
                              send({ type: "CLEAR_UPLOAD_SELECTION" })
                            }
                            onConfirm={handleConfirmUpload}
                            onClose={() => {
                              send({ type: "CLOSE_UPLOAD_PREVIEW" });
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          />
                        )}

                      {state.context.showUnsplashSearch && (
                        <UnsplashSearch
                          unsplashQuery={state.context.unsplashQuery}
                          onQueryChange={(query) =>
                            send({ type: "SET_UNSPLASH_QUERY", query })
                          }
                          onSearch={handleUnsplashSearch}
                          onReset={() =>
                            send({ type: "RESET_UNSPLASH_SEARCH" })
                          }
                          loadingFromUnsplash={
                            state.context.loadingFromUnsplash
                          }
                          unsplashResults={state.context.unsplashResults}
                          selectedImageIds={state.context.selectedImageIds}
                          onToggleSelection={handleToggleImageSelection}
                          onClearSelection={() =>
                            send({ type: "CLEAR_IMAGE_SELECTION" })
                          }
                          onAddSelected={handleAddSelectedImages}
                        />
                      )}

                      <div className="border-t border-border pt-4">
                        <ImageGallery
                          images={initialImages}
                          layout={layout}
                          mode="edit"
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
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 p-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditPopoverOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditPopoverOpen(false);
                        }}
                        className="w-full sm:w-auto"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
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
