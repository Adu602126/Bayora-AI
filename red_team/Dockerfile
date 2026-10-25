FROM python:3.11-slim

WORKDIR /app

RUN groupadd -g 10001 bayora && \
    useradd -u 10001 -g bayora -s /bin/false bayora

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R bayora:bayora /app

USER 10001:10001

CMD ["python", "attack_runner.py", "--batch"]
