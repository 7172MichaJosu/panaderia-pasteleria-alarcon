USE PanaderiaPasteleria;
GO

-- Ejecuta este archivo SOLO si ya tenías la base antigua creada.
-- Quita el campo DNI y agrega imagen por producto en el detalle de pedido.

IF COL_LENGTH('Orders', 'DNI') IS NOT NULL
BEGIN
  ALTER TABLE Orders DROP COLUMN DNI;
END
GO

IF COL_LENGTH('OrderItems', 'ProductImageUrl') IS NULL
BEGIN
  ALTER TABLE OrderItems ADD ProductImageUrl NVARCHAR(500) NULL;
END
GO

UPDATE Orders SET Status = 'Registrado' WHERE Status = 'Pendiente';
GO
