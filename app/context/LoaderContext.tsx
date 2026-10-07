// context/LoaderContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import LoadingText from "@/components/LoadingText/LoadingText";

interface LoaderContextType {
    showLoader: () => void;
    hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);
    useEffect(() => {
        if (isLoading) {
            document.body.classList.add("loading-active");
        } else {
            document.body.classList.remove("loading-active");
        }

        return () => {
            document.body.classList.remove("loading-active");
        };
    }, [isLoading]);

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-[9999]">
                    <LoadingText />
                </div>
            )}
        </LoaderContext.Provider>
    );
};

export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) throw new Error("useLoader must be used within LoaderProvider");
    return context;
};
