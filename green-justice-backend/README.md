# Green Justice Backend

This is a ready backend starter for your Green Justice project using Node.js, Express, MySQL, JWT auth, file upload, dashboard stats, office suggestions, reminders, and socket updates.

## 1. Install

```bash
npm install
```

## 2. Create `.env`

Copy `.env.example` to `.env` and fill your MySQL and JWT values.

## 3. Create database tables

Run the SQL in `sql/schema.sql` inside MySQL.

## 4. Create first admin password hash

Run this in terminal:

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123',10).then(console.log)"
```

Copy the output hash and insert one admin row manually:

```sql
INSERT INTO authorities (name, email, password_hash, department, role)
VALUES ('Admin User', 'admin@greenjustice.com', 'PASTE_HASH_HERE', 'Environmental Unit', 'admin');
```

## 5. Start server

```bash
npm run dev
```

## Important API list

### Public
- `POST /api/complaints` -> submit complaint
- `GET /api/complaints/status/:complaintCode` -> check complaint status
- `GET /api/violation-types` -> get violation list

### Authority / Admin
- `POST /api/auth/login` -> login
- `POST /api/auth/create-authority` -> create authority account (admin only)
- `GET /api/complaints` -> list complaints
- `GET /api/complaints/:id` -> complaint details
- `PUT /api/complaints/:id/status` -> update status
- `DELETE /api/complaints/:id` -> soft delete complaint
- `GET /api/dashboard` -> dashboard numbers
- `GET /api/offices/suggest/:complaintId` -> suggested office for complaint

## Postman examples

### Submit complaint
Use `form-data`:
- violation_type_id: 1
- description: Garbage dumped near lake
- district: Ampara
- landmark: Near bus stand
- latitude: 7.2975
- longitude: 81.6820
- language: en
- size_level: medium
- evidence: [file]

### Login
`POST /api/auth/login`

```json
{
  "email": "admin@greenjustice.com",
  "password": "admin123"
}
```

### Update status
`PUT /api/complaints/1/status`

Headers:
`Authorization: Bearer YOUR_TOKEN`

```json
{
  "status": "in_progress",
  "note": "Authority started review"
}
```

## Notes
- Public users are anonymous. No `users` table needed.
- Delete is soft delete using `is_deleted = TRUE`.
- Reminder email works only after email is configured.
- Socket is optional for frontend. You can also just call status API repeatedly.
