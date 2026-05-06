export default (): { port: number; cors: { origin: string } } => ({
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
