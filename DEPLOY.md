# Деплой «Лонгбокс» на удалённый сервер

Инструкция для развёртывания через Docker за reverse-proxy (Caddy или Nginx) с HTTPS. Рассчитано на небольшой Linux-сервер.

---

## 1. Требования

- Linux-сервер (1 vCPU / 1 ГБ RAM достаточно).
- Установленные **Docker** и **Docker Compose v2** (`docker --version`, `docker compose version`).
- Домен, указывающий A/AAAA-записью на IP сервера (напр. `comics.example.com`).
- Открытые порты **80** и **443** (для прокси с TLS). Сам контейнер наружу публиковать не нужно.

Установка Docker (Debian/Ubuntu), если ещё нет:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # затем перелогиньтесь
```

---

## 2. Получить код на сервер

```bash
git clone <repo-url> longbox && cd longbox
# либо скопировать проект: scp -r ./longbox user@server:/opt/longbox
```

---

## 3. Настроить переменные окружения

Создайте файл `.env` рядом с `docker-compose.yml`:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```ini
# Пароль входа в CMS — придумайте надёжный
ADMIN_PASSWORD=замените-на-надёжный-пароль

# Секрет для подписи cookie сессии — сгенерируйте случайный:
#   openssl rand -hex 32
SESSION_SECRET=вставьте-сгенерированную-строку

# Публичный адрес (ОБЯЗАТЕЛЬНО для adapter-node, иначе формы входа/CMS отклонит CSRF)
ORIGIN=https://comics.example.com

# Локальный порт контейнера (наружу не публикуется, прокси ходит на него)
PORT=3000

# Реальный IP клиента из-за прокси — для аналитики и анти-брутфорса
ADDRESS_HEADER=X-Forwarded-For
XFF_DEPTH=1
```

> **Важно.** `ORIGIN` должен совпадать с реальным адресом сайта (со схемой `https://`). Без него POST-формы (вход в CMS, сохранение серий) будут возвращать **403**.

---

## 4. Запустить приложение

```bash
docker compose up -d --build
docker compose run --rm app npm run seed   # наполнить справочник издательств (идемпотентно)
docker compose ps                          # статус, должно быть healthy
docker compose logs -f app                 # логи
```

Контейнер слушает порт из `PORT` (по умолчанию 3000). По умолчанию `docker-compose.yml` публикует его на хост (`${PORT}:3000`). За прокси этого можно не делать — см. п.5.

---

## 5. Reverse-proxy + HTTPS

Прокси терминирует TLS и проксирует на контейнер. Выберите **один** вариант.

### Вариант A — Caddy (проще всего, авто-TLS)

`/etc/caddy/Caddyfile`:

