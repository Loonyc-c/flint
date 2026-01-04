# Monorepo Deployment Strategy for Vercel

**Scenario**: Single repo with `/backend`, `/frontend`, and `/shared` directories, deployed separately to Vercel.

---

## 🏗️ Project Structure

```
flint/ (Single Git Repo)
├── shared/                 ← Shared types & validations
│   ├── types/
│   ├── validations/
│   └── package.json
├── backend/                ← Vercel Deployment #1
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── frontend/               ← Vercel Deployment #2
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── package.json            ← Root workspace config
└── .gitignore
```

---

## 📦 Solution 1: NPM Workspaces (Recommended for Prototype)

**Pros**: Simple, monorepo-native, built-in to npm  
**Cons**: Each service must handle `node_modules` correctly during build  
**Best for**: Your prototype phase

### Step 1: Root `package.json`

```json
{
  "name": "flint",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "install-all": "npm install",
    "build:shared": "npm run build -w shared",
    "build:backend": "npm run build -w backend",
    "build:frontend": "npm run build -w frontend"
  }
}
```

### Step 2: `shared/package.json`

```json
{
  "name": "@flint/shared",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    "./types": "./types/index.ts",
    "./validations": "./validations/index.ts"
  }
}
```

### Step 3: `backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "dependencies": {
    "@flint/shared": "*"
  }
}
```

### Step 4: `frontend/package.json`

```json
{
  "name": "frontend",
  "version": "1.0.0",
  "dependencies": {
    "@flint/shared": "*"
  }
}
```

### Step 5: Import in Code

**Backend:**

```typescript
import type { LoginResponse } from '@flint/shared/types'
import { loginValidation } from '@flint/shared/validations'
```

**Frontend:**

```typescript
import type { LoginResponse } from '@flint/shared/types'
import { loginValidation } from '@flint/shared/validations'
```

### Step 6: Local Development

```bash
# Install everything
npm install

# Both services automatically have access to @flint/shared
npm run dev -w backend
npm run dev -w frontend
```

**This works perfectly for local development!**

---

## 🚀 Deployment Issue & Solutions

### ⚠️ The Problem

When you push to Vercel:

1. Vercel deploys `/backend` separately from `/frontend`
2. Vercel sees `"dependencies": { "@flint/shared": "*" }`
3. Vercel looks for `@flint/shared` in npm registry
4. It's NOT on npm registry (it's local only)
5. **Build fails** ❌

```
error: npm ERR! 404  '@flint/shared' is not in the npm registry
```

---

## ✅ Solution A: Publish to NPM (Production Ready)

**Setup**: Publish `@flint/shared` as private npm package

### Step 1: Publish Shared to npm

```bash
cd shared
npm login
npm publish --access private  # or public if you want
```

### Step 2: Update Dependencies

**backend/package.json** & **frontend/package.json**:

```json
{
  "dependencies": {
    "@flint/shared": "^1.0.0"  # Reference from npm
  }
}
```

### Step 3: Vercel Deployment

Both services install from npm:

```bash
npm install @flint/shared@latest
```

**Pros**:

- ✅ Production-ready
- ✅ Works with separate deployments
- ✅ Version control

**Cons**:

- ❌ Need npm account (or GitHub Packages)
- ❌ Must publish before each deploy
- ❌ Extra step in workflow

---

## ✅ Solution B: Include Shared in Build (Prototype Phase) ⭐ RECOMMENDED

**Setup**: Copy shared files during build, reference directly

### Step 1: Backend Setup

**backend/package.json** - Add build script:

```json
{
  "scripts": {
    "prebuild": "npm run copy:shared",
    "copy:shared": "cp -r ../shared/types ./src/shared-types && cp -r ../shared/validations ./src/shared-types",
    "build": "tsc",
    "start": "tsx src/index.ts"
  }
}
```

**backend/tsconfig.json**:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@shared-types/*": ["./src/shared-types/*"]
    }
  }
}
```

**backend imports**:

```typescript
import type { LoginResponse } from '@shared-types/types'
import { loginValidation } from '@shared-types/validations'
```

### Step 2: Frontend Setup

**frontend/package.json** - Add build script:

```json
{
  "scripts": {
    "prebuild": "npm run copy:shared",
    "copy:shared": "cp -r ../shared/types ./src/shared-types && cp -r ../shared/validations ./src/shared-types",
    "build": "next build"
  }
}
```

