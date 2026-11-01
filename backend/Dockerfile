# Stage 1: Build
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy modules and manifests
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build app
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Final Run
FROM alpine:latest

WORKDIR /app

# Copy built binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
