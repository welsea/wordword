# Wordword

A web app to note down new words while you learn a language.

## What it does

You save new words. Each word has these fields:

| word | meaning | sentence | checkbox        | timestamp (DD-MM) |
| ---- | ------- | -------- | --------------- | ----------------- |
| ord  | word    | ny ord   | [ ][ ][ ][ ][ ] | 05-10             |

- The meaning is hidden by default. Click it to show the meaning.
- If you know the word without clicking, tick one checkbox. This is a self-check. The app does nothing with it.
- You can tick up to 5 boxes per word.

## Sorting

You can sort the words by:

- the word
- how many times it is checked
- when the word was added

## Tech

- Built with SvelteKit.
- Every device talks to the same server, so your words stay in sync.
- Data is stored in two ways:
  - In development, it saves words in a JSON file.
  - In production (Docker), it saves words in a Postgres database.
  - The app picks Postgres when the `DATABASE_URL` env var is set, otherwise it uses the JSON file.

## Run it (development)

```bash
pnpm install
pnpm dev
```

Then open the address shown in the terminal.

## Run it with Docker

You need Docker and Docker Compose installed.

Start the app and the database:

```bash
docker compose up -d --build
```

The app is now reachable on the host at `http://127.0.0.1:3000`. You put your
own nginx (installed on the host) in front of it (see below).

Docker Compose starts two things:

- `wordword`: the web app. It is published on `127.0.0.1:3000` so only the host can reach it.
- `db`: a Postgres database. Your words are saved here.

The database files are kept in a Docker volume, so your words stay safe when you restart or rebuild.

There is also a `docker-compose.example.yml` file. It is the same setup with
comments explaining what each line does and what you can change.

Useful commands:

```bash
docker compose logs -f        # watch the logs
docker compose down           # stop the app (your data is kept)
docker compose up -d --build  # rebuild after you change the code
```

### Put nginx in front (on the host)

You run nginx on the host (not in Docker). It forwards requests to the app
on `127.0.0.1:3000`. The file `nginx/default.conf` is a ready-made example.

1. Point your domain (an `A` record) to your server's IP address.
2. Copy the example config to your nginx and edit the domain:

```bash
sudo cp nginx/default.conf /etc/nginx/sites-available/wordword
sudo ln -s /etc/nginx/sites-available/wordword /etc/nginx/sites-enabled/wordword
```

   Then open it and change every `example.com` / `www.example.com` to your domain.
3. Test the config and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Turn on HTTPS

`nginx/default.conf` already has an HTTPS example. It needs a TLS certificate.
The easiest free option is Let's Encrypt with certbot, running on the host.

1. Make sure your domain points to the server and port 80 is open.
2. Get a certificate (one-time). The certbot nginx plugin can do it for you:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

3. Make sure the `ssl_certificate` paths in your config use your domain.
4. Reload nginx:

```bash
sudo systemctl reload nginx
```

Then open `https://your-domain`. HTTP will redirect to HTTPS.

Certbot usually renews automatically. To test renewal: `sudo certbot renew --dry-run`.

### Change the password

The compose file uses a default database password. Change it before you put the app on the internet.

Edit `docker-compose.yml` and update both the `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` so they match.

