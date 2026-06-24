# Deploy Notes

## 本地開發

前端：

```powershell
npm run dev
```

本地 API：

```powershell
npm run dev:api
```

沒有 `.env` / `DATABASE_URL` 時，API 會讀：

```text
outputs/taiwan_japan_flights_seed_700.csv
```

## Neon 匯入

1. 複製 `.env.example` 成 `.env`
2. 把 Neon connection string 填到 `DATABASE_URL`
3. 執行：

```powershell
npm run import:flights
```

## Vercel

1. 把專案推到 GitHub
2. 在 Vercel Import Git Repository
3. Framework 選 Vite
4. Build Command 使用預設：

```text
npm run build
```

5. Output Directory 使用預設：

```text
dist
```

6. 到 Vercel Project Settings → Environment Variables 新增：

```text
DATABASE_URL=你的 Neon connection string
```

設定完 `DATABASE_URL` 後，Vercel 的 `/api/flights` 會查 Neon。

如果沒有設定 `DATABASE_URL`，Vercel Functions 會先用專案內的 CSV fallback。
