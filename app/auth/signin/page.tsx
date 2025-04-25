"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Client component that uses useSearchParams
function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  return (
    <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <Image 
          src="/vvg-logo.jpg" 
          alt="Company Logo" 
          width={120} 
          height={120}
          className="mb-4"
        />
        <h1 className="text-2xl font-bold">Sign in to Truck Finder</h1>
        <p className="text-gray-500 mt-2">Use your Microsoft account to sign in</p>
      </div>
      
      <Button 
        className="w-full py-6 bg-[#0078d4] hover:bg-[#106ebe] flex items-center justify-center gap-2"
        onClick={() => signIn("azure-ad", { callbackUrl })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
          <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
          <path fill="#f35325" d="M1 1h10v10H1z"/>
          <path fill="#81bc06" d="M12 1h10v10H12z"/>
          <path fill="#05a6f0" d="M1 12h10v10H1z"/>
          <path fill="#ffba08" d="M12 12h10v10H12z"/>
        </svg>
        Sign in with Microsoft
      </Button>
    </div>
  );
}

// Loading fallback for Suspense
function SignInLoading() {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-[120px] h-[120px] bg-gray-200 rounded-md animate-pulse mb-4" />
        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
      </div>
      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

// Main page component with Suspense
export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Suspense fallback={<SignInLoading />}>
        <SignInForm />
      </Suspense>
    </div>
  );
} 