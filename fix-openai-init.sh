#!/bin/bash

FILES=$(grep -rl "new OpenAI" app/api)

for FILE in $FILES; do
  echo "Fixing $FILE"

  # Remove top-level const openai = new OpenAI(...)
  perl -0777 -pi -e "s/const openai = new OpenAI\([^;]+;\n//g" "$FILE"

  # Insert getOpenAI function after imports if not present
  if ! grep -q "function getOpenAI" "$FILE"; then
    perl -0777 -pi -e "s/(import[^;]+;\n+)/\$1\nfunction getOpenAI() {\n  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\n}\n\n/" "$FILE"
  fi

  # Replace openai. usage with local init
  perl -0777 -pi -e "s/(\n\s*)(const|let)?\s*openai\./\1const openai = getOpenAI();\n\1openai./g" "$FILE"

done

echo "Done."
