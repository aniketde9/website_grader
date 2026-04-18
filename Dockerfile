FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

ENV NODE_ENV=production

# System deps for Chromium already in base image
CMD ["node", "src/index.js", "grade", "--input", "ads.csv", "--output", "results.csv"]
