# syntax=docker/dockerfile:1.7
FROM node:24-trixie-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_JIRA_URL=https://wavix-cloud.atlassian.net
ENV NEXT_PUBLIC_JIRA_URL=$NEXT_PUBLIC_JIRA_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-trixie-slim

WORKDIR /app

RUN npm install -g pnpm@10 \
    && groupadd --gid 10001 testgrid \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin testgrid \
    && mkdir /data \
    && chown testgrid:testgrid /data

COPY --from=build --chown=testgrid:testgrid /app /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_PATH=/data/database.sqlite

USER testgrid

EXPOSE 7045

CMD ["sh", "-c", "pnpm migrate up && exec pnpm start"]
