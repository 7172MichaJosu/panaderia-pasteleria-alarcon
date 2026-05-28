@echo off
echo Creando base de datos PanaderiaPasteleria en localhost...
sqlcmd -S localhost -E -i database\sqlserver\schema.sql
sqlcmd -S localhost -E -i database\sqlserver\seed.sql
sqlcmd -S localhost -E -i database\sqlserver\app-user.sql
echo Listo. Ahora cambia USE_MOCK_DB="false" en .env.local
pause
