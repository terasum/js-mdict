#!/bin/bash
# scripts/download-test-data.sh

set -e

DEST_DIR="tests/data/freemdict"
mkdir -p "$DEST_DIR"

echo "Checking for wrangler..."
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler globally..."
    npm install -g wrangler
fi

echo "Starting download from R2 bucket: $R2_BUCKET_NAME..."

# List of files to download
FILES=(
    "internal_test_audio.mdx"
    "internal_test_audio.mdd"
    "internal_test_bilingual.mdx"
    "internal_test_bilingual.mdd"
    "internal_test_en_zh.mdx"
    "internal_test_collocation.mdx"
    "internal_test_collocation.mdd"
    "internal_test_zh_cn.mdx"
    "internal_test_synonym.mdx"
    "internal_test_synonym.mdd"
    "internal_test_idiom.mdx"
    "internal_test_phrasal.mdx"
    "internal_test_phrasal.mdd"
)

for FILE in "${FILES[@]}"; do
    echo "Downloading $FILE..."
    wrangler r2 object get "$R2_BUCKET_NAME/$FILE" --file "$DEST_DIR/$FILE" --remote
done

echo "All test data downloaded successfully to $DEST_DIR"
