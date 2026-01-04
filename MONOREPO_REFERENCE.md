# Monorepo Quick Reference

Your single-repo monorepo setup with backend, frontend, and shared code.

---

## 🏗️ Folder Structure

```
flint/                          ← Main repo
├── package.json                ← Root workspace config
├── shared/                     ← Shared types & validations
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── errors.types.ts
│   │   └── index.ts
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   └── index.ts
│   └── package.json
├── backend/                    ← Vercel deployment #1
│   ├── src/
│   │   ├── features/
│   │   ├── shared/
│   │   └── index.ts
│   ├── scripts/
│   │   └── copy-shared.sh
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── frontend/                   ← Vercel deployment #2
│   ├── src/
│   │   ├── features/
│   │   ├── shared/
│   │   └── app/
│   ├── scripts/
│   │   └── copy-shared.sh
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
└── .gitignore
```

---

## 📦 Root `package.json` (Workspaces)

```json
{
  "name": "flint",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "install-all": "npm install",
    "dev:backend": "npm run dev -w backend",
    "dev:frontend": "npm run dev -w frontend",
    "dev": "npm run dev:backend & npm run dev:frontend",
    "build": "npm run build -w backend && npm run build -w frontend"
  }
}
```

---

## 🔄 Local Development (Works Perfectly)

```bash
# Install everything (one command)
npm install

# Run backend
npm run dev:backend

# Run frontend (separate terminal)
npm run dev:frontend

# Both services automatically have @flint/shared available
```

**Imports work locally:**

```typescript
import type { LoginResponse } from '@flint/shared/types'
import { loginValidation } from '@flint/shared/validations'
```

---

## 🚀 Deployment to Vercel (Solution B: Copy Files)

### Before Every Build

Create scripts that copy shared files:

**backend/scripts/copy-shared.sh**:

```bash
#!/bin/bash
rm -rf src/shared-types
mkdir -p src/shared-types
cp -r ../shared/types src/shared-types/
cp -r ../shared/validations src/shared-types/
echo "✅ Shared files copied to backend"
```

**frontend/scripts/copy-shared.sh**:

```bash
#!/bin/bash
rm -rf src/shared-types
mkdir -p src/shared-types
cp -r ../shared/types src/shared-types/
cp -r ../shared/validations src/shared-types/
echo "✅ Shared files copied to frontend"
```

---

## 📝 Config Files

### Root `.gitignore`

```gitignore
node_modules/
.env
.env.local
.DS_Store

# Copied shared files (never commit)
backend/src/shared-types/
frontend/src/shared-types/

# Build output
backend/dist/
frontend/.next/
```

### `backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "copy:shared": "bash scripts/copy-shared.sh",
    "prebuild": "npm run copy:shared",
    "build": "tsc",
    "dev": "npm run copy:shared && tsx --watch src/index.ts",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^5.1.0",
    "zod": "^4.3.4"
  }
}
```

### `backend/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "strict": true,
    "sourceMap": true,
    "declaration": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared-types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `backend/vercel.json`

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

### `frontend/package.json`

Same structure as backend, with:

```json
{
  "scripts": {
    "copy:shared": "bash scripts/copy-shared.sh",
    "prebuild": "npm run copy:shared",
    "build": "next build",
    "dev": "npm run copy:shared && next dev",
    "start": "next start"
  }
}
```

### `frontend/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@shared/*": ["src/shared-types/*"]
    }
  }
}
```

### `frontend/vercel.json`

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

## ✅ Testing Locally

```bash
# Test backend build
cd backend
npm run copy:shared
npm run build
npm run type-check
npm run lint
# All should pass ✅

# Test frontend build
cd frontend
npm run copy:shared
npm run build
npm run lint
# All should pass ✅
```

---

## 🚀 Vercel Setup

### For Backend

1. Connect repo to Vercel
2. Select `flint` repo
3. Framework: **Other** (Node.js)
4. Root Directory: `backend/`
5. Build Command: `npm run build` (automatically runs prebuild)
6. Output Directory: `dist/`
7. Install Command: `npm install`
8. Add environment variables (JWT_SECRET, DATABASE_URL, etc)
9. Deploy!

### For Frontend

1. Connect same repo to Vercel
2. Select `flint` repo
3. Framework: **Next.js**
4. Root Directory: `frontend/`
5. Build Command: `npm run build` (automatically runs prebuild)
6. Output Directory: `.next/`
7. Install Command: `npm install`
8. Add environment variables (NEXT_PUBLIC_API_URL, etc)
9. Deploy!

---

## 🔄 Workflow

### Adding New Shared Type

1. **Edit** `/shared/types/auth.types.ts`
2. **Commit** to git
3. **Done!** (Both services get it on next build)

```bash
# After editing shared files
git add shared/
git commit -m "Add new auth type"
git push
# Automatic redeploy on both Vercel apps
```

### Updating Shared Validation

1. **Edit** `/shared/validations/auth.validation.ts`
2. **Commit** to git
3. **Done!** (Both services get it on next build)

---

## 🐛 Debugging

### Script not running?

```bash
# Make sure script is executable
chmod +x backend/scripts/copy-shared.sh
chmod +x frontend/scripts/copy-shared.sh

# Test manually
bash backend/scripts/copy-shared.sh
bash frontend/scripts/copy-shared.sh
```

### Can't find @shared types?

```bash
# Did you run the copy script?
npm run copy:shared

# Check tsconfig.json paths
# Should have: "@shared/*": ["src/shared-types/*"]

# Check files exist
ls -la backend/src/shared-types/
```

### Vercel build fails?

```
npm ERR! Cannot find module
```

**Solution**: Check that prebuild script runs

- Build log should show "✅ Shared files copied"
- If not, check `package.json` has `"prebuild"` script

---

## 📊 Summary Table

| Phase       | Location   | Action                            | Deploy            |
| ----------- | ---------- | --------------------------------- | ----------------- |
| **Dev**     | Local      | Edit shared/, backend/, frontend/ | N/A               |
| **Build**   | Local      | `npm run build` (runs prebuild)   | Test locally      |
| **Deploy**  | Vercel     | Push to git                       | Auto-copies files |
| **Runtime** | Production | Uses copied files                 | Works ✅          |

---

## 🎯 When to Upgrade

**Upgrade to npm package when**:

- Shared code becomes 500+ lines
- Multiple projects use same code
- Need version control on shared
- Team grows and needs clear ownership

**For now**: Solution B (copy files) is perfect ✅

---

## 📞 Quick Troubleshooting

| Problem            | Solution                              |
| ------------------ | ------------------------------------- |
| Module not found   | Run `npm run copy:shared`             |
| Build fails        | Check script exists and is executable |
| Types not updating | Clear `src/shared-types/` and rebuild |
| Vercel fails       | Check prebuild runs in logs           |

---

**Status**: Ready for production monorepo ✅
