import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // Try to find user in database
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // If user doesn't exist, sync them from Clerk
  if (!user) {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      return null
    }

    // Create user in database
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        role: 'user',
      },
    })

    console.log('✅ New user auto-synced:', email)
    
    // Important: revalidate the cache after creating user
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard')
  }

  return user
}