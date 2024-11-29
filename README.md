# Proyecto de Gestión de Materias

A continuación, encontrarás los pasos para configurar y ejecutar el proyecto en tu entorno local.

---

## Requisitos previos

- Tener instalado [Docker](https://www.docker.com/).
- Clonar el repositorio del proyecto.

---

## Configuración y ejecución

### 1. Clonar el repositorio

Clona el repositorio del proyecto en tu máquina local

## 2. Iniciar Docker

Asegúrate de que Docker esté ejecutándose en tu máquina antes de continuar.

## 3. Construir y levantar los servicios con Docker Compose

Ejecuta el siguiente comando para construir las imágenes y levantar los contenedores en segundo plano:

```bash
docker-compose up -d --build
```
Esto levantará tanto la aplicación como la base de datos configurada en el archivo docker-compose.yml.

### 4. Ejecutar comando de Prisma: 

```bash
npx prisma migrate dev --name init
```

### 4. Ejecutar comando de Prisma: 

```bash
npx prisma migrate dev --name init
```

