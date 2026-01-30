'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

export async function login(prevState: { error: string | null, message: string | null } | undefined, formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    return { error: error.message, message: '' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: { error: string | null, message: string | null } | undefined, formData: FormData) {
  const origin = (await headers()).get('origin')
  const name = formData.get('name') as string;
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', message: null };
  }
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error)
    return { error: error.message, message: '' }
  }

  return { error: '', message: 'Check your email to continue the sign up process' }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth')
}

export async function resetPassword(email: string) {
  const origin = (await headers()).get('origin')
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  })

  if (error) {
    console.error('Password reset error:', error)
    return { error: error.message, success: false }
  }

  return { error: null, success: true, message: 'Password reset email sent! Check your inbox.' }
}

export async function updatePasswordFromToken(password: string) {
  const supabase = await createClient()

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', success: false }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Password update error:', error)
    return { error: error.message, success: false }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
