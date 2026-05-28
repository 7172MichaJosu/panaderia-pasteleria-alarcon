export const appConfig = {
  appName: process.env.APP_NAME || "Panadería y Pastelería",
  businessName: process.env.BUSINESS_NAME || "Panadería Pastelería y Fuente de Soda",
  whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "51999999999",
  useMockDb: process.env.USE_MOCK_DB !== "false",
  adminUser: process.env.ADMIN_USER || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin123!",
  sessionSecret: process.env.SESSION_SECRET || "desarrollo-local-cambiar"
};
