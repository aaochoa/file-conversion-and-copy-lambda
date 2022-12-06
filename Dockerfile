FROM public.ecr.aws/lambda/nodejs:18

RUN yum install -y sox

COPY ./package.json ./
COPY ./package-lock.json ./ 

RUN npm ci

COPY . ./

CMD [ "dist/index.handler" ]
