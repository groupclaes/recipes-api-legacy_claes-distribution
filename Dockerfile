# ---- Deps ----
FROM --platform=linux/amd64 groupclaes/npm AS depedencies

# change the working directory to new exclusive app folder
WORKDIR /usr/src/app

# copy package file
COPY package.json ./

# install node packages
RUN npm install --omit=dev


# ---- Build ----
FROM depedencies AS build

# copy project
COPY ./ ./

# install node packages
RUN npm install

# create esbuild package
RUN esbuild ./index.ts --bundle --platform=node --minify --packages=external --external:'./config' --outfile=index.min.js


# --- release ---
FROM --platform=linux/amd64 groupclaes/node

# set current user to node
USER node

# change the working directory to new exclusive app folder
WORKDIR /usr/src/app

# copy dependencies
COPY --chown=node:node --from=depedencies /usr/src/app ./

# copy project file
COPY --chown=node:node --from=build /usr/src/app/index.min.js ./

# command to run when intantiate an image
CMD ["node","index.min.js"]