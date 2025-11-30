"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { imageGalleryMachine } from "./image-gallery.state";

type UseMachineReturn = ReturnType<
  typeof useMachine<typeof imageGalleryMachine>
>;
type State = UseMachineReturn[0];
type Send = UseMachineReturn[1];

type ImageGalleryContextType = {
  state: State;
  send: Send;
};

const ImageGalleryContext = createContext<ImageGalleryContextType | undefined>(
  undefined
);

export const useImageGallery = () => {
  const context = useContext(ImageGalleryContext);
  if (context === undefined) {
    throw new Error(
      "useImageGallery must be used within an ImageGalleryProvider"
    );
  }
  return context;
};

type ImageGalleryProviderProps = {
  children: ReactNode;
  state: State;
  send: Send;
};

export const ImageGalleryProvider = ({
  children,
  state,
  send,
}: ImageGalleryProviderProps) => {
  return (
    <ImageGalleryContext.Provider value={{ state, send }}>
      {children}
    </ImageGalleryContext.Provider>
  );
};
