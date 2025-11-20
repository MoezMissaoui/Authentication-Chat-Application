# Port Binding Security

## Difference Between Port Binding Options

### `"${PORT}:5432"` (Default - Binds to 0.0.0.0)
- **Accessible from**: Anywhere (internet, local network, localhost)
- **Security**: Less secure - exposed to all network interfaces
- **Use case**: When you need external access

### `"127.0.0.1:${PORT}:5432"` (Localhost Only)
- **Accessible from**: Only from the host machine (localhost)
- **Security**: More secure - not accessible from external networks
- **Use case**: When using reverse proxy (nginx) or only local access needed

## Recommended Configuration for EC2 with Nginx

Since you're using nginx as a reverse proxy, all services should bind to `127.0.0.1` for better security:

- ✅ **PostgreSQL**: `127.0.0.1:${POSTGRES_PORT}:5432` - Only accessible from host
- ✅ **Backend**: `127.0.0.1:${BACKEND_PORT}:8000` - Only accessible from host (nginx proxies)
- ✅ **pgAdmin**: `127.0.0.1:${PGADMIN_PORT}:80` - Only accessible from host (nginx proxies)
- ⚠️ **Frontend**: Can be `127.0.0.1:${FRONTEND_PORT}:3000` or `${FRONTEND_PORT}:3000`
  - Use `127.0.0.1` for production (nginx proxies)
  - Use `${FRONTEND_PORT}:3000` for development (if you need direct access for hot reload)

## Why Use 127.0.0.1?

1. **Security**: Services are not exposed to the internet directly
2. **Nginx as Gateway**: All external traffic goes through nginx
3. **Firewall Friendly**: Even if security groups allow ports, services aren't directly accessible
4. **Best Practice**: Follows principle of least exposure

## Container-to-Container Communication

Note: Containers in the same Docker network can still communicate using service names (e.g., `db:5432`, `backend:8000`) regardless of port binding. The `127.0.0.1` binding only affects host-to-container access.

