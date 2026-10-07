"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

/**
 * Auth modals load on first open rather than on every page.
 *
 * next/dynamic alone would not help here: these used to render
 * unconditionally, with only the `show` prop toggling visibility, so the chunk
 * would have been requested immediately anyway. Gating the render on the
 * open-state below is what actually defers them (and axios with them).
 */
const SigninModal = dynamic(() => import("@/components/sign-in-modal"), {
  ssr: false,
});
const SignupModal = dynamic(() => import("@/components/sign-up-modal"), {
  ssr: false,
});

type ModalContextType = {
  openSignIn: () => void;
  closeSignIn: () => void;
  openSignUp: () => void;
  closeSignUp: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const openSignIn = () => setShowSignIn(true);
  const closeSignIn = () => setShowSignIn(false);
  const openSignUp = () => setShowSignUp(true);
  const closeSignUp = () => setShowSignUp(false);
  const router = usePathname();

  return (
    <ModalContext.Provider value={{ openSignIn, closeSignIn, openSignUp, closeSignUp }}>
      {children}

      {/* Both modals already `return null` internally when their show flag is
          false, so gating here changes nothing visually — it just stops the
          chunk from being fetched until the user opens one. */}
      {showSignIn && (
        <SigninModal
          router={router}
          show={showSignIn}
          handleClose={closeSignIn}
          handleOpenSingUp={openSignUp}
          handleCloseSingUp={closeSignUp}
          onLoginSuccess={() => closeSignIn()}
        />
      )}
      {showSignUp && (
        <SignupModal
          showSingUp={showSignUp}
          handleCloseSingUp={closeSignUp}
          handleOpenSingIn={openSignIn}
          handleClose={closeSignUp}
          handleOpenSingUp={openSignUp}
        />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
