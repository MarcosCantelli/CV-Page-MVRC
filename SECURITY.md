# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's private
vulnerability reporting instead: **Security** tab → **Report a vulnerability**.

You can expect an initial answer within a few days.

## Scope

This repository contains the source code of [mvrc.com.br](https://mvrc.com.br). Secrets
(API keys, tokens, SSH keys) are never stored in the repository; they live only in the
server's `.env` file and in GitHub Actions secrets.
