FROM gliderlabs/alpine:3.1
RUN apk-install nodejs git python g++ make

RUN npm install -g bower gulp

WORKDIR /app

ADD package.json /app/
RUN npm install
ADD bower.json /app/
RUN bower install --allow-root
ADD . /app

ENTRYPOINT ["gulp"]

EXPOSE 8080