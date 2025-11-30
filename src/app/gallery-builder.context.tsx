"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import { createGalleryBuilderMachine } from "./gallery-builder.state";

type Machine = ReturnType<typeof createGalleryBuilderMachine>;
type UseMachineReturn = ReturnType<typeof useMachine<Machine>>;
type State = UseMachineReturn[0];
type Send = UseMachineReturn[1];

type GalleryBuilderContextType = {
  state: State;
  send: Send;
};

const GalleryBuilderContext = createContext<
  GalleryBuilderContextType | undefined
>(undefined);

export const useGalleryBuilder = () => {
  const context = useContext(GalleryBuilderContext);
  if (context === undefined) {
    throw new Error(
      "useGalleryBuilder must be used within a GalleryBuilderProvider"
    );
  }
  return context;
};

type GalleryBuilderProviderProps = {
  children: ReactNode;
};

export const GalleryBuilderProvider = ({
  children,
}: GalleryBuilderProviderProps) => {
  const uniqueId = useId();
  const machine = useMemo(
    () => createGalleryBuilderMachine(uniqueId),
    [uniqueId]
  );
  const [state, send] = useMachine(machine);

  return (
    <GalleryBuilderContext.Provider value={{ state, send }}>
      {children}
    </GalleryBuilderContext.Provider>
  );
};
