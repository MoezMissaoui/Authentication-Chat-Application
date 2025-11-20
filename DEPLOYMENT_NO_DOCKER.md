# Deployment Guide Without Docker (FastAPI + Nginx)

Ce guide détaille toutes les étapes pour déployer l’application d’authentification sur un serveur Ubuntu/Debian sans Docker. Le backend FastAPI tourne via Uvicorn (systemd) et Nginx sert à la fois de reverse proxy et d’hébergement statique pour le frontend.

---

## 1. Préparation du serveur

1. **Créer un utilisateur d’administration (optionnel)** :
   ```bash
   sudo adduser deployer
   sudo usermod -aG sudo deployer
   sudo rsync --archive --chown=deployer:deployer ~/.ssh /home/deployer
   ```
2. **Sécuriser SSH** : désactiver l’accès root et les mots de passe dans `/etc/ssh/sshd_config`, puis `sudo systemctl restart sshd`.
3. **Mettre à jour le système et installer les paquets requis** :
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential git curl \
       nginx python3 python3-venv python3-pip \
       postgresql postgresql-contrib ufw
   ```
4. **Configurer le firewall (ufw)** :
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 2. Base de données (PostgreSQL)

1. Créer la base et l’utilisateur :
   ```bash
   sudo -u postgres psql
   ```
   Dans psql :
   ```sql
   CREATE DATABASE auth_app;
   CREATE USER auth_user WITH PASSWORD 'motdepasse_solide';
   ALTER ROLE auth_user SET client_encoding TO 'UTF8';
   ALTER ROLE auth_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE auth_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE auth_app TO auth_user;
   ```
2. URL de connexion à réutiliser :
   ```
   DATABASE_URL=postgresql+psycopg://auth_user:motdepasse_solide@127.0.0.1:5432/auth_app
   ```
3. Activer les sauvegardes automatisées (`pg_dump`) selon votre politique.

---

## 3. Récupération du code

```bash
sudo mkdir -p /var/www/auth-app
sudo chown deployer:deployer /var/www/auth-app
cd /var/www/auth-app
git clone <REPO_URL> .
git checkout main    # ou la release souhaitée
```

Astuce : protéger les droits (`chmod 750 /var/www/auth-app`) pour éviter des lectures non désirées.

---

## 4. Backend FastAPI

1. **Créer l’environnement virtuel** :
   ```bash
   cd /var/www/auth-app/backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. **Installer les dépendances** :
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. **Appliquer les migrations (Alembic par exemple)** :
   ```bash
   alembic upgrade head
   ```
4. **Test local** :
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   curl http://127.0.0.1:8000/health
   ```
   Interrompre ensuite avec `Ctrl+C`.

---

## 5. Frontend (SPA React/Tailwind)

1. Construire le bundle :
   ```bash
   cd /var/www/auth-app/frontend
   npm install
   npm run build    # génère dist/
   ```
2. Publier les fichiers statiques :
   ```bash
   sudo mkdir -p /var/www/auth-app/frontend_dist
   sudo rsync -a --delete dist/ /var/www/auth-app/frontend_dist/
   sudo chown -R www-data:www-data /var/www/auth-app/frontend_dist
   ```

---

## 6. Variables d’environnement

Créer `/var/www/auth-app/.env` :
```
APP_NAME=AuthApp
APP_ENV=production
API_PORT=8000
DATABASE_URL=postgresql+psycopg://auth_user:motdepasse_solide@127.0.0.1:5432/auth_app
JWT_SECRET=chaine_ultra_secrete
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://auth.example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=<cle_sendgrid>
```

Sécuriser :
```bash
sudo chown www-data:www-data /var/www/auth-app/.env
sudo chmod 600 /var/www/auth-app/.env
```

---

## 7. Service systemd (Uvicorn)

Fichier `/etc/systemd/system/auth-app.service` :
```
[Unit]
Description=Auth App FastAPI Service
After=network.target postgresql.service

[Service]
WorkingDirectory=/var/www/auth-app/backend
EnvironmentFile=/var/www/auth-app/.env
Environment="PATH=/var/www/auth-app/backend/.venv/bin"
ExecStart=/var/www/auth-app/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --proxy-headers
Restart=always
RestartSec=5
User=www-data
Group=www-data
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Activation :
```bash
sudo systemctl daemon-reload
sudo systemctl enable auth-app
sudo systemctl start auth-app
sudo systemctl status auth-app
```

Logs live :
```bash
journalctl -u auth-app -f
```

---

## 8. Configuration Nginx

Fichier `/etc/nginx/sites-available/auth-app` :
```
server {
    listen 80;
    server_name auth.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.example.com;

    ssl_certificate /etc/letsencrypt/live/auth.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.example.com/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/auth-app/frontend_dist;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /docs/ {
        proxy_pass http://127.0.0.1:8000/docs/;
        proxy_set_header Host $host;
    }
}
```

Activation :
```bash
sudo ln -s /etc/nginx/sites-available/auth-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. HTTPS via Let’s Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d auth.example.com
sudo certbot renew --dry-run
```

Renouvellements automatiques gérés par `certbot.timer`.

---

## 10. Vérifications et supervision

- **Services** : `systemctl status auth-app nginx postgresql`
- **Santé API** : `curl -H "Host: auth.example.com" https://127.0.0.1/api/health -k`
- **Logs** :
  - Backend : `journalctl -u auth-app`
  - Nginx : `/var/log/nginx/access.log` et `error.log`
- **Monitoring** : penser à installer `fail2ban`, `node-exporter`, etc.

---

## 11. Workflow de déploiement

1. `git fetch && git checkout <tag>`
2. Backend : `source backend/.venv/bin/activate && pip install -r requirements.txt`
3. Frontend : `npm ci && npm run build`
4. Migrations : `alembic upgrade head`
5. Redémarrage contrôlé :
   ```bash
   sudo systemctl restart auth-app
   sudo systemctl reload nginx
   ```
6. Vérifier `/api/health`, UI et logs avant de quitter.

---

## 12. Sauvegarde & maintenance

- `pg_dump auth_app | gzip > /var/backups/auth_app-$(date +%F).sql.gz`
- `rsync -a /var/www/auth-app /mnt/backup/`
- `sudo apt update && sudo apt upgrade` régulier
- Rotation des journaux : `logrotate` pour Nginx et `journalctl --vacuum-time=14d`

---

## 13. Dépannage rapide

| Problème | Pistes |
| --- | --- |
| 502 Bad Gateway | `systemctl status auth-app`, port 8000 occupé, relancer service |
| Page blanche SPA | rebuild frontend, vérifier `try_files` et droits `www-data` |
| Certbot échec | DNS incorrect, port 80 fermé, supprimer ancienne conf et relancer |
| Lenteurs API | passer à Gunicorn+Uvicorn (`gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`) |
| Assets 404 | confirmer `frontend_dist` rempli, symlink actif, `nginx -t` OK |

---

Avec ces étapes détaillées, vous disposez d’un déploiement complet FastAPI + SPA derrière Nginx, entièrement sans Docker. Adaptez noms de domaines, secrets et chemins à votre environnement.

