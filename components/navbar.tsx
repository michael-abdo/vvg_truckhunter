"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/ui/user-profile";

export function Navbar() {
  const { status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/vvg-logo.jpg" 
              alt="VVG Logo" 
              width={40} 
              height={40}
              className="mr-3"
            />
            <span className="self-center text-xl font-semibold whitespace-nowrap">
              Truck Finder
            </span>
          </Link>
        </div>
        
        <div className="flex items-center ml-auto">
          {isLoading ? (
            <div className="animate-pulse rounded-full h-8 w-8 bg-gray-200"></div>
          ) : isAuthenticated ? (
            <UserProfile />
          ) : (
            <Button variant="default" onClick={() => signIn("azure-ad")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
} 