FROM gliderlabs/alpine:3.1
RUN apk-install nodejs git python g++ make

RUN npm install -g bower gulp

WORKDIR /app

ADD package.json /app/
RUN npm install
ADD bower.json /app/
RUN bower install --allow-root
ADD . /app
#COPY config/client.js-dist /app/client/public/assets/js/config.js
COPY config/server.js-dist /app/config/server.js
COPY config/client.js-dist /app/config/client.js

ENV NODE_ENV production

ENTRYPOINT ["gulp"]

EXPOSE 8080