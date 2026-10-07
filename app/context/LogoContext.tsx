"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { get } from "../api/service/storage";


interface CompanyContextType {
  companyData?: any | null;
  setCompanyData: (data: any | null) => void;
  seoData?: any;
  setSeoData: (data: any | null) => void;
}
interface CompanyProviderProps {
  children: ReactNode;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);


export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [seoData, setSeoData] = useState<any | null>(null);

  useEffect(() => {
    const companyData = get<any>("companyData");
    setCompanyData(companyData)
  }, []);

  // const updateFavicon = (faviconUrl: string) => {
  //   if (typeof document !== 'undefined') {
  //     let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  //     if (!favicon) {
  //       favicon = document.createElement('link');
  //       favicon.rel = 'icon';
  //       document.head.appendChild(favicon);
  //     }
  //     favicon.href = faviconUrl || defaultCompanyData.favicon;
  //   }
  // };


  return (
    <CompanyContext.Provider value={{ companyData, setCompanyData, seoData, setSeoData }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};