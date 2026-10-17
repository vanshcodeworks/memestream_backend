# Memestream Backend

Express + MongoDB API for the Memestream meme-sharing app: auth, posts, and
image uploads through Cloudinary.

## Setup

```bash
npm install
cp .env.example .env
node index.js
```

## Layout

```
index.js                Express entrypoint
config/db.js            Mongo connection
config/cloudinary.js    Cloudinary setup
config/corsConfig.js    CORS policy
controllers/            auth, meme, and other route handlers
```

## Dependencies

`express`, `mongoose`, `cloudinary`, `cors`, plus auth dependencies.

## Environment

`backend/.env.example` lists the required variables: MongoDB URI, Cloudinary
credentials, and any auth secrets.

## Related

The frontend is a separate repository (`memestream-frontend`), already pushed
and linked to Vercel.

## Notes

- Images go to Cloudinary rather than being stored in Mongo, so URLs are
  persisted in the document rather than binary blobs.
- `.env` is git-ignored; only `.env.example` is committed.