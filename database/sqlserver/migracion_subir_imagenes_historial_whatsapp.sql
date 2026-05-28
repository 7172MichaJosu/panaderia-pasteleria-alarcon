USE PanaderiaPasteleria;
GO

IF COL_LENGTH('Products', 'ImageUrl') IS NOT NULL
BEGIN
  ALTER TABLE Products ALTER COLUMN ImageUrl NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('OrderItems', 'ProductImageUrl') IS NOT NULL
BEGIN
  ALTER TABLE OrderItems ALTER COLUMN ProductImageUrl NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('OrderNotifications', 'U') IS NULL
BEGIN
  CREATE TABLE OrderNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    Channel NVARCHAR(30) NOT NULL DEFAULT 'WhatsApp',
    Message NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_OrderNotifications_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_OrderNotifications_OrderId')
BEGIN
  CREATE INDEX IX_OrderNotifications_OrderId ON OrderNotifications(OrderId);
END
GO
