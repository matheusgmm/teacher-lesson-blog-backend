require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middlewares/error-handler.middleware');
const { CodedApiError } = require('./utils/CodedApiError.util');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const { setupSwagger } = require('./docs/swagger');
const { cors } = require('./middlewares/cors.middleware');

const app = express();

app.use(cors);
app.use(express.json());

setupSwagger(app);

app.get('/status', (_, res) => {
  res.json({
    status: 'Running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);

app.use((req, res, next) => {
  next(new CodedApiError('NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

module.exports = app;
