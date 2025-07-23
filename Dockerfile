# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine as base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Generate and set a Unix timestamp dynamically
RUN echo "NEXT_PUBLIC_BUILD_TIME=$(date +%s)" > /app/.env.local

# Throw-away build stage to reduce size of final image
FROM base as build

ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST

# Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install -y python-is-python3 pkg-config build-essential 

RUN apk add --no-cache libc6-compat
RUN apk add g++ make py3-pip

# Install node modules
COPY --link package.json package-lock.json ./
RUN npm ci --include=dev

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