```
comics.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

Caddy сам получит и продлит сертификат Let's Encrypt. `X-Forwarded-For` он передаёт автоматически.

### Вариант B — Nginx + certbot

`/etc/nginx/sites-available/longbox`:

```nginx
server {
    listen 80;
    server_name comics.example.com;

    client_max_body_size 10m;   # под загрузку обложек

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/longbox /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d comics.example.com   # выпустит TLS и поправит конфиг на 443
```

> Если прокси и контейнер на одном хосте, в `docker-compose.yml` можно сузить публикацию порта до loopback: `"127.0.0.1:${PORT:-3000}:3000"`.

---

## 5b. Если домена нет — только IP

Работать будет, но с оговорками. Главное правило: **`ORIGIN` должен точно совпадать с тем адресом, который вы вводите в браузере.**

Флаг `Secure` у сессионной куки выставляется автоматически по схеме `ORIGIN`: для `http://` — выключен (вход по HTTP работает), для `https://` — включён. Никаких ручных действий не нужно.

### Вариант 1 — простой HTTP по IP (для локальной сети / VPN)

В `.env`:

```ini
ORIGIN=http://203.0.113.10:3000   # ваш IP и порт, ровно как в браузере
PORT=3000
```

Контейнер уже публикует порт наружу (`${PORT}:3000`), прокси не нужен. Открываете `http://203.0.113.10:3000`.

> ⚠️ **Без HTTPS пароль админки и трафик идут в открытом виде.** Это приемлемо только в доверенной сети (LAN/VPN) или через SSH-туннель. Для доступа из интернета используйте Вариант 2.

SSH-туннель (доступ к админке только себе, без публикации порта):

```bash
ssh -L 8080:127.0.0.1:3000 user@203.0.113.10
# затем локально открываете http://localhost:8080 ; ORIGIN=http://localhost:8080
```

### Вариант 2 — бесплатный HTTPS без своего домена (рекомендуется для интернета)

Сервисы `sslip.io` / `nip.io` дают «домен», автоматически указывающий на ваш IP: `203.0.113.10` → `203-0-113-10.sslip.io`. На такой домен Let's Encrypt **выдаёт настоящий сертификат**, и Caddy поднимет HTTPS сам.

`Caddyfile`:

```
203-0-113-10.sslip.io {
    reverse_proxy 127.0.0.1:3000
}
```

В `.env`:

```ini
ORIGIN=https://203-0-113-10.sslip.io
ADDRESS_HEADER=X-Forwarded-For
XFF_DEPTH=1
```

Открываете `https://203-0-113-10.sslip.io` — валидный TLS, без предупреждений, без покупки домена.

---

## 6. Проверка

1. Откройте `https://comics.example.com` — каталог (пока пустой, издательства подгружены в фильтре).
2. `https://comics.example.com/admin` → войдите паролем из `ADMIN_PASSWORD`.
3. Добавьте серию с обложкой → она появится на главной.

---

## 7. Обновление версии

```bash
cd /opt/longbox
git pull
docker compose up -d --build
```

Схема БД мигрируется автоматически при старте (новые колонки/индексы добавляются идемпотентно). Данные в volume сохраняются.

---

## 8. Резервное копирование

Все данные (БД + загруженные обложки) лежат в Docker-volume `comic_data` (внутри — `/data/comics.sqlite` и `/data/covers`).

Бэкап БД на лету (WAL-безопасно):

```bash
docker compose exec app sh -c "sqlite3 /data/comics.sqlite \".backup '/data/backup-$(date +%F).sqlite'\""
docker compose cp app:/data/backup-$(date +%F).sqlite ./backup-$(date +%F).sqlite
```

> Если в образе нет `sqlite3`, проще скопировать весь каталог данных при остановленном контейнере:
> ```bash
> docker compose stop app
> docker run --rm -v comicboard_comic_data:/data -v "$PWD":/backup alpine \
>   tar czf /backup/longbox-data-$(date +%F).tar.gz -C /data .
> docker compose start app
> ```

Восстановление — распаковать архив обратно в volume.

---

## 9. Автозапуск и ресурсы

- В `docker-compose.yml` уже задано `restart: unless-stopped` — контейнер поднимется после перезагрузки сервера (если демон Docker включён: `sudo systemctl enable docker`).
- Лимит памяти контейнера — `mem_limit: 384m`. Поднимите, если обработка крупных обложек требует больше.

---

## 10. Траблшутинг

| Симптом | Причина / решение |
|---|---|
| Вход/сохранение → **403** «Cross-site POST forbidden» | Не задан или неверный `ORIGIN`. Должен точно равняться публичному `https://`-адресу. |
| Загрузка обложки → **500** «exceeds limit» | Поднимите `BODY_SIZE_LIMIT` (по умолч. 8M) и `client_max_body_size` в Nginx. |
| Все посетители считаются как один / общий лок при брутфорсе | Не передаётся реальный IP. Задайте `ADDRESS_HEADER=X-Forwarded-For` и проксируйте этот заголовок. |
| `healthcheck` в статусе unhealthy | Смотрите `docker compose logs app`; проверьте, что `PORT` совпадает с портом проксирования. |
| Порт занят | Поменяйте `PORT` в `.env` (и адрес в конфиге прокси). |

Полезное:

```bash
docker compose logs -f app      # логи
docker compose restart app      # перезапуск
docker compose down             # остановить (volume сохраняется)
docker compose down -v          # ОПАСНО: остановить и удалить данные (volume)
```
