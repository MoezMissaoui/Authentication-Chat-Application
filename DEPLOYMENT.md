# EC2 Deployment Guide with Nginx

This guide explains how to deploy the authentication application on EC2 with nginx as a reverse proxy.

## Prerequisites

- EC2 instance running Ubuntu/Debian
- Docker and Docker Compose installed
- Domain or nip.io subdomain configured

## Step 1: Install Nginx on EC2

```bash
sudo apt update
sudo apt install -y nginx
```

## Step 2: Configure Nginx

1. Copy the `nginx.conf` file to your EC2 instance:

```bash
# On your local machine
scp nginx.conf ubuntu@your-ec2-ip:/tmp/nginx.conf
```

2. On EC2, backup the default config and copy the new one:

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf
```

3. Test the nginx configuration:

```bash
sudo nginx -t
```

4. If the test passes, reload nginx:

```bash
sudo systemctl reload nginx
```

## Step 3: Update Environment Variables

Update your `.env` file on EC2 to match your setup:

```bash
# Update CORS_ORIGINS to include your nip.io domain
CORS_ORIGINS=http://auth.YOUR_EC2_IP.nip.io

# Update REACT_APP_API_URL to use the backend directly or through nginx
REACT_APP_API_URL=http://localhost:8000
# Or if you want to use the api subdomain:
# REACT_APP_API_URL=http://api.YOUR_EC2_IP.nip.io
```

## Step 4: Update Docker Compose Ports

Make sure your `docker-compose.yml` exposes the correct ports:

- Frontend: `3000` (mapped to `${FRONTEND_PORT}`)
- Backend: `8000` (mapped to `${BACKEND_PORT}`)
- pgAdmin: `5050` (mapped to `${PGADMIN_PORT}`)

The nginx config expects:
- Frontend on `localhost:3000`
- pgAdmin on `localhost:5050`
- Backend on `localhost:8000`

## Step 5: Configure Security Groups

In your EC2 Security Group, open:
- Port 80 (HTTP) - for nginx
- Port 443 (HTTPS) - if using SSL
- Port 22 (SSH) - for access

## Step 6: Start the Application

```bash
docker-compose up -d
```

## Step 7: Verify

1. **Frontend**: Visit `http://auth.YOUR_EC2_IP.nip.io`
2. **pgAdmin**: Visit `http://db.YOUR_EC2_IP.nip.io`
3. **Backend API**: Visit `http://api.YOUR_EC2_IP.nip.io/docs` (optional)

## DNS Configuration

For nip.io, replace `YOUR_EC2_IP` with your actual EC2 public IP address. For example:
- If your EC2 IP is `54.123.45.67`, use:
  - `auth.54.123.45.67.nip.io`
  - `db.54.123.45.67.nip.io`
  - `api.54.123.45.67.nip.io`

## SSL/HTTPS (Optional)

To add SSL certificates, you can use Let's Encrypt with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d auth.YOUR_EC2_IP.nip.io -d db.YOUR_EC2_IP.nip.io
```

Then update the nginx.conf to redirect HTTP to HTTPS by uncommenting the redirect lines in each server block.

## Troubleshooting

1. **Check nginx status**:
   ```bash
   sudo systemctl status nginx
   ```

2. **Check nginx logs**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Check Docker containers**:
   ```bash
   docker-compose ps
   docker-compose logs
   ```

4. **Test nginx configuration**:
   ```bash
   sudo nginx -t
   ```

5. **Verify ports are listening**:
   ```bash
   sudo netstat -tlnp | grep -E '3000|5050|8000'
   ```

