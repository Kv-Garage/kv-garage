#!/usr/bin/env bash
set -e

echo "🔧 Applying Netlify form + site fixes..."

# Ensure scripts runs from repo root
ROOT_DIR="$(pwd)"

# ---- FIX FORMS ----
find . -name "*.html" -type f | while read -r file; do
  # Add netlify attribute to forms if missing
  sed -i '' 's/<form/<form name="contact" method="POST" data-netlify="true"/g' "$file" || true

  # Add hidden Netlify form input if missing
  if ! grep -q 'form-name' "$file"; then
    sed -i '' 's|<form[^>]*>|&\n<input type="hidden" name="form-name" value="contact" />|g' "$file" || true
  fi

  # Ensure closing form tag exists
  if ! grep -q '</form>' "$file"; then
    echo '</form>' >> "$file"
  fi
done

# ---- NETLIFY TOML ----
if [ ! -f netlify.toml ]; then
cat <<EOF > netlify.toml
[build]
publish = "."
command = "echo 'Netlify build ready'"

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
EOF
fi

echo "✅ Fixes applied successfully"
