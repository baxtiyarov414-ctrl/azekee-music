# Azekee Music — serverli, egasi himoyalangan versiya

## Nima tayyor?
- Premium, responsive musiqa sayti (`public/index.html`)
- Qo‘shiqlar serverdan olinadi; hamma tashrif buyuruvchi tinglay oladi
- Egasi login qilgandan keyingina upload boshqaruvi ko‘rinadi
- Upload va o‘chirish API-lari serverda sessiya bilan himoyalangan
- Parol HTML/JavaScript ichiga yozilmagan; bcrypt hash `.env` da saqlanadi
- Login urinishlari cheklangan; sessiya cookie `httpOnly` va `sameSite`
- Audio fayllar serverdagi `uploads/` papkasiga saqlanadi

## Ishga tushirish (Node.js 20+)
1. ZIP arxivni oching.
2. Terminalda loyiha papkasiga kiring.
3. `npm install` bajaring.
4. `.env.example` faylidan `.env` nusxa oling.
5. `npm run make-admin-hash` bajaring va admin parolini kiriting (kamida 12 belgi). Chiqqan `ADMIN_PASSWORD_HASH` qiymatini `.env` ga joylang.
6. `SESSION_SECRET` o‘rniga kamida 32 belgili tasodifiy maxfiy kalit yozing.
7. `npm start` bajaring.
8. Brauzerda `http://localhost:3000` ni oching. Egasi paneliga kirish uchun yuqoridagi **Ega kirishi** tugmasini bosing.

## Internetga joylash
Node.js qo‘llaydigan hosting kerak (masalan, VPS yoki Node web service). Hosting sozlamalarida:
- `NODE_ENV=production`
- `ADMIN_PASSWORD_HASH` va `SESSION_SECRET` environment variable sifatida kiriting
- HTTPS yoqing (production sessiya cookie HTTPS talab qiladi)
- `uploads/` va `data/` papkalari doimiy diskda saqlanishini ta'minlang; aks holda qayta deploydan keyin yuklangan qo‘shiqlar yo‘qolishi mumkin.

## Muhim
Bu loyiha loginni serverda tekshiradi. Faqat frontenddagi yashirin tugma xavfsizlik hisoblanmaydi. Hostingga joylash va domeningizga ulash uchun hosting akkauntingizga kirish kerak bo‘ladi; bu ZIPning o‘zi hostingga avtomatik deploy qilmaydi.
