# Azekee Music — Netlify

## Joylash
1. ZIP'ni oching va ichidagi fayllarni GitHub repository'ga yuklang.
2. Netlify: Add new project → Import an existing project → GitHub repository tanlang.
3. `netlify.toml` build/publish/functions sozlamalarini belgilaydi.
4. Kompyuterda Node.js 20+ o‘rnating, loyiha papkasida `npm install` bajaring.
5. `npm run make-admin-hash` bajaring, kamida 12 belgili admin parolini kiriting. Chiqqan hashni nusxalang.
6. Netlify → Project configuration → Environment variables ichiga:
   - `ADMIN_USERNAME` = o‘zingiz tanlagan admin login (masalan, `azekee_admin`)
   - `ADMIN_PASSWORD_HASH` = yaratilgan hash
   - `SESSION_SECRET` = kamida 32 belgili tasodifiy maxfiy kalit
   kiriting. Functions scope mavjud bo‘lsin.
7. Netlify'da qayta deploy qiling. Saytda **Ega kirishi** tugmasi orqali `ADMIN_USERNAME` login va o‘zingiz yaratgan parol bilan kiring.

## Saqlash va cheklov
Audio fayllar Netlify Blobs'da saqlanadi va deploydan keyin ham qoladi. Netlify Functions so‘rovining hajm cheklovi sabab ushbu versiyada har bir audio fayl 4 MB gacha. Katta MP3 fayllar uchun to‘g‘ridan-to‘g‘ri object storage upload (S3/R2 kabi) integratsiyasi kerak.

Parol va SESSION_SECRET'ni GitHub'ga yoki sayt kodiga yozmang. Production'da HTTPS ishlating.
