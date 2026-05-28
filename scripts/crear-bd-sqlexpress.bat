@echo off
echo Creando base de datos PanaderiaPasteleria en .\SQLEXPRESS...
sqlcmd -S .\SQLEXPRESS -E -i database\sqlserver\schema.sql
sqlcmd -S .\SQLEXPRESS -E -i database\sqlserver\seed.sql
sqlcmd -S .\SQLEXPRESS -E -i database\sqlserver\app-user.sql
echo Listo. Ahora cambia USE_MOCK_DB="false" en .env.local y SQLSERVER_SERVER=".\SQLEXPRESS"
pause
