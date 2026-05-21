FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci

RUN npx playwright install chromium --with-deps

# ✨ YAHAN MAGIC HAI: Playwright 1.57 ke naye folder ka shortcut (symlink) bana rahe hain
RUN ln -s /ms-playwright/chromium-1200/chrome-linux64 /ms-playwright/chromium-1200/chrome-linux

COPY . .

RUN npm run build

RUN find /ms-playwright -type f -name "chrome*" | head -10 && ls /ms-playwright/

RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start:prod"]