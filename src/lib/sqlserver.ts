import sql from "mssql";
import { appConfig } from "./config";
import { CartItem, Order, OrderNotification, OrderStatus, Product, ReportSummary } from "./types";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getPool() {
  if (appConfig.useMockDb) return null;

  if (!poolPromise) {
    const config: sql.config = {
      server: process.env.SQLSERVER_SERVER || "localhost",
      port: Number(process.env.SQLSERVER_PORT || 1433),
      database: process.env.SQLSERVER_DATABASE || "PanaderiaPasteleria",
      user: process.env.SQLSERVER_USER,
      password: process.env.SQLSERVER_PASSWORD,
      options: {
        encrypt: process.env.SQLSERVER_ENCRYPT === "true",
        trustServerCertificate: process.env.SQLSERVER_TRUST_CERT !== "false"
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    };

    poolPromise = new sql.ConnectionPool(config).connect();
  }

  return poolPromise;
}

function mapProduct(row: any): Product {
  return {
    id: row.Id,
    name: row.Name,
    description: row.Description || "",
    category: row.Category,
    price: Number(row.Price),
    stock: Number(row.Stock),
    imageUrl: row.ImageUrl || "🥐",
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : undefined
  };
}

function mapOrderHeader(row: any): Order {
  return {
    id: row.Id,
    code: row.Code,
    customerName: row.CustomerName,
    phone: row.Phone,
    address: row.Address,
    orderType: row.OrderType,
    paymentMethod: row.PaymentMethod,
    deliveryDate: row.DeliveryDate ? new Date(row.DeliveryDate).toISOString() : null,
    notes: row.Notes || "",
    status: row.Status,
    total: Number(row.Total),
    items: [],
    notifications: [],
    createdAt: new Date(row.CreatedAt).toISOString()
  };
}

function mapNotification(row: any): OrderNotification {
  return {
    id: row.Id,
    orderId: row.OrderId,
    status: row.Status,
    channel: "WhatsApp",
    message: row.Message || "",
    createdAt: new Date(row.CreatedAt).toISOString()
  };
}

export const sqlServerStore = {
  async getProducts(activeOnly = false) {
    const pool = await getPool();
    if (!pool) return [];
    const result = await pool
      .request()
      .input("activeOnly", sql.Bit, activeOnly)
      .query(`
        SELECT Id, Name, Description, Category, Price, Stock, ImageUrl, IsActive, CreatedAt
        FROM Products
        WHERE (@activeOnly = 0 OR IsActive = 1)
        ORDER BY CreatedAt DESC
      `);
    return result.recordset.map(mapProduct);
  },

  async createProduct(input: Omit<Product, "id" | "createdAt">) {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const result = await pool
      .request()
      .input("name", sql.NVarChar(120), input.name)
      .input("description", sql.NVarChar(500), input.description)
      .input("category", sql.NVarChar(80), input.category)
      .input("price", sql.Decimal(10, 2), input.price)
      .input("stock", sql.Int, input.stock)
      .input("imageUrl", sql.NVarChar(sql.MAX), input.imageUrl)
      .input("isActive", sql.Bit, input.isActive)
      .query(`
        INSERT INTO Products (Name, Description, Category, Price, Stock, ImageUrl, IsActive)
        OUTPUT inserted.Id, inserted.Name, inserted.Description, inserted.Category, inserted.Price, inserted.Stock, inserted.ImageUrl, inserted.IsActive, inserted.CreatedAt
        VALUES (@name, @description, @category, @price, @stock, @imageUrl, @isActive)
      `);
    return mapProduct(result.recordset[0]);
  },

  async updateProduct(id: number, input: Partial<Product>) {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const current = await pool.request().input("id", sql.Int, id).query("SELECT * FROM Products WHERE Id = @id");
    if (!current.recordset[0]) return null;
    const p = { ...mapProduct(current.recordset[0]), ...input };
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar(120), p.name)
      .input("description", sql.NVarChar(500), p.description)
      .input("category", sql.NVarChar(80), p.category)
      .input("price", sql.Decimal(10, 2), p.price)
      .input("stock", sql.Int, p.stock)
      .input("imageUrl", sql.NVarChar(sql.MAX), p.imageUrl)
      .input("isActive", sql.Bit, p.isActive)
      .query(`
        UPDATE Products
        SET Name=@name, Description=@description, Category=@category, Price=@price, Stock=@stock, ImageUrl=@imageUrl, IsActive=@isActive
        OUTPUT inserted.Id, inserted.Name, inserted.Description, inserted.Category, inserted.Price, inserted.Stock, inserted.ImageUrl, inserted.IsActive, inserted.CreatedAt
        WHERE Id=@id
      `);
    return mapProduct(result.recordset[0]);
  },

  async createOrder(input: Omit<Order, "id" | "code" | "status" | "createdAt" | "total" | "notifications"> & { items: CartItem[] }) {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const total = input.items.reduce((sum, item) => sum + item.subtotal, 0);
    const code = `PED-${Date.now().toString().slice(-8)}`;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const orderResult = await new sql.Request(transaction)
        .input("code", sql.NVarChar(30), code)
        .input("customerName", sql.NVarChar(160), input.customerName)
        .input("phone", sql.NVarChar(30), input.phone)
        .input("address", sql.NVarChar(250), input.address)
        .input("orderType", sql.NVarChar(20), input.orderType)
        .input("paymentMethod", sql.NVarChar(50), input.paymentMethod)
        .input("deliveryDate", sql.DateTime2, input.deliveryDate ? new Date(input.deliveryDate) : null)
        .input("notes", sql.NVarChar(500), input.notes)
        .input("total", sql.Decimal(10, 2), total)
        .query(`
          INSERT INTO Orders (Code, CustomerName, Phone, Address, OrderType, PaymentMethod, DeliveryDate, Notes, Status, Total)
          OUTPUT inserted.*
          VALUES (@code, @customerName, @phone, @address, @orderType, @paymentMethod, @deliveryDate, @notes, 'Registrado', @total)
        `);
      const orderId = orderResult.recordset[0].Id;
      for (const item of input.items) {
        await new sql.Request(transaction)
          .input("orderId", sql.Int, orderId)
          .input("productId", sql.Int, item.productId)
          .input("productName", sql.NVarChar(120), item.name)
          .input("productImageUrl", sql.NVarChar(sql.MAX), item.imageUrl || "")
          .input("quantity", sql.Int, item.quantity)
          .input("unitPrice", sql.Decimal(10, 2), item.unitPrice)
          .input("subtotal", sql.Decimal(10, 2), item.subtotal)
          .query(`
            INSERT INTO OrderItems (OrderId, ProductId, ProductName, ProductImageUrl, Quantity, UnitPrice, Subtotal)
            VALUES (@orderId, @productId, @productName, @productImageUrl, @quantity, @unitPrice, @subtotal)
          `);
      }
      await transaction.commit();
      return { ...mapOrderHeader(orderResult.recordset[0]), items: input.items };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getOrders() {
    const pool = await getPool();
    if (!pool) return [];
    const ordersResult = await pool.request().query(`SELECT * FROM Orders ORDER BY CreatedAt DESC`);
    const itemsResult = await pool.request().query(`SELECT * FROM OrderItems ORDER BY Id ASC`);
    const notificationsResult = await pool.request().query(`
      IF OBJECT_ID('OrderNotifications', 'U') IS NOT NULL
        SELECT * FROM OrderNotifications ORDER BY CreatedAt DESC
      ELSE
        SELECT CAST(NULL AS INT) AS Id WHERE 1 = 0
    `);
    const itemsByOrder = new Map<number, CartItem[]>();
    for (const row of itemsResult.recordset) {
      const item: CartItem = {
        productId: row.ProductId,
        name: row.ProductName,
        quantity: row.Quantity,
        unitPrice: Number(row.UnitPrice),
        subtotal: Number(row.Subtotal),
        imageUrl: row.ProductImageUrl || ""
      };
      itemsByOrder.set(row.OrderId, [...(itemsByOrder.get(row.OrderId) || []), item]);
    }
    const notificationsByOrder = new Map<number, OrderNotification[]>();
    for (const row of notificationsResult.recordset || []) {
      if (!row.Id) continue;
      const note = mapNotification(row);
      notificationsByOrder.set(row.OrderId, [...(notificationsByOrder.get(row.OrderId) || []), note]);
    }
    return ordersResult.recordset.map((row) => ({
      ...mapOrderHeader(row),
      items: itemsByOrder.get(row.Id) || [],
      notifications: notificationsByOrder.get(row.Id) || []
    }));
  },

  async updateOrderStatus(id: number, status: OrderStatus) {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("status", sql.NVarChar(30), status)
      .query(`UPDATE Orders SET Status=@status OUTPUT inserted.* WHERE Id=@id`);
    return result.recordset[0] ? mapOrderHeader(result.recordset[0]) : null;
  },

  async addOrderNotification(id: number, status: OrderStatus, message: string) {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const orderResult = await new sql.Request(transaction)
        .input("id", sql.Int, id)
        .input("status", sql.NVarChar(30), status)
        .query(`UPDATE Orders SET Status=@status OUTPUT inserted.* WHERE Id=@id`);
      if (!orderResult.recordset[0]) {
        await transaction.rollback();
        return null;
      }
      await new sql.Request(transaction)
        .input("orderId", sql.Int, id)
        .input("status", sql.NVarChar(30), status)
        .input("message", sql.NVarChar(sql.MAX), message)
        .query(`
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
          END;
          INSERT INTO OrderNotifications (OrderId, Status, Channel, Message)
          VALUES (@orderId, @status, 'WhatsApp', @message);
        `);
      await transaction.commit();
      const orders = await this.getOrders();
      return orders.find((order) => order.id === id) || mapOrderHeader(orderResult.recordset[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getReports(): Promise<ReportSummary> {
    const pool = await getPool();
    if (!pool) throw new Error("SQL Server no está conectado");
    const result = await pool.request().query(`
      SELECT
        SUM(CASE WHEN CONVERT(date, CreatedAt) = CONVERT(date, SYSDATETIME()) AND Status <> 'Cancelado' THEN Total ELSE 0 END) AS TodayTotal,
        SUM(CASE WHEN CreatedAt >= DATEADD(day, -6, CONVERT(date, SYSDATETIME())) AND Status <> 'Cancelado' THEN Total ELSE 0 END) AS WeekTotal,
        SUM(CASE WHEN CreatedAt >= DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1) AND Status <> 'Cancelado' THEN Total ELSE 0 END) AS MonthTotal,
        COUNT(*) AS TotalOrders
      FROM Orders;

      SELECT Status AS name, COUNT(*) AS value FROM Orders GROUP BY Status;
      SELECT OrderType AS name, COUNT(*) AS value FROM Orders GROUP BY OrderType;
      SELECT FORMAT(CONVERT(date, CreatedAt), 'dd/MM') AS name, SUM(Total) AS total
      FROM Orders
      WHERE CreatedAt >= DATEADD(day, -6, CONVERT(date, SYSDATETIME())) AND Status <> 'Cancelado'
      GROUP BY CONVERT(date, CreatedAt)
      ORDER BY CONVERT(date, CreatedAt);
    `);

    const recordsets = result.recordsets as any[];
    const summary = recordsets[0]?.[0] || {};
    return {
      todayTotal: Number(summary.TodayTotal || 0),
      weekTotal: Number(summary.WeekTotal || 0),
      monthTotal: Number(summary.MonthTotal || 0),
      totalOrders: Number(summary.TotalOrders || 0),
      byStatus: (recordsets[1] || []).map((r: any) => ({ name: r.name, value: Number(r.value) })),
      byType: (recordsets[2] || []).map((r: any) => ({ name: r.name, value: Number(r.value) })),
      dailySales: (recordsets[3] || []).map((r: any) => ({ name: r.name, total: Number(r.total) }))
    };
  }
};
