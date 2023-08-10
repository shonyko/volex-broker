# docker build -t imageName:latest .
# docker run --name containerName -ti imageName:latest
# docker run -it --privileged --device=/dev/ttyUSB0 --platform linux/arm/v7 volex/serial-listener:latest
FROM node:slim

# install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*

# setup workspace
COPY . /app
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# define entrypoint
CMD ["node", "index.js"]
