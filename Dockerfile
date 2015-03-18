FROM gliderlabs/alpine:3.1
RUN apk-install nodejs git python g++ make

RUN npm install -g bower gulp

RUN mkdir -p /app/config && \
    mkdir -p /app/client/public
COPY ./config/client.js-dist /app/client/public/assets/js/config.js
COPY ./config/server.js-dist /app/config/server.js

WORKDIR /app

ADD package.json /app/
RUN npm install
ADD bower.json /app/
RUN bower install --allow-root
ADD . /app
ENV NODE_ENV production

ENTRYPOINT ["gulp"]

EXPOSE 8080