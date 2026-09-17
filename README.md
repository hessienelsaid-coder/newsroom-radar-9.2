# Newsroom Radar V9.1.1 — Official RSS/Atom

نسخة معاد بناؤها انطلاقًا من V9.1 مع تبسيط بوابة المصادر: **RSS / Atom مباشر فقط**.

## المصادر
- لا تحويل تلقائي من المواقع.
- لا Web scraping.
- لا JavaScript browser rendering.
- لا Social.
- لا Google Trends.
- لا JSON-to-RSS أو أي وسيط تحويل.
- اختبار المصدر لا ينجح إلا إذا أعاد XML قابلًا للقراءة كـ RSS / Atom ويحتوي عناصر مؤرخة.
- يمكن استيراد OPML، لكن يجب أن تكون الروابط فيه روابط RSS / Atom مباشرة للمصادر التي يملكها المحرر أو يعتمدها رسميًا.

## الاستقرار والسرعة
- الاحتفاظ بآخر 24 ساعة فقط؛ الأخبار الأقدم تحذف قبل التحليل.
- ETag / Last-Modified لتقليل تنزيل الـ feeds عندما لم تتغير.
- إعادة محاولة بدون Cache Validators عند تعارض بعض الخوادم مع الطلبات المشروطة.
- دعم RSS 2.x وRSS 1.x/RDF وAtom، مع namespaces الشائعة وصيغ التاريخ القياسية.
- 6 مصادر كحد أقصى في الجلب المتوازي لتجنب ضغط الشبكة.
- Worker Thread للتحليل حتى لا تتجمد واجهة Electron.
- Cache لنتائج المطابقة والتوكنز داخل Worker.
- إضافة/حذف/تعديل المصدر يظهر فورًا ويستكمل الجلب والتحليل في الخلفية.
- منع التحديثات المتداخلة.
- حفظ غير متزامن.

Electron يوصي بعدم حجب الـ main/UI thread ونقل المهام CPU-heavy إلى Worker Threads، وهو ما يطبقه هذا الإصدار.

## المسار
`.github/workflows/build-windows.yml`

## البناء
```bash
npm install
node scripts/validate-v9.js
npm run dist:win
```