**frontend/tsconfig.json**:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@shared-types/*": ["./src/shared-types/*"]
    }
  }
}
```

### Step 3: .gitignore

```gitignore
backend/src/shared-types/
frontend/src/shared-types/
```

**Shared files are copied during build, not committed**

### Step 4: Vercel Deployment

- Backend `/backend` folder → automatically runs `npm run build`
- Prebuild script copies shared files
- Everything needed is in the build directory ✅

**Pros**:

- ✅ Works immediately with Vercel
- ✅ No npm publishing needed
- ✅ Perfect for prototype phase
- ✅ Each service is self-contained after build

**Cons**:

- ❌ Need to copy files before build
- ❌ Not true monorepo at deploy time

---

## ✅ Solution C: Monorepo Tools (Scale Later)

**Setup**: Use Nx or Turborepo to handle everything

### Nx Example

**root nx.json**:

```json
{
  "plugins": [
    {
      "plugin": "@nx/node/plugin",
      "options": {
        "targetName": "build"
      }
    }
  ]
}
```

**Then**: Each app imports shared automatically, Nx handles build dependencies

**When to use**: After prototype proves successful (Week 4+)

---

## 📋 Recommendation for Your Project

### **Phase 1: Prototype (Now - Week 2)**

Use **Solution B: Include Shared in Build**

**Why?**

- ✅ Simplest to implement
- ✅ Works with Vercel immediately
- ✅ No extra services needed
- ✅ Each deployment is self-contained
- ✅ Easy to switch later

**Setup** (5 minutes):

```bash
# Add copy script to both backend and frontend
# Update tsconfig.json paths
# Done!
```

### **Phase 2: MVP (Week 3-4)**

Stay with **Solution B** OR switch to **Solution A** if ready

**Trigger for upgrade**:

- You have 5+ shared packages
- You want version control on shared
- Team grows
- Multiple projects use same shared code

### **Phase 3: Production (Week 5+)**

Use **Solution A: npm Package** OR **Solution C: Monorepo Tool**

---

## 🔄 Implementation: Solution B Step-by-Step

### Step 1: Create shared directory

```bash
cd flint
mkdir -p shared/types
mkdir -p shared/validations
```

### Step 2: Create shared files

```bash
# shared/types/index.ts
export * from './auth.types'
export * from './errors.types'

# shared/validations/index.ts
export * from './auth.validation'
```

### Step 3: Update Backend

**backend/package.json**:

```json
{
  "scripts": {
    "prebuild": "npm run copy:shared",
    "copy:shared": "mkdir -p src/shared-types && cp -r ../shared/types src/shared-types/types && cp -r ../shared/validations src/shared-types/validations && echo '// Generated from ../shared' > src/shared-types/index.ts && cat ../shared/types/index.ts >> src/shared-types/index.ts",
    "build": "tsc",
    "dev": "npm run copy:shared && tsx --watch src/index.ts",
    "start": "node dist/index.js"
  }
}
```

**Or simpler** - use shell script:

**backend/scripts/copy-shared.sh**:

```bash
#!/bin/bash
rm -rf src/shared-types
mkdir -p src/shared-types
cp -r ../shared/types src/shared-types/
cp -r ../shared/validations src/shared-types/
```

**backend/package.json**:

```json
{
  "scripts": {
    "copy:shared": "bash scripts/copy-shared.sh",
    "prebuild": "npm run copy:shared",
    "build": "tsc"
  }
}
```

**backend/tsconfig.json**:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./src/shared-types/*"]
    }
  }
}
```

### Step 4: Update Frontend

**Same as backend**

### Step 5: Test locally

```bash
cd backend
npm run copy:shared
npm run build
# Should succeed ✅

cd frontend
npm run copy:shared
npm run build
# Should succeed ✅
```

### Step 6: Vercel Configuration

**backend/vercel.json**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "JWT_SECRET": "@jwt-secret",
    "DATABASE_URL": "@database-url"
  }
}
```

**frontend/vercel.json**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

---

## 📊 Comparison Table

| Solution             | Setup Time | Complexity | Production Ready | Scale     | Cost        |
| -------------------- | ---------- | ---------- | ---------------- | --------- | ----------- |
| **A: npm Package**   | 1 hour     | High       | Yes              | Excellent | npm account |
| **B: Copy Files**    | 15 min     | Low        | Yes              | Good      | Free        |
| **C: Monorepo Tool** | 2-3 hours  | Very High  | Yes              | Excellent | Free        |

---

## 🔗 Git Strategy

### Single Repo Approach (Recommended for Prototype)

```
flint/
├── .git
├── backend/
├── frontend/
├── shared/
└── package.json
```

**Vercel Setup**:

- Backend: `Root Directory: backend/`
- Frontend: `Root Directory: frontend/`

**Deploy together**: Changes to any folder trigger appropriate deployment

**Pros**: Single git repo, atomic updates  
**Cons**: Both services rebuild on any change

### Separate Repos Approach (Later)

When you're ready:

```
flint-backend/ → Vercel
flint-frontend/ → Vercel
flint-shared/ → npm package
```

---

## 🚀 Quick Start: Solution B

### For Backend

```bash
# 1. Add copy script
echo '#!/bin/bash
rm -rf src/shared-types
mkdir -p src/shared-types
cp -r ../shared/types src/shared-types/
cp -r ../shared/validations src/shared-types/' > backend/scripts/copy-shared.sh

chmod +x backend/scripts/copy-shared.sh

# 2. Update package.json scripts
# Add: "prebuild": "npm run copy:shared"
# Add: "copy:shared": "bash scripts/copy-shared.sh"

# 3. Update tsconfig.json paths
# Add to compilerOptions: "@shared/*": ["./src/shared-types/*"]

# 4. Test
cd backend
npm run copy:shared
npm run build
```

### For Frontend

```bash
# Same as backend
# Copy the script
# Update package.json
# Update tsconfig.json
# Test
cd frontend
npm run copy:shared
npm run build
```

---

## 💡 Troubleshooting

### Error: "Cannot find module '@shared'"

**Solution**: Did you run `npm run copy:shared`?

```bash
npm run copy:shared
npm run build
```

### Error: "TypeScript can't find types"

**Solution**: Check tsconfig.json paths:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./src/shared-types/*"] // Correct path?
    }
  }
}
```

### Vercel Build Fails

**Solution**: Check Vercel build command

```
Build Command: npm run build
(Prebuild script should run automatically)
```

### Shared files not updating in production

**Solution**: Make sure `.gitignore` doesn't exclude shared

```bash
# .gitignore should have:
backend/src/shared-types/
frontend/src/shared-types/

# But NOT:
shared/
```

---

## ✨ Best Practices

1. **Keep shared lightweight**

   - Only types and validations
   - No business logic
   - No dependencies if possible

2. **Single source of truth**

   - Edit in `/shared` folder only
   - Scripts copy to services during build
   - Never edit copied versions

3. **Version together**

   - Shared, backend, frontend in same commit
   - Prevents mismatch

4. **Test before deploy**

   ```bash
   cd backend && npm run copy:shared && npm run build
   cd frontend && npm run copy:shared && npm run build
   ```

5. **Document for team**
   - Add comment in README: "Run npm run copy:shared before build"
   - Add to CI/CD pipeline if you add one

---

## 🎯 Your Path Forward

### Week 1-2 (Now): Solution B

- Create shared folder
- Add copy scripts
- Test locally
- Deploy to Vercel
- ✅ Everything works

### Week 3-4: Evaluate

- Does monorepo feel right?
- How much shared code grew?
- Ready for npm package?

### Week 5+: Upgrade if Needed

- Publish to npm
- Use Nx or Turborepo
- Separate git repos
- Professional setup

---

## 📝 Summary

**Your situation**: Monorepo with separate Vercel deployments

**Best solution for prototype**: **Solution B (Copy Files)**

- 15 minutes to implement
- Works perfectly with Vercel
- Easy to upgrade later
- No extra services needed

**Implementation**:

1. Create `shared/` folder
2. Add `prebuild` script to backend & frontend
3. Update `tsconfig.json` paths
4. Test locally
5. Deploy to Vercel
6. Done ✅

**When to switch to npm package**:

- When shared code is stable
- Team grows
- Multiple projects share code
- Need version control on shared

---

**Start with Solution B. It's the fastest path to working prototype.** ✅
