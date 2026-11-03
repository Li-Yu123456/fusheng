# 浮生上线手册（M3）

> 本地已就绪的是：全部功能与数据（账号 SSO/前世存档/公告/议事厅/SSE）。
> 上线只差三样外部资源：域名（含泛解析）、一台 VPS、十分钟。

## 0. 前置清单

- [ ] 域名一枚（下文以 `fusheng.example` 代称），DNS 支持泛解析
- [ ] VPS（1C1G 起步即可——hub 是零依赖 node 单进程；带宽优先）
- [ ] 服务器装好 node ≥22 与 Caddy

## 1. 代码上服务器

```bash
rsync -av --exclude node_modules --exclude '*/dist' ./ user@vps:/srv/fusheng/
ssh user@vps 'cd /srv/fusheng && npm install --omit=dev && node scripts/build-engine.mjs && npm run build'
```

## 2. DNS

| 记录 | 类型 | 值 |
|---|---|---|
| `fusheng.example` | A | VPS IP |
| `*.fusheng.example` | A | VPS IP |

## 3. 起服务（常驻）

```bash
# systemd（推荐）或 pm2；关键是带着强随机管理令牌
cat >/etc/systemd/system/fusheng.service <<'UNIT'
[Unit]
Description=Fusheng hub
After=network.target
[Service]
WorkingDirectory=/srv/fusheng
Environment=FUSHENG_ADMIN_TOKEN=<openssl rand -hex 16 的输出>
Environment=FUSHENG_PORT=4310
ExecStart=/usr/bin/node hub/server.mjs
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
systemctl enable --now fusheng
```

管理令牌的用途（集中端三把钥匙）：议事厅颁布、公告颁布。**不要**写进仓库。

## 4. Caddy（自动 HTTPS）

```bash
cp deploy/Caddyfile /etc/caddy/Caddyfile
# 把文件里两处 fusheng.example 换成真域名
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```

证书由 Caddy 自动签发续期（Let's Encrypt），HTTP/3 自动开启。

## 5. 上线后 5 分钟验收

```bash
curl -s https://fusheng.example/api/pulse          # {"living":...}
curl -sI https://fusheng.example/nt/notice.js      # 200 text/javascript
# 浏览器：主页新生儿流滚动 / 世界走一世人 / 登录一邮箱 / 议事厅许一愿
```

## 6. 邮件投递切换（SSO 真邮箱）

hub/auth.mjs 的投递层只有一处（`[auth] ... 验证码` 的 console.log 与 last-code.txt）——
上线时把它换成任意邮件 API（Resend/SES/SMTP）调用，接口与其余代码零改动。
注意：不要在邮件服务商控制台之外暴露令牌；验证码有效期与节流已内置。

## 7. 数据与备份

- `hub/data/*.json`（账号/议事厅/公告）+ `hub/data/archive.db`（前世，SQLite）
- 备份 = 定时 tar 这个目录；恢复 = 原样放回。SQLite 建议热备前 `sqlite3 archive.db ".backup ..."`
