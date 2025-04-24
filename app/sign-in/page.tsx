"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  useEffect(() => {
    // Automatically redirect to Azure AD sign-in
    signIn("azure-ad", { callbackUrl });
  }, [callbackUrl]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <Image 
            src="/vvg-logo.jpg" 
            alt="Company Logo" 
            width={120} 
            height={120}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold">Redirecting to Sign In</h1>
          <p className="text-gray-500 mt-2">You are being redirected to Microsoft for authentication...</p>
        </div>
        
        <div className="mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 