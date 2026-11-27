# חיבור Supabase ו-Google (חינם)

הדמו ב-GitHub Pages לא צריך את זה. בלי שני המשתנים למטה האפליקציה נשארת על נתוני הדמה.

מה שצריך ממך, אחרי שהפרויקט החינמי ב-Supabase קיים:

1. `VITE_SUPABASE_URL` — כתובת הפרויקט, נראית כמו `https://xxxx.supabase.co`
2. `VITE_SUPABASE_ANON_KEY` — מפתח ה-anon / publishable. לא מפתח service role.
3. Google OAuth Client ID
4. Google OAuth Client Secret — נשמר רק בלוח הבקרה של Supabase, לא בקוד ולא ב-GitHub Pages

## 1. סכמה

במחשב, אחרי `npx supabase login` ו-`npx supabase link --project-ref <ref>`:

```bash
npx supabase db push
```

זה מריץ את הקבצים ב-`supabase/migrations` על הפרויקט החינמי.

אפשר גם להדביק את שני קבצי ה-SQL לפי הסדר ב-SQL Editor של Supabase.

`supabase/seed.sql` הוא נתוני הדוגמה (לירון, דניאל, יוסי, עומר, מאיה). הוא רץ ב-`supabase db reset` מקומי. על הפרויקט המארח מריצים אותו ידנית רק אם רוצים את אותן שורות. הסיסמאות שם לא מיועדות לכניסה אמיתית.

## 2. משתני הסביבה

העתיקו `.env.example` ל-`.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

מפעילים מחדש את `npm run dev`. האתר ב-GitHub Pages לא מקבל את הקובץ הזה, ולכן הדמו שם נשאר על הנתונים המקומיים.

## 3. Google Cloud

יוצרים פרויקט (יש שכבה חינמית) ו-OAuth client מסוג Web application.

Authorized JavaScript origins:

- `https://nadavi256.github.io`
- `http://localhost:5173`

Authorized redirect URIs — שתי הכתובות:

- `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- `https://nadavi256.github.io/mishakim-yachad/`

`<PROJECT_REF>` הוא החלק לפני `.supabase.co` בכתובת הפרויקט. הכתובת ש-Google באמת מחזיר אליה היא ה-callback של Supabase. את כתובת האתר מוסיפים גם שם, וגם ברשימת ה-redirects של Supabase בשלב הבא.

## 4. Supabase Auth

Authentication → Providers → Google: מדליקים, ומדביקים Client ID ו-Client Secret.

Authentication → URL Configuration:

- Site URL: `https://nadavi256.github.io/mishakim-yachad/`
- Redirect URLs:
  - `https://nadavi256.github.io/mishakim-yachad/`
  - `http://localhost:5173/mishakim-yachad/`

אין SMS ואין ספק טלפון. הכניסה היא Google בלבד.

## 5. מה קורה באפליקציה

כפתור «המשך עם Google» נמצא ב-`/#/login` (גם מהפרופיל, «כניסה עם Google»). אחרי כניסה אמיתית, אם אין עדיין תאריך לידה, `complete_onboarding` שומר אותו ב-`private.user_private` ומחשב `is_minor`. מתחת לגיל 16 חובה לסמן את אישור ההורה. זה סימון זמני, לא אימות מול הורה.

בני נוער יכולים להשתמש. אין חסימת גיל 18. אין צ'אט פרטי בין קטין לבגיר: הודעות קיימות רק בתוך פעילות, ורק למארגן ולמשתתפים שאושרו. חסימה מסתירה פרופיל והודעות לשני הצדדים. טלפון, כתובת בית ומיקום מדויק של אדם לא יוצאים בתצוגה הציבורית — רק אזור.
