#!/usr/bin/env bash
set -e
# Copy shared types and validations into backend/src/shared-types
TARGET_DIR="src/shared-types"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -r ../shared/types "$TARGET_DIR/"
cp -r ../shared/validations "$TARGET_DIR/"
echo "✅ Shared files copied to backend: $TARGET_DIR"
