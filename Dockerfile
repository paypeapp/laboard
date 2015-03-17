FROM gliderlabs/alpine:3.1
RUN apk-install nodejs git python g++ make

RUN npm install -g bower gulp

RUN mkdir -p /app/config && \
    mkdir -p /app/client/public

COPY ./bin /app/bin
COPY ./server /app/server
COPY ./client/ /app/client/
COPY ./config/client.js-dist /app/client/public/assets/js/config.js
COPY ./config/server.js-dist /app/config/server.js
COPY ./bower.json /app/bower.json
COPY ./gulpfile.js /app/gulpfile.js

WORKDIR /app

COPY ./package.json /app/package.json
RUN npm install && \
    npm dedupe && \
    npm cache clean && \
    (rm -rf /tmp/* || true)

ENV NODE_ENV production

RUN bower install --allow-root

ENTRYPOINT ["gulp"]

EXPOSE 8080
