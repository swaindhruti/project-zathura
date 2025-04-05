FROM golang:1.24-alpine AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum* ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /hectoclash-server .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=build /hectoclash-server /app/

EXPOSE 8080

CMD ["/app/hectoclash-server"]