#!/usr/bin/env bash
# Prepares a fresh Oracle Cloud VPS (Ubuntu or Oracle Linux, x86_64) for the site.
# Run as a sudo-capable user:  sudo bash setup-vps.sh "<deploy public key>"
#
# - installs Docker Engine + Compose plugin
# - creates the "deploy" user (docker group) with the given SSH public key
# - creates /opt/cv-page-mvrc owned by deploy
# - adds a 2 GB swap file (the VM has 1 GB RAM)
# - disables SSH password login
# - does NOT open ports 80/443 (not needed with Cloudflare Tunnel; see docs/SETUP.md)
set -euo pipefail

DEPLOY_USER=deploy
APP_DIR=/opt/cv-page-mvrc
PUBKEY="${1:-}"

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }
[ -n "$PUBKEY" ] || { echo "usage: sudo bash $0 \"ssh-ed25519 AAAA... github-actions-deploy\"" >&2; exit 1; }

. /etc/os-release
echo ">> OS: $PRETTY_NAME ($(uname -m))"

# ---------- Docker ----------
if ! command -v docker >/dev/null; then
  case "$ID" in
    ubuntu|debian)
      apt-get update
      apt-get install -y ca-certificates curl
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
      chmod a+r /etc/apt/keyrings/docker.asc
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID ${VERSION_CODENAME} stable" \
        > /etc/apt/sources.list.d/docker.list
      apt-get update
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    ol|rhel|centos|rocky|almalinux)
      dnf install -y dnf-plugins-core curl
      dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
      dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    *) echo "unsupported OS: $ID" >&2; exit 1 ;;
  esac
fi
systemctl enable --now docker
docker compose version

# Rotate container logs by default.
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
JSON
  systemctl restart docker
fi

# ---------- deploy user ----------
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
grep -qxF "$PUBKEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" || echo "$PUBKEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/deploy" "$APP_DIR/deploy/scripts"

# ---------- swap (1 GB RAM) ----------
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

# ---------- SSH hardening ----------
cat > /etc/ssh/sshd_config.d/90-hardening.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
CONF
if sshd -t; then
  systemctl reload ssh 2>/dev/null || systemctl reload sshd
fi

echo
echo ">> Done. Next steps (docs/SETUP.md, etapa 6):"
echo "   1. put .env and docker-compose.yml in $APP_DIR (owner $DEPLOY_USER, .env chmod 600)"
echo "   2. sudo -iu $DEPLOY_USER; cd $APP_DIR && docker compose pull && docker compose up -d"
echo "   Host key fingerprint for the VPS_HOST_FINGERPRINT secret:"
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub | awk '{print "   " $2}'
