USE PanaderiaPasteleria;
GO

INSERT INTO Products (Name, Description, Category, Price, Stock, ImageUrl, IsActive) VALUES
('Pan francés', 'Pan crocante recién horneado, ideal para el desayuno familiar.', 'Panes', 0.40, 300, '/productos/pan-frances.jpg', 1),
('Torta de chocolate', 'Torta húmeda de chocolate con crema especial para cumpleaños y reuniones.', 'Tortas', 55.00, 12, '/productos/torta-chocolate.jpg', 1),
('Empanada de pollo', 'Empanada horneada con relleno de pollo, verduras y sazón de casa.', 'Pasteles', 3.50, 60, '/productos/empanada-pollo.jpg', 1),
('Jugo especial', 'Bebida natural preparada al momento para acompañar tus pedidos.', 'Fuente de soda', 7.00, 40, '/productos/jugo-especial.jpg', 1),
('Queque marmoleado', 'Queque suave de vainilla y chocolate, ideal para compartir.', 'Queques', 18.00, 15, '/productos/queque-marmoleado.jpg', 1);
GO
