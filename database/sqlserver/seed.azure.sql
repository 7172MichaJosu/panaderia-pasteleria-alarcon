INSERT INTO dbo.Products (Name, Description, Category, Price, Stock, ImageUrl, IsActive)
VALUES
('Pan francés', 'Pan crocante recién horneado para desayuno familiar.', 'Panes', 0.40, 300, N'🥖', 1),
('Pan integral', 'Pan saludable elaborado con harina integral.', 'Panes', 0.70, 160, N'🍞', 1),
('Torta de chocolate', 'Torta húmeda de chocolate con crema especial para cumpleaños.', 'Tortas', 55.00, 12, N'🎂', 1),
('Torta tres leches', 'Postre suave y cremoso para ocasiones especiales.', 'Tortas', 60.00, 10, N'🍰', 1),
('Empanada de pollo', 'Empanada horneada con relleno de pollo y verduras.', 'Pasteles', 3.50, 60, N'🥟', 1),
('Queque marmoleado', 'Queque suave de vainilla y chocolate.', 'Queques', 18.00, 15, N'🧁', 1),
('Jugo especial', 'Bebida natural preparada al momento.', 'Fuente de soda', 7.00, 40, N'🥤', 1),
('Café pasado', 'Café caliente para acompañar panes y pasteles.', 'Fuente de soda', 4.00, 80, N'☕', 1);
GO

INSERT INTO dbo.AdminUsers (Username, PasswordNote, IsActive)
VALUES ('admin', 'El acceso real se configura en .env.local con ADMIN_USER y ADMIN_PASSWORD.', 1);
GO
