#!/bin/bash
# Auto-format changed files after edits
# Supports: JavaScript, TypeScript, CSS, JSON, Markdown

echo "🔧 Formatting changed files..."

# Get list of changed files in the working tree
changed_files=$(git diff --name-only --diff-filter=d --relative HEAD)

if [ -z "$changed_files" ]; then
    echo "✓ No files to format"
    exit 0
fi

# Format supported files
echo "$changed_files" | while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
        *.js|*.jsx|*.ts|*.tsx|*.css|*.json|*.md)
            if command -v prettier &> /dev/null; then
                prettier --write "$file" 2>/dev/null
                echo "✓ Formatted: $file"
            else
                echo "⚠ Prettier not found, skipping: $file"
            fi
            ;;
    esac
done

echo "✓ Formatting complete"
exit 0
