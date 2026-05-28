# Panadería Pastelería y fuente de soda Alarcón

Sistema web para catálogo, pedidos y reservas online con panel administrador, reportes y confirmación por WhatsApp.

## Incluye

- Tienda pública responsive para celular, tablet, laptop y PC.
- Carrito de compras.
- Registro de pedido o reserva sin DNI.
- Envío del resumen al WhatsApp del negocio.
- Panel administrador con usuario y contraseña.
- Crear, editar, activar/desactivar productos.
- Selección directa de imagen JPG/PNG/WEBP desde PC, laptop, tablet o celular.
- Ver pedidos y cambiar estado.
- Enviar aviso al cliente por WhatsApp según estado.
- Historial de avisos generados.
- Reportes con gráficos.
- Scripts para SQL Server.
- Manifest PWA para instalar como app desde navegador.

## Ejecutar en local

```bash
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```

Abre:

```txt
http://localhost:3000
```

Panel administrador:

```txt
http://localhost:3000/admin
```

Acceso demo:

```txt
Usuario: admin
Contraseña: Admin123!
```

## SQL Server

Crear base de datos nueva:

```bash
sqlcmd -S localhost -E -i database/sqlserver/schema.sql
sqlcmd -S localhost -E -i database/sqlserver/seed.sql
sqlcmd -S localhost -E -i database/sqlserver/app-user.sql
```

Si ya tenías base antigua:

```bash
sqlcmd -S localhost -E -i database/sqlserver/migracion_subir_imagenes_historial_whatsapp.sql
```

Luego cambia en `.env.local`:

```env
USE_MOCK_DB="false"
```

## WhatsApp

Número del negocio configurado:

```env
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER="51900987261"
WHATSAPP_BUSINESS_NUMBER="51900987261"
```

El sistema usa links de WhatsApp para abrir el chat con el mensaje listo. Para envío automático real de imágenes como archivo se necesita WhatsApp Cloud API.
Actualización de despliegue 2026-05-28
