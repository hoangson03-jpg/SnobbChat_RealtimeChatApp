import { SignupForm } from '@/components/auth/signup-form'
import React from 'react'

const SignUpPage = () => {
  return (
    <div className="bg-app-dynamic flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm/>
      </div>
    </div>
  )
}

export default SignUpPage