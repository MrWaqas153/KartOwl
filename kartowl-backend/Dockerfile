FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN find /ms-playwright -name "chrome" -o -name "chromium" 2>/dev/null | head -5

RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start:prod"]