FROM python:3
WORKDIR /usr/src/app
COPY machine_systems/requirements.txt .
RUN pip install -r ./requirements.txt
COPY machine_systems .
EXPOSE 8888
CMD [ "python", "./app.py" ]
