#!/usr/bin/env bash
# Prepares the Oracle Cloud VPS (Oracle Linux 9, x86_64) for the site. Safe on a server that
# already runs other applications: it never removes packages, never restarts an existing Docker
# daemon, never reloads the firewall and only changes SSH settings when asked to.
#
# Usage (as a sudo-capable user):
#   sudo bash setup-vps.sh "<deploy public key>" [--harden-ssh]
#
# - installs Docker Engine + Compose plugin (only if Docker is not installed yet)
# - creates the "deploy" user (docker group) with the given SSH public key
# - creates /opt/cv-page-mvrc owned by deploy
# - adds a 2 GB swap file if the machine has no swap at all
# - --harden-ssh: disables SSH password and root login (make sure YOUR user logs in with a key!)
# - does NOT open any port (Cloudflare Tunnel only makes outbound connections)
set -euo pipefail

DEPLOY_USER=deploy
APP_DIR=/opt/cv-page-mvrc
PUBKEY="${1:-}"
HARDEN_SSH=false
[ "${2:-}" = "--harden-ssh" ] && HARDEN_SSH=true

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }
[ -n "$PUBKEY" ] || { echo "usage: sudo bash $0 \"ssh-ed25519 AAAA... github-actions-deploy\" [--harden-ssh]" >&2; exit 1; }

. /etc/os-release
echo ">> OS: $PRETTY_NAME ($(uname -m))"

# ---------- Docker ----------
if command -v docker >/dev/null && docker --version 2>/dev/null | grep -qi podman; then
  echo "!! 'docker' on this machine is the Podman shim (podman-docker), not Docker Engine." >&2
  echo "!! Tell Marcos/the maintainer before continuing: the other application may rely on it." >&2
  exit 1
fi

if command -v docker >/dev/null; then
  echo ">> Docker already installed: $(docker --version). Leaving it untouched."
else
  case "$ID" in
    ol|rhel|centos|rocky|almalinux)
      # Never remove Podman: another application may depend on it. Docker CE and Podman can
      # coexist on EL9; only the podman-docker shim and the standalone runc package conflict.
      if rpm -q runc >/dev/null 2>&1; then
        echo "!! The 'runc' package is installed and conflicts with containerd.io (Docker CE)." >&2
        echo "!! Check that no running application needs it (docs/SETUP.md, etapa 6)." >&2
        exit 1
      fi
      dnf install -y dnf-plugins-core curl
      dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
      dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
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
    *) echo "unsupported OS: $ID" >&2; exit 1 ;;
  esac

  # Fresh install only: rotate container logs by default.
  if [ ! -f /etc/docker/daemon.json ]; then
    install -d /etc/docker
    cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
JSON
  fi
  systemctl enable --now docker
fi
docker compose version

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
restorecon -R "/home/$DEPLOY_USER/.ssh" 2>/dev/null || true # SELinux labels on EL

install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/deploy" "$APP_DIR/deploy/scripts"

# ---------- swap (1 GB RAM) ----------
if [ -z "$(swapon --show --noheadings)" ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo ">> 2 GB swap file created"
else
  echo ">> Swap already configured, leaving it untouched"
fi

# ---------- SSH hardening (opt-in) ----------
if [ "$HARDEN_SSH" = true ]; then
  printf '%s\n' 'PasswordAuthentication no' 'KbdInteractiveAuthentication no' 'PermitRootLogin no' \
    > /etc/ssh/sshd_config.d/90-hardening.conf
  if sshd -t; then
    systemctl reload sshd
    echo ">> SSH password and root login disabled"
  else
    rm -f /etc/ssh/sshd_config.d/90-hardening.conf
    echo "!! sshd config test failed, hardening reverted" >&2
  fi
fi

echo
echo ">> Done. Next steps (docs/SETUP.md, etapa 6):"
echo "   1. put .env and docker-compose.yml in $APP_DIR (owner $DEPLOY_USER, .env chmod 600)"
echo "   2. sudo -iu $DEPLOY_USER; cd $APP_DIR && docker compose pull && docker compose up -d"
echo "   Host key fingerprint for the VPS_HOST_FINGERPRINT secret:"
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub | awk '{print "   " $2}'
