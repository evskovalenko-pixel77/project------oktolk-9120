FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install fastapi uvicorn sqlalchemy PyJWT passlib bcrypt python-multipart email-validator python-jose[cryptography] --no-cache-dir
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]