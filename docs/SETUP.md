# Guia de configuração (passo a passo)

Este guia leva o site do código até o ar em **mvrc.com.br**, passando pelo servidor de dev
on-premises (**dev.mvrc.local/cv**). Siga as etapas **na ordem**: cada uma depende da anterior.

> Os nomes de menus dos painéis (Cloudflare, Resend, GitHub) mudam de tempos em tempos. Se um
> item não estiver exatamente com o nome indicado, procure pelo termo entre aspas na busca do painel.

| Etapa | O quê                                   | Necessária para               |
| ----- | --------------------------------------- | ----------------------------- |
| 1     | GitHub: segurança do repositório        | tudo                          |
| 2     | Servidor de dev: runner self-hosted     | pipeline do branch `DEV`      |
| 3     | Cloudflare Turnstile                    | build de produção             |
| 4     | Resend (e-mail)                         | formulário de contato em prod |
| 5     | Cloudflare Tunnel                       | publicar o site               |
| 6     | VPS na OCI e primeiro deploy manual     | produção                      |
| 7     | GitHub: segredos e deploy com aprovação | deploy em produção            |

Fluxo de trabalho depois de tudo pronto:

```
commit no DEV ──► CI + imagem :dev ──► servidor de dev (dev.mvrc.local/cv)
PR DEV → main ──► CI + Lighthouse ──► merge ──► imagem :latest
                                     └─► você clica "Run workflow" (Deploy production) ──► VPS (mvrc.com.br)
```

---

## Etapa 1 — GitHub: segurança do repositório

O repositório é **privado** (plano Free). Alguns recursos de segurança do GitHub são pagos em
repositórios privados (secret scanning, CodeQL, rulesets obrigatórios, revisores em ambientes);
aqui ficam só os que funcionam no plano gratuito. Faça isto **antes** do primeiro push.

1. **Permissões padrão dos workflows**
   1. Abra `https://github.com/MarcosCantelli/CV-Page-MVRC` → **Settings** → **Actions** → **General**.
   2. Em **Workflow permissions**, marque **Read repository contents and packages permissions**
      (cada job pede só o que precisa). Clique em **Save**.
   3. Em **Fork pull request workflows in private repositories**, deixe **desmarcado**
      _Run workflows from fork pull requests_.
2. **Dependabot** → **Settings** → **Advanced Security** (em contas mais antigas:
   **Code security and analysis**):
   - **Dependabot alerts** → **Enable**.
   - **Dependabot security updates** → **Enable**.
3. **Privacidade do seu e-mail nos commits.** Em github.com, clique no avatar → **Settings** → **Emails**:
   - Marque **Keep my email addresses private**.
   - Marque **Block command line pushes that expose my email**.
   - Neste repositório, os commits já usam o endereço `71090384+MarcosCantelli@users.noreply.github.com`
     (configurado com `git config user.email` só para este repo).
4. **Proteção contra vazamento de segredos (gratuita, na sua conta).** Avatar → **Settings** →
   **Code security** → **Push protection for yourself** → **Enable**. Ela bloqueia pushes seus que
   contenham tokens conhecidos (vale para todos os repositórios). Além disso, o `.gitignore` já
   ignora `.env*` e os `.docx` do currículo.

> Se um dia tornar o repositório público, ative também em **Settings** → **Advanced Security**:
> **Secret Protection**, **Push protection**, **Private vulnerability reporting** e **CodeQL**
> (todos gratuitos em repositório público), e reveja o aviso do runner na etapa 2.

✅ **Pronto quando:** as permissões dos workflows estão em _Read_ e o Dependabot está _Enabled_.

---

## Etapa 2 — Servidor de dev: runner self-hosted

O workflow `container.yml` publica a imagem `ghcr.io/marcoscantelli/cv-page-mvrc:dev` a cada push no
`DEV`. O deploy é feito por um **runner do GitHub Actions instalado no servidor de dev**: ele só
faz conexões de saída para o GitHub, sem abrir nenhuma porta.

> ⚠️ **Segurança:** um runner self-hosted executa código vindo do repositório. Como o repositório é
> privado, só quem tem acesso de escrita consegue disparar jobs nele, e os workflows só usam o
> runner em `push` no `DEV`. **Não torne o repositório público com este runner ativo.** O usuário
> do runner fica no grupo `docker`, o que equivale a acesso de root no servidor de dev: use uma
> máquina/VM de dev sem dados sensíveis.

### 2.1 Criar o usuário e as pastas

No servidor de dev (x86_64, Docker e Compose já instalados):

```bash
sudo useradd --create-home --shell /bin/bash gha-runner
sudo usermod -aG docker gha-runner
sudo install -d -o gha-runner -g gha-runner -m 750 /opt/cv-page-mvrc-dev
command -v curl || sudo apt-get install -y curl   # ou: sudo dnf install -y curl
```

Crie o `.env` do dev (chaves de teste do Turnstile e e-mails apenas no log):

```bash
sudo -u gha-runner tee /opt/cv-page-mvrc-dev/.env >/dev/null <<'EOF'
MAIL_DRIVER=log
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
HSTS=false
# porta do host onde o container fica exposto para o proxy interno
CV_HOST_PORT=4321
EOF
sudo chmod 600 /opt/cv-page-mvrc-dev/.env
```

### 2.2 Registrar o runner

1. No GitHub: **Settings** → **Actions** → **Runners** → **New self-hosted runner**.
2. **Runner image**: _Linux_, **Architecture**: _x64_.
3. A página mostra comandos com uma versão e um token. No servidor, execute-os **como `gha-runner`**:

   ```bash
   sudo -iu gha-runner
   mkdir actions-runner && cd actions-runner
   # copie da página do GitHub as linhas "curl -o actions-runner-linux-x64-..." e "tar xzf ..."
   ./config.sh --url https://github.com/MarcosCantelli/CV-Page-MVRC \
     --token <TOKEN_DA_PAGINA> --name dev-server --labels cv-dev --unattended
   exit
   ```

4. Instale como serviço (inicia com o sistema):

   ```bash
   cd /home/gha-runner/actions-runner
   sudo ./svc.sh install gha-runner
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```

5. Em **Settings** → **Actions** → **Runners**, o runner `dev-server` deve aparecer como **Idle**
   com os labels `self-hosted`, `Linux`, `X64`, `cv-dev`.

### 2.3 Proxy interno: Traefik em `dev.mvrc.local/cv`

O servidor de dev já roda um **Traefik v3** (porta 80) com o provider Docker e a rede externa
`web`. O `deploy/dev/docker-compose.yml` coloca o container nessa rede e declara as labels:

- regra `Host(`dev.mvrc.local`) && (Path(`/cv`) || PathPrefix(`/cv/`))`;
- entrypoint `web`, porta interna `4321`;
- **sem** middleware `StripPrefix`, porque a imagem de dev é gerada com `BASE_PATH=/cv`.

A porta 4321 só é publicada em `127.0.0.1`, usada pelo teste de saúde do deploy. Na rede local,
o acesso passa pelo Traefik.

Se o seu Traefik usar outros nomes, ajuste no `/opt/cv-page-mvrc-dev/.env`:

```dotenv
TRAEFIK_NETWORK=web        # rede Docker em que o Traefik está
TRAEFIK_ENTRYPOINT=web     # entrypoint HTTP (veja --entrypoints.<nome>.address=:80)
CV_DEV_HOST=dev.mvrc.local
```

Para conferir os nomes reais:

```bash
docker inspect traefik-traefik-1 --format '{{json .Config.Cmd}}' | tr ',' '\n' | grep -iE 'entrypoints|docker'
docker inspect traefik-traefik-1 --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

### 2.4 Primeiro deploy de dev

1. Faça push do branch `DEV`. Em **Actions** → **Container**, acompanhe os jobs
   `Build and push image` e `Deploy to dev server`.
2. A imagem no GHCR é privada (herda a visibilidade do repositório). O job de dev faz login no
   GHCR com o token do próprio workflow, então não é preciso configurar nada no servidor de dev.
3. Abra `http://dev.mvrc.local/cv/` e `http://dev.mvrc.local/cv/en/`. Envie o formulário: a
   mensagem aparece nos logs (`docker logs cv-page-mvrc-dev-app-1`), pois `MAIL_DRIVER=log`.

✅ **Pronto quando:** o site abre em `dev.mvrc.local/cv/` e o formulário mostra "Mensagem enviada!".

---

## Etapa 3 — Cloudflare Turnstile (anti-spam)

### 3.1 Criar o widget

1. Entre em `https://dash.cloudflare.com` e selecione a sua conta.
2. No menu lateral: **Application security** → **Turnstile** (ou só **Turnstile**).
3. **Add widget**.
4. **Widget name**: `mvrc.com.br contato`.
5. **Hostname management** → **Add hostnames**: adicione `mvrc.com.br` e `localhost`.
   (O servidor de dev usa as chaves de teste e não precisa ser cadastrado.)
6. **Widget Mode**: **Managed** (recomendado: só mostra um desafio quando há suspeita).
7. **Pre-clearance**: **No**.
8. **Create**.

### 3.2 Onde colocar as chaves

A tela seguinte mostra **Site Key** e **Secret Key** (depois ficam em Turnstile → widget →
**Settings**).

| Chave          | É secreta? | Onde colocar                                                                                                                                 |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site Key**   | Não        | GitHub → **Settings** → **Secrets and variables** → **Actions** → aba **Variables** → **New repository variable**: nome `TURNSTILE_SITE_KEY` |
| **Secret Key** | **Sim**    | `.env` da VPS: `TURNSTILE_SECRET_KEY=...` (etapa 6). Não vai para o GitHub.                                                                  |

A Site Key entra no HTML durante o build da imagem de produção (é pública por natureza). O
workflow falha com uma mensagem clara se a variável `TURNSTILE_SITE_KEY` não existir.

### 3.3 Chaves de teste oficiais (desenvolvimento)

| Uso                              | Site Key                   | Secret Key                            |
| -------------------------------- | -------------------------- | ------------------------------------- |
| Sempre passa (padrão do projeto) | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Sempre bloqueia                  | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |
| Força desafio interativo         | `3x00000000000000000000FF` | —                                     |
| Token já usado (testa erro)      | —                          | `3x0000000000000000000000000000000AA` |

Com as chaves de teste, o widget mostra o aviso "Somente para teste". Isso é esperado.

✅ **Pronto quando:** a variável `TURNSTILE_SITE_KEY` existe no GitHub e você guardou a Secret Key
em local seguro (gerenciador de senhas) para a etapa 6.

---

## Etapa 4 — Resend (envio de e-mail)

### 4.1 Conta

1. Acesse `https://resend.com/signup` e crie a conta (plano **Free**: 3.000 e-mails/mês, 100/dia).
2. Confirme o e-mail de cadastro.

### 4.2 Adicionar e verificar o domínio

1. No painel do Resend: **Domains** → **Add Domain**.
2. **Name**: `mvrc.com.br`. **Region**: `São Paulo (sa-east-1)` se disponível, senão
   `North Virginia (us-east-1)`. **Add**.
3. O Resend mostra os registros DNS. Se aparecer o botão **Auto configure** (integração com a
   Cloudflare), você pode usá-lo e pular para o item 5. Caso contrário, crie manualmente na
   Cloudflare: **dash.cloudflare.com** → domínio `mvrc.com.br` → **DNS** → **Records** → **Add record**.
   Copie os valores **exatamente** como o Resend mostra (os de baixo são o formato típico):

   | Tipo | Nome (Cloudflare)   | Conteúdo / valor                                     | Prioridade | Proxy    |
   | ---- | ------------------- | ---------------------------------------------------- | ---------- | -------- |
   | MX   | `send`              | `feedback-smtp.<região>.amazonses.com`               | `10`       | DNS only |
   | TXT  | `send`              | `v=spf1 include:amazonses.com ~all`                  | —          | DNS only |
   | TXT  | `resend._domainkey` | `p=MIGfMA0GCSq...` (chave DKIM longa, copie inteira) | —          | DNS only |
   | TXT  | `_dmarc`            | `v=DMARC1; p=none; rua=mailto:<seu-email>`           | —          | DNS only |
   - Na Cloudflare, o campo **Name** recebe só a parte antes do domínio (`send`, não
     `send.mvrc.com.br`).
   - O registro `_dmarc` é recomendado (Gmail/Yahoo exigem DMARC). Se já existir um `_dmarc`, não
     crie outro.
   - Esses registros ficam no subdomínio `send`, então não conflitam com e-mails que você já
     receba em `@mvrc.com.br` (MX da raiz).

4. Volte ao Resend e clique em **Verify DNS Records**.
5. Aguarde o status do domínio ficar **Verified** (normalmente minutos; pode levar até 72 h). Para
   conferir o DNS do seu computador:

   ```bash
   dig +short TXT resend._domainkey.mvrc.com.br
   dig +short TXT send.mvrc.com.br
   dig +short MX send.mvrc.com.br
   ```

### 4.3 API key (só envio)

1. **API Keys** → **Create API Key**.
2. **Name**: `cv-page-mvrc-vps`. **Permission**: **Sending access**. **Domain**: `mvrc.com.br`.
3. **Add**. Copie a chave (`re_...`), que só é mostrada uma vez.
4. Guarde **somente** no `.env` da VPS (etapa 6): `RESEND_API_KEY=re_...`.
   Ela é usada em tempo de execução, não no build, então **não** precisa ir para o GitHub.

### 4.4 Remetente e destinatário

No `.env` da VPS:

```dotenv
MAIL_DRIVER=resend
CONTACT_FROM_EMAIL="Site mvrc.com.br <contato@mvrc.com.br>"   # qualquer endereço @mvrc.com.br
CONTACT_TO_EMAIL=<e-mail onde você quer receber as mensagens>
```

O remetente não precisa ser uma caixa de e-mail real. O botão "Responder" do seu e-mail vai
direto para quem preencheu o formulário (`reply-to`).

### 4.5 Testar localmente

```bash
cp .env.example .env
# edite .env: MAIL_DRIVER=resend, RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL
pnpm build && pnpm start
curl -s -X POST http://localhost:4321/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Teste","email":"teste@example.com","message":"Mensagem de teste do site","turnstileToken":"x"}'
# esperado: {"ok":true} e o e-mail na sua caixa (veja também Resend → Emails)
```

(Com a Secret Key de teste `1x000...AA`, qualquer token passa.)

✅ **Pronto quando:** o domínio está **Verified** e o e-mail de teste chegou.

---

## Etapa 5 — Cloudflare Tunnel (reaproveitando o túnel que já existe)

A VPS já roda um `cloudflared` **no host** (pacote rpm, serviço systemd) que publica a outra
aplicação. Um mesmo túnel atende hostnames de **domínios diferentes** da mesma conta
Cloudflare, então basta acrescentar uma rota para `mvrc.com.br`. Isso economiza memória (a VM tem
512 MB) e não mexe na outra aplicação.

```
Internet ─► Cloudflare ─► túnel (cloudflared no host) ─┬─► outro-dominio  → 127.0.0.1:8081  (crochedajuka)
                                                       └─► mvrc.com.br    → 127.0.0.1:4321  (este site)
```

### 5.1 Descobrir como o túnel é gerenciado

Na VPS:

```bash
systemctl cat cloudflared | grep -i execstart
sudo ls /etc/cloudflared/ 2>/dev/null
```

- Se o `ExecStart` tem `--token` (ou `run --token`): túnel **gerenciado pelo painel** → siga **5.2**.
- Se aparece `--config /etc/cloudflared/config.yml` (ou existe esse arquivo com `ingress:`): túnel
  **gerenciado localmente** → siga **5.3**.

### 5.2 Túnel gerenciado pelo painel

1. **dash.cloudflare.com** → **Zero Trust** → **Networks** → **Tunnels**.
2. Clique no túnel que já existe (o que está **Healthy**) → **Edit** (ou **Configure**).
3. Aba **Public Hostname** (em painéis novos: **Published application routes**) → **Add a public
   hostname**:
   - **Subdomain**: _(vazio)_ · **Domain**: `mvrc.com.br` · **Path**: _(vazio)_
   - **Service** → **Type**: `HTTP` · **URL**: `127.0.0.1:4321`
   - **Save hostname**.
   - Se a Cloudflare reclamar que já existe um registro DNS para `mvrc.com.br`, apague o registro
     A/AAAA/CNAME antigo da raiz em **mvrc.com.br** → **DNS** → **Records** e tente de novo.
4. Não é preciso reiniciar nada na VPS: o `cloudflared` recebe a rota nova sozinho. A rota do
   outro domínio continua como está.

### 5.3 Túnel gerenciado localmente (`config.yml`)

1. Faça backup e edite o arquivo:

   ```bash
   sudo cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.bak
   sudo nano /etc/cloudflared/config.yml
   ```

2. Em `ingress:`, acrescente a regra **antes** da última linha (`- service: http_status:404`):

   ```yaml
   - hostname: mvrc.com.br
     service: http://127.0.0.1:4321
   ```

3. Valide, crie o DNS e reinicie:

   ```bash
   sudo cloudflared tunnel ingress validate --config /etc/cloudflared/config.yml
   sudo cloudflared tunnel route dns <NOME_OU_ID_DO_TUNEL> mvrc.com.br
   sudo systemctl restart cloudflared
   ```

   O nome/ID do túnel está na linha `tunnel:` do mesmo arquivo. O `route dns` precisa do
   `cert.pem` da conta (`cloudflared tunnel login`); se der erro, crie no painel o registro
   **CNAME** `mvrc.com.br` → `<ID_DO_TUNEL>.cfargotunnel.com` com **Proxied** ligado.

### 5.4 Ajustes do domínio `mvrc.com.br`

1. (Opcional) `www`: repita a rota com **Subdomain** `www`, depois **Rules** → **Redirect Rules** →
   **Create rule** → modelo _Redirect from WWW to root_.
2. **SSL/TLS** → **Edge Certificates** → ative **Always Use HTTPS** e defina **Minimum TLS
   Version** = `TLS 1.2`.

Até o container subir (etapa 6), `https://mvrc.com.br` responde **502**. Isso é esperado.

**Testar** (depois da etapa 6):

```bash
curl -I https://mvrc.com.br/            # 200, com content-security-policy e strict-transport-security
curl https://mvrc.com.br/healthz        # {"status":"ok"}
curl -I https://<outro-dominio>/        # a outra aplicação continua respondendo
```

> **Alternativa sem o cloudflared do host:** crie um túnel só para este site, coloque o token em
> `TUNNEL_TOKEN` no `.env` e suba com `docker compose --profile tunnel up -d` (o serviço do túnel
> aponta para `app:4321`). Custa ~30 MB a mais de memória.

✅ **Pronto quando:** o túnel tem a rota `mvrc.com.br` → `127.0.0.1:4321` e a outra aplicação
continua no ar.

---

## Etapa 6 — VPS na OCI e primeiro deploy manual

VPS: **Oracle Linux 9.8**, x86_64 (AMD), **512 MB de RAM** + 4 GB de swap, 1 OCPU. A imagem é só
`linux/amd64`. A máquina **já roda outra aplicação** (crochedajuka, containers em
`127.0.0.1:8081/8082`) com Docker CE 29 e `cloudflared` no host. Nada aqui altera essa aplicação:
este site roda num projeto Compose separado (`cv-page-mvrc`), publicado só em `127.0.0.1:4321`, com
limite de 128 MB de memória (uso medido: ~55 MB).

### 6.1 Chave SSH exclusiva para o deploy

No **seu computador**:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/cv_deploy -N ""
cat ~/.ssh/cv_deploy.pub   # chave pública -> vai para a VPS
cat ~/.ssh/cv_deploy       # chave privada -> segredo VPS_SSH_KEY no GitHub (etapa 7)
```

### 6.2 Preparar o servidor

Entre na VPS com o seu usuário administrativo (`mvrc` ou `opc`) e confira:

```bash
uname -m                     # deve mostrar x86_64
cat /etc/oracle-release      # Oracle Linux Server release 9.8
sudo ss -ltnp | grep 4321    # deve voltar vazio (porta livre)
```

Copie o script e execute-o passando a **chave pública** de deploy:

```bash
# no seu computador
scp deploy/scripts/setup-vps.sh mvrc@<IP_DA_VPS>:/tmp/
# na VPS
sudo bash /tmp/setup-vps.sh "$(cat <<'K'
ssh-ed25519 AAAA...cole-a-chave-publica... github-actions-deploy
K
)"
```

Como o Docker já está instalado e já existe swap, o script **só** cria o usuário `deploy` (grupo
`docker`) com a chave, cria `/opt/cv-page-mvrc` e mostra a **impressão digital da chave do host**
(use no segredo `VPS_HOST_FINGERPRINT`). Ele não reinstala, não remove e não reinicia nada.

O hardening do SSH (desligar login por senha e de root) é **opcional**: acrescente `--harden-ssh`
ao comando **somente** se o seu usuário entra por chave SSH. Se você entra com senha, não use.

> Antes de fechar a sessão atual, teste em **outro terminal** se você e o usuário de deploy
> continuam entrando: `ssh -i ~/.ssh/cv_deploy deploy@<IP_DA_VPS>`.

### 6.3 Firewall

Com o **Cloudflare Tunnel não é preciso abrir nenhuma porta de entrada** além da SSH (22), que
já vem liberada. Se possível, restrinja a porta 22 na Security List: **OCI Console** → **Networking** →
**Virtual cloud networks** → sua VCN → **Security Lists** → _Default Security List_ → **Ingress Rules**.

### 6.4 Arquivos e `.env`

Na VPS, como `deploy`:

```bash
sudo -iu deploy
cd /opt/cv-page-mvrc
# copie do seu computador (o repositório é privado):
#   scp docker-compose.yml deploy@<IP_DA_VPS>:/opt/cv-page-mvrc/
nano .env
chmod 600 .env
```

Conteúdo do `.env` de produção:

```dotenv
MAIL_DRIVER=resend
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL="Site mvrc.com.br <contato@mvrc.com.br>"
CONTACT_TO_EMAIL=<seu e-mail>
TURNSTILE_SECRET_KEY=<Secret Key da etapa 3>
HSTS=true
TAG=latest
```

### 6.5 Login no GHCR (imagem privada)

A imagem é privada, então a VPS precisa de um token **só de leitura**:

1. GitHub → avatar → **Settings** → **Developer settings** → **Personal access tokens** →
   **Tokens (classic)** → **Generate new token** → **Generate new token (classic)**.
2. **Note**: `vps-ghcr-pull`. **Expiration**: 1 ano (anote para renovar). **Scopes**: marque
   **apenas** `read:packages`. **Generate token** e copie o valor (`ghp_...`).
3. Na VPS, como `deploy`:

   ```bash
   echo '<TOKEN>' | docker login ghcr.io -u MarcosCantelli --password-stdin
   ```

   O login fica salvo em `/home/deploy/.docker/config.json` e é usado pelo deploy automático.
   (Os _fine-grained tokens_ ainda não funcionam com o GHCR; por isso o token clássico.)

> A imagem `:latest` só existe depois do primeiro push na `main` (etapa 7). Para testar antes,
> use `TAG=sha-<commit>` de um build da `main` ou gere a imagem localmente.

### 6.6 Primeiro deploy manual

```bash
cd /opt/cv-page-mvrc
docker compose pull
docker compose up -d
docker compose ps                     # app: "healthy"
curl -s http://127.0.0.1:4321/healthz # {"status":"ok"}
docker stats --no-stream             # memória dos dois projetos lado a lado
docker compose exec app /nodejs/bin/node healthcheck.mjs && echo saudável
```

Abra `https://mvrc.com.br` e `https://mvrc.com.br/en/`, troque idioma e tema e envie uma mensagem
de teste pelo formulário.

### Alternativa: Caddy em vez do Tunnel

Use `deploy/caddy/docker-compose.yml` + `deploy/caddy/Caddyfile` no lugar do `docker-compose.yml`.
Na Cloudflare, aponte um registro **A** `mvrc.com.br` → IP da VPS com **Proxied** (nuvem laranja) e
defina **SSL/TLS** → **Overview** → **Full (strict)**. Na OCI é preciso liberar 80/443 em **dois
lugares**:

1. **Security List/NSG da VCN**: **Networking** → **Virtual cloud networks** → VCN → **Security
   Lists** → _Default Security List_ → **Add Ingress Rules**: Source CIDR `0.0.0.0/0` (ou, melhor,
   as faixas de IP da Cloudflare em `https://www.cloudflare.com/ips/`), IP Protocol TCP,
   Destination Port `80,443`.
2. **Firewall do sistema** (as imagens da Oracle bloqueiam tudo por padrão):
   - Ubuntu (iptables):

     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```

   - Oracle Linux (firewalld):

     ```bash
     sudo firewall-cmd --permanent --add-service=http --add-service=https
     sudo firewall-cmd --reload
     ```

Nesse modo, ajuste o workflow `container.yml` para copiar os arquivos de `deploy/caddy/` em vez do
`docker-compose.yml` da raiz.

✅ **Pronto quando:** `https://mvrc.com.br` abre e o túnel está **Healthy** no painel Zero Trust.

---

## Etapa 7 — GitHub: segredos e deploy com aprovação

1. **Settings** → **Secrets and variables** → **Actions** → aba **Secrets** →
   **New repository secret**, um por vez:

   | Nome                   | Valor                                                                                                                                                                                                                      |
   | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `VPS_HOST`             | IP público da VPS                                                                                                                                                                                                          |
   | `VPS_USER`             | `deploy`                                                                                                                                                                                                                   |
   | `VPS_SSH_KEY`          | conteúdo **inteiro** de `~/.ssh/cv_deploy` (inclui `-----BEGIN ...` e `-----END ...`)                                                                                                                                      |
   | `VPS_PORT`             | (opcional) porta SSH, se não for 22                                                                                                                                                                                        |
   | `VPS_HOST_FINGERPRINT` | **obrigatório**: valor `SHA256:...` da chave **ECDSA** do host, mostrado pelo `setup-vps.sh` (`ssh-keygen -lf /etc/ssh/ssh_host_ecdsa_key.pub`). A action negocia ECDSA; usar a ED25519 dá `host key fingerprint mismatch` |

2. Aba **Variables**: confira que `TURNSTILE_SITE_KEY` existe (etapa 3).
3. `RESEND_API_KEY` e `TURNSTILE_SECRET_KEY` **não** vão para o GitHub: ficam só no
   `.env` da VPS.
4. Abra um **pull request `DEV` → `main`**. O CI roda lint, check, build e Lighthouse.
5. Faça o merge. O workflow **Container** gera as imagens `:latest` e `sha-<commit>` e, no final,
   o job **Request production approval** abre uma issue
   **"Deploy production: sha-…"** (label `deploy-approval`) e **para**.
6. **Aprovar:** abra a issue (aba **Issues**, ou o link no resumo do workflow) e comente
   **`/approve`**. Isso dispara o workflow **Deploy production**, que confere se a imagem existe,
   faz o deploy por SSH, testa `https://mvrc.com.br/healthz`, comenta o resultado e fecha a issue.
   - **`/reject`** fecha a issue sem publicar.
   - Só comentários do **dono do repositório** são aceitos. Se outro build chegar antes da
     aprovação, a issue antiga é fechada e só a mais nova pode ser aprovada.
   - Enquanto a issue espera, nenhum minuto do GitHub Actions é consumido.
   - Por que issue e não o botão nativo "Review deployments"? O botão (revisores obrigatórios em
     **Environments**) não existe em repositório privado no plano Free. Se o repositório ficar
     público ou você assinar o GitHub Pro, dá para trocar por ele.

**Rollback:** **Actions** → **Deploy production** → **Run workflow** → **Branch: main** → informe
no campo _Image tag_ o `sha-<commit-anterior>` (veja as tags em perfil → **Packages** →
`cv-page-mvrc`) → **Run workflow**.

✅ **Pronto quando:** depois do `/approve`, a issue é fechada com "✅ Publicado".
