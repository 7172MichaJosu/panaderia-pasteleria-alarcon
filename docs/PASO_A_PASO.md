# Guía paso a paso para ejecutar el sistema

## 1. Descomprimir el ZIP

Descomprime el archivo en una ruta sencilla, por ejemplo:

```txt
C:\Users\TU_USUARIO\Desktop\panaderia-pasteleria
```

## 2. Abrir en Visual Studio Code

Entra a la carpeta, clic derecho y elige **Abrir con Code**.

También puedes abrir terminal y escribir:

```bash
cd Desktop\panaderia-pasteleria
code .
```

## 3. Instalar dependencias

En la terminal de VS Code:

```bash
npm install
```

## 4. Crear archivo de configuración

En Windows PowerShell:

```powershell
copy .env.example .env.local
```

Si usas CMD:

```cmd
copy .env.example .env.local
```

## 5. Ejecutar en modo demo

```bash
npm run dev
```

Abre:

```txt
http://localhost:3000
```

Panel administrador:

```txt
http://localhost:3000/admin
```

Usuario:

```txt
admin
```

Contraseña:

```txt
Admin123!
```

## 6. Probar pedido

1. Entra a la tienda.
2. Agrega productos al carrito.
3. Llena nombres completos, DNI, celular, lugar, método de pago y fecha.
4. Pulsa **Registrar y confirmar por WhatsApp**.
5. Se abrirá WhatsApp con el resumen del pedido.

## 7. Conectar SQL Server

Abre SQL Server Management Studio y prueba con:

```txt
localhost
```

Si no entra, prueba:

```txt
.\SQLEXPRESS
```

Luego ejecuta:

```bash
sqlcmd -S localhost -E -i database/sqlserver/schema.sql
sqlcmd -S localhost -E -i database/sqlserver/seed.sql
sqlcmd -S localhost -E -i database/sqlserver/app-user.sql
```

Si usas SQL Express:

```bash
sqlcmd -S .\SQLEXPRESS -E -i database/sqlserver/schema.sql
sqlcmd -S .\SQLEXPRESS -E -i database/sqlserver/seed.sql
sqlcmd -S .\SQLEXPRESS -E -i database/sqlserver/app-user.sql
```

## 8. Activar conexión SQL Server en el proyecto

Abre `.env.local` y cambia:

```env
USE_MOCK_DB="false"
```

Revisa estos datos:

```env
SQLSERVER_SERVER="localhost"
SQLSERVER_PORT="1433"
SQLSERVER_DATABASE="PanaderiaPasteleria"
SQLSERVER_USER="panaderia_app"
SQLSERVER_PASSWORD="TuPasswordSeguro123!"
SQLSERVER_ENCRYPT="false"
SQLSERVER_TRUST_CERT="true"
```

Reinicia:

```bash
CTRL + C
npm run dev
```

## 9. Cambiar número de WhatsApp

Abre `.env.local` y cambia:

```env
WHATSAPP_BUSINESS_NUMBER="51999999999"
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER="51999999999"
```

Coloca el número real con código de país, por ejemplo Perú:

```env
WHATSAPP_BUSINESS_NUMBER="51987654321"
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER="51987654321"
```

## 10. Publicar después

Primero prueba todo local. Cuando ya funcione:

1. Sube el proyecto a GitHub.
2. Importa el proyecto en Vercel.
3. Configura las variables de entorno.
4. Usa una base SQL Server remota, no `localhost`.
5. Para app móvil, primero úsalo como PWA y luego convierte con Capacitor.
