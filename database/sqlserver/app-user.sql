USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'panaderia_app')
BEGIN
    CREATE LOGIN panaderia_app WITH PASSWORD = 'TuPasswordSeguro123!';
END
GO

USE PanaderiaPasteleria;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'panaderia_app')
BEGIN
    CREATE USER panaderia_app FOR LOGIN panaderia_app;
END
GO

ALTER ROLE db_datareader ADD MEMBER panaderia_app;
ALTER ROLE db_datawriter ADD MEMBER panaderia_app;
GO
