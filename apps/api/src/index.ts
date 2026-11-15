import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { authRoutes } from './auth/routes';
import { geocodeRoutes, providerRoutes } from './providers/routes';
import { taskRoutes, offerRoutes } from './tasks/routes';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('/api/*', cors({ origin: '*' }));

app.get('/', (c) => c.json({ name: 'HelpDK API', ok: true }));
app.route('/api/auth', authRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/offers', offerRoutes);
app.route('/api/providers', providerRoutes);
app.route('/api/geocode', geocodeRoutes);

export default app;
export { app };
