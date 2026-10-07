"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { get } from "../api/service/storage";

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const user = get<any>("user");

    if (!user) {
      router.replace("/");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  /**
   * Reserve the content area instead of collapsing it.
   *
   * Returning null here made the page height jump from 0 to full once the auth
   * check resolved, which registered as a large layout shift. The placeholder
   * holds the same vertical space, so the surrounding chrome does not move.
   */
  if (!isClient || !isAuthorized) {
    return <div className="page-suspense-fallback" aria-hidden="true" />;
  }

  return <>{children}</>;
}
