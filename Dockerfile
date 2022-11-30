FROM public.ecr.aws/lambda/nodejs:18

RUN yum install -y sox

COPY . ./

CMD [ "src/index.handler" ]
