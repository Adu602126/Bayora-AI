FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn httpx pydantic
COPY app.py /app/app.py
USER 10001:10001
CMD [uvicorn, app:app, --host, 0.0.0.0, --port, 8000]
