"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import { createPresentationBuilderMachine } from "./presentation-builder.state";

type Machine = ReturnType<typeof createPresentationBuilderMachine>;
type UseMachineReturn = ReturnType<typeof useMachine<Machine>>;
type State = UseMachineReturn[0];
type Send = UseMachineReturn[1];

type PresentationBuilderContextType = {
  state: State;
  send: Send;
};

const PresentationBuilderContext = createContext<
  PresentationBuilderContextType | undefined
>(undefined);

export const usePresentationBuilder = () => {
  const context = useContext(PresentationBuilderContext);
  if (context === undefined) {
    throw new Error(
      "usePresentationBuilder must be used within a PresentationBuilderProvider"
    );
  }
  return context;
};

type PresentationBuilderProviderProps = {
  children: ReactNode;
};

export const PresentationBuilderProvider = ({
  children,
}: PresentationBuilderProviderProps) => {
  const uniqueId = useId();
  const machine = useMemo(
    () => createPresentationBuilderMachine(uniqueId),
    [uniqueId]
  );
  const [state, send] = useMachine(machine);

  return (
    <PresentationBuilderContext.Provider value={{ state, send }}>
      {children}
    </PresentationBuilderContext.Provider>
  );
};
