# 1. Builder local: Usamos a imagem oficial do Rust para compilar o Tracker
FROM rust:1.92 as builder

# Cria uma pasta temporária para compilar o projeto inteiro
WORKDIR /usr/src/app
# Copia todos os arquivos do repositório onion_poc
# Instala dependências para compilar o egui/eframe (necessário para o workspace)
RUN apt-get update && apt-get install -y \
    libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev libwebkit2gtk-4.1-dev \
    libxcb-render0-dev libxcb-shape0-dev libxcb-xfixes0-dev \
    libxkbcommon-dev libwayland-dev pkg-config

COPY . .

# Compila apenas o executável do Tracker em modo release
WORKDIR /usr/src/app/src-tauri
RUN cargo build --release --bin tracker

# 2. Imagem final do Servidor: Super leve e focada apenas em rodar
FROM debian:bookworm-slim

# Instala certificados necessários para conexões + curl para debug
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Copia do builder o binário gerado acima
COPY --from=builder /usr/src/app/src-tauri/target/release/tracker /usr/local/bin/tracker

# Define algumas env vars e a porta interna
ENV RUST_LOG=info
EXPOSE 8080

# Inicia o Servidor Rastreador
CMD ["tracker"]
