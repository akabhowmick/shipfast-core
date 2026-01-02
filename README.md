# ShipFast Core

A production-grade Next.js application demonstrating backend ownership, server-side security patterns, and modern full-stack development.

🔗 **Live Demo**: [shipfast-core-jy67.vercel.app](https://shipfast-core-jy67.vercel.app)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5
- **Auth**: Clerk
- **File Storage**: Firebase Storage
- **Observability**: Sentry
- **Deployment**: Vercel
- **Testing**: Playwright

## Core Features

1. **Authentication & Authorization**
   - Clerk-powered authentication
   - Server-side role enforcement (user/admin)
   - Automatic user sync to database

2. **Project Management**
   - Create and manage projects
   - Server-side status updates (draft/active/completed)
   - Full audit logging

3. **File Uploads**
   - Firebase Storage integration
   - Client-side validation, server-side authorization
   - Metadata stored in PostgreSQL

4. **Admin Dashboard**
   - View all users and projects
   - Recent activity feed from audit logs
   - Protected by server-side role checks

5. **Error Tracking**
   - Sentry integration for client and server errors
   - Full observability in production

## Architecture

### Server vs Client Boundaries

This application follows a **server-first architecture**:

**Server Components (Default)**
- All pages are Server Components by default
- Direct database access via Prisma
- No client-side JavaScript unless needed
- Examples: Dashboard, Project pages, Admin dashboard

**Server Actions**
- All mutations (create, update, delete) use Server Actions
- Type-safe, no API routes needed
- Run exclusively on the server
- Examples: `createProject`, `saveFileMetadata`, `updateProjectStatus`

**Client Components (Explicit)**
- Only used when necessary for interactivity
- File upload form (needs file picker)
- Status update buttons (needs click handlers)
- Always marked with `'use client'` directive

### Authentication & Authorization

**How It Works:**

1. **Authentication (Clerk)**
   - Clerk handles sign-up/sign-in UI and session management
   - Middleware protects all routes except `/sign-in` and `/sign-up`
   - Session token stored in HTTP-only cookies

2. **User Sync**
```typescript
   // lib/auth.ts
   export async function getCurrentUser() {
     const { userId } = await auth() // Get Clerk user ID
     
     let user = await prisma.user.findUnique({
       where: { clerkId: userId }
     })
     
     // Auto-create user if doesn't exist
     if (!user) {
       user = await prisma.user.create({
         data: { clerkId: userId, email, role: 'user' }
       })
     }
     
     return user
   }
```

3. **Role Enforcement (Server-Side)**
```typescript
   // app/admin/page.tsx
   const user = await getCurrentUser()
   
   if (!user || user.role !== 'admin') {
     redirect('/dashboard') // Server-side redirect
   }
```

**Key Security Principles:**
- ✅ Never trust client-provided user data
- ✅ Always verify user identity server-side
- ✅ Role stored in database, not client-side
- ✅ Authorization checked before every mutation
- ✅ Middleware protects routes at the edge

### File Upload Flow

**Multi-Layer Security:**

1. **Client-Side Validation** (UX only, not security)
   - File size < 10MB
   - File type (images, PDFs, text files)
   - Provides immediate feedback

2. **Firebase Storage Upload**
   - File uploaded directly from browser to Firebase
   - Firebase Storage Rules enforce size/type restrictions
   - Returns download URL after upload

3. **Server-Side Authorization**
```typescript
   // app/actions/projects.ts
   export async function saveFileMetadata(projectId, fileName, fileUrl, fileSize) {
     const user = await getCurrentUser()
     
     // Verify ownership
     const project = await prisma.project.findUnique({
       where: { id: projectId }
     })
     
     if (!project || (project.userId !== user.id && user.role !== 'admin')) {
       throw new Error('Unauthorized')
     }
     
     // Only save metadata if authorized
     await prisma.file.create({
       data: { projectId, fileName, url: fileUrl, size: fileSize }
     })
   }
```

**Why This Approach:**
- File storage (Firebase) separated from metadata (Postgres)
- Even if someone uploads a file to Firebase, they can't link it to a project without proper authorization
- Server Action verifies project ownership before saving metadata
- Audit log tracks all file uploads

### Database Schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  clerkId   String   @unique
  role      String   @default("user")  // Server-side role enforcement
  projects  Project[]
  auditLogs AuditLog[]
}

model Project {
  id     String @id @default(cuid())
  userId String
  status String @default("draft")  // draft | active | completed
  name   String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  files  File[]
  
  @@index([userId])  // Fast queries by user
}

model File {
  id         String  @id @default(cuid())
  projectId  String
  url        String  // Firebase Storage URL
  size       Int     // Bytes
  fileName   String
  project    Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}

model AuditLog {
  id       String @id @default(cuid())
  action   String  // PROJECT_CREATED, FILE_UPLOADED, STATUS_UPDATED
  userId   String
  metadata String? // JSON: additional context
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])  // Fast queries for recent activity
}
```

**Design Decisions:**
- `onDelete: Cascade` maintains referential integrity
- Indexes on foreign keys for performance
- `role` field in User table (not in JWT) for server-side enforcement
- `AuditLog` tracks all mutations for observability
- `clerkId` links Clerk auth to database records

### Server Actions

All mutations use Server Actions instead of API routes:

**Benefits:**
1. **Type Safety**: End-to-end TypeScript from form to database
2. **No API Routes**: Less boilerplate, fewer files
3. **Progressive Enhancement**: Works without JavaScript
4. **Server-Only**: Marked with `'use server'`, impossible to run client-side
5. **Built-in Form Handling**: Automatic FormData parsing

**Example:**
```typescript
// app/actions/projects.ts
'use server'

export async function updateProjectStatus(projectId: string, newStatus: string) {
  const user = await getCurrentUser()
  
  // Authorization
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || (project.userId !== user.id && user.role !== 'admin')) {
    throw new Error('Unauthorized')
  }
  
  // Mutation
  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus }
  })
  
  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_UPDATED',
      userId: user.id,
      metadata: JSON.stringify({ projectId, newStatus })
    }
  })
  
  // Revalidate cache
  revalidatePath(`/dashboard/projects/${projectId}`)
}
```

## Local Development

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd shipfast-core
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
   
   Create `.env`:
```env
   DATABASE_URL="your-supabase-connection-string"
   DIRECT_URL="your-supabase-direct-connection-string"
```
   
   Create `.env.local`:
```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   CLERK_WEBHOOK_SECRET=whsec_xxx
   
   # Clerk URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=xxx
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
   NEXT_PUBLIC_FIREBASE_APP_ID=xxx
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   
   # Sentry
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_AUTH_TOKEN=xxx
```

4. **Run database migrations**
```bash
   npx prisma migrate dev
   npx prisma generate
```

5. **Start development server**
```bash
   npm run dev
```

6. **Open Prisma Studio** (optional)
```bash
   npx prisma studio
```

## Testing

Run Playwright tests:
```bash
npx playwright test
```

View test report:
```bash
npx playwright show-report
```

## Deployment

This app is deployed on Vercel with automatic deployments from the `main` branch.

**Post-Deployment Setup:**

1. Add all environment variables in Vercel dashboard
2. Configure Clerk webhook:
   - URL: `https://your-domain.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Update `CLERK_WEBHOOK_SECRET` in Vercel

## Backend Ownership Highlights

**Why Logic Lives on the Server:**

1. **Security**: Client code can be manipulated. Server code cannot.
2. **Data Integrity**: Direct database access ensures consistent data operations.
3. **Authorization**: User roles and permissions checked server-side, not client-side.
4. **Performance**: Server Components reduce client-side JavaScript.
5. **Reliability**: Server-side errors are caught and logged via Sentry.

**Key Implementation Details:**

- ✅ All mutations use Server Actions (`'use server'`)
- ✅ All pages are Server Components (direct DB access)
- ✅ Authentication verified on every request (middleware)
- ✅ Role checks happen server-side before data access
- ✅ Audit logs track all important actions
- ✅ File upload authorization verified server-side
- ✅ Error tracking via Sentry for observability

## Project Structure
```
shipfast-core/
├── app/
│   ├── actions/          # Server Actions (mutations)
│   ├── admin/            # Admin dashboard (role-protected)
│   ├── api/              # API routes (webhooks, Sentry test)
│   ├── dashboard/        # User dashboard & projects
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   └── layout.tsx        # Root layout (ClerkProvider)
├── lib/
│   ├── auth.ts           # getCurrentUser helper
│   ├── prisma.ts         # Prisma client singleton
│   ├── firebase.ts       # Firebase Admin SDK
│   └── firebase-client.ts # Firebase client SDK
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/                # Playwright tests
├── proxy.ts              # Route protection middleware
└── sentry.*.config.ts    # Sentry configuration
```

## Author

Built by Akash Bhowmick
