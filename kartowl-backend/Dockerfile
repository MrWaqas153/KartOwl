FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci

# ✨ YE LINE ADD KAREIN: Yeh package.json ke exact version wala browser laayegi
RUN npx playwright install chromium --with-deps

COPY . .

RUN npm run build

# Space bachane ke liye (optional step jo aapne likha tha)
RUN find /ms-playwright -type f -name "chrome*" | head -10 && ls /ms-playwright/

RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start:prod"]