# สรุปสิ่งที่แก้ไข — burn1ngsphere.github.io

## บั๊กที่แก้แล้ว

| # | ไฟล์ | อาการเดิม | การแก้ |
|---|---|---|---|
| 1 | Portal.html | `data-text` ของ `.glitch` ไม่ตรงกับ h1 สองบรรทัด ทำให้ pseudo-element พื้นทึบทับคำว่า BurN1nGSPheRE | แยก BurN1nGSPheRE ออกเป็น `.glitch-sub` ต่างหาก |
| 2 | Portal.html | `prefers-reduced-motion` ครอบแค่ CSS ส่วน matrix rain / typewriter / parallax / counter ยังวิ่ง | เช็ค `matchMedia` ตัวเดียวใน JS แล้วปิดทุก animation ที่ขับด้วย JS |
| 3 | Portal.html | matrix rain วาดต่อเนื่องแม้สลับแท็บไปแล้ว | หยุด `requestAnimationFrame` ตอน `visibilitychange` |
| 4 | Portal.html | swatch เปลี่ยนสีเป็น `<span>` กดด้วยคีย์บอร์ดไม่ได้ | เปลี่ยนเป็น `<button>` + `aria-pressed` + `aria-label` |
| 5 | Portal.html | parallax ใช้ implicit global (`cityFar`) | ใช้ `getElementById` และกันกรณี element หาย |
| 6 | experience.html | theme toggle ไม่จำค่า refresh แล้วเด้งกลับ dark | เขียน/อ่าน `localStorage` ทั้งใน inline head script และตอน click |
| 7 | experience.html | `certCount` hardcode "Showing 20 of 20" | คำนวณจาก `cards.length` ใน DOM |
| 8 | index.html | นับ cert เป็น 17 แต่ experience มี 20 | เพิ่ม CNSP, ICCA, COE และให้ JS นับจาก DOM |
| 9 | index.html | `target="_blank"` 7 จุดไม่มี `rel` | ลิงก์ภายในเปลี่ยนเป็น relative, ลิงก์ภายนอกใส่ `rel="noopener noreferrer"` |
| 10 | index.html | `background-attachment: fixed` เพี้ยนบน iOS Safari | ย้ายไป `body::before { position: fixed }` |
| 11 | ทุกหน้า | asset ดึงจาก repo CommandRun ผ่าน raw.githubusercontent | ย้ายมาไว้ใน `/assets/` ของ repo นี้ |

## Performance

| รายการ | เดิม | ใหม่ | ลดลง |
|---|---|---|---|
| `bg-cyberpunk.png` → `.webp` | 2,764 KB | 297 KB | **89%** |
| avatar `580289.jpg` → `avatar.webp` | 251 KB | 32 KB | **87%** |
| `experience.html` (ดึง base64 ออก) | 436 KB | 66 KB | **85%** |
| **รวม payload ครั้งแรก** | **~3.5 MB** | **~1.0 MB** | **~71%** |

เพิ่ม `preload` ให้ภาพ LCP, `preconnect` ไป `fonts.gstatic.com`, `width`/`height`/`fetchpriority` บน `<img>` เพื่อกัน layout shift

## SEO

ทุกหน้าได้ครบ: `title` + `description` + `keywords` + `author`, `robots` พร้อม `max-image-preview:large`
(ตัวนี้คือสิ่งที่ทำให้ Google แสดงรูปใหญ่ในผลค้นหา), `canonical`, `hreflang`,
Open Graph ครบชุดพร้อม `og:image:width/height/alt`, Twitter `summary_large_image`,
`theme-color`, favicon set + `site.webmanifest`

**JSON-LD** เปลี่ยนเป็น `@graph` เชื่อมโยงกัน
- `index.html` — WebSite + ProfilePage + Person พร้อม `hasCredential` ครบ 20 ใบ, `alumniOf`, `worksFor`, `knowsAbout`
- `experience.html` — ProfilePage + BreadcrumbList + Person (อ้าง `@id` เดียวกัน ไม่ซ้ำซ้อน)
- `Portal.html` — CollectionPage + BreadcrumbList + SoftwareApplication (CommandRun)

`sitemap.xml` เพิ่ม `lastmod` / `changefreq` / `priority`
`robots.txt` เพิ่มบล็อก GPTBot กับ CCBot
เพิ่ม `404.html` ตามธีมเว็บ (เดิมจะเด้งไปหน้า default ของ GitHub)

## Security

- `Content-Security-Policy` แบบ `<meta>` ทุกหน้า (GitHub Pages ตั้ง header ไม่ได้)
- `referrer` = `strict-origin-when-cross-origin`
- `crossorigin` + `referrerpolicy` บน CDN link เตรียมพร้อมสำหรับ SRI
- ตัดเคลมที่ไม่จริงออก: `AES-256 ENCRYPTED CHANNEL` → `TLS 1.3 · STATIC NODE · NO TRACKING`,
  `session logged` → `no cookies · no analytics`, `Hours Online 24` → `Attack Phases Covered 5`

## Accessibility

- skip link ทั้ง 3 หน้า, `<main>` landmark, `aria-label` บน nav
- `:focus-visible` outline สำหรับคีย์บอร์ด
- `aria-hidden` บนไอคอนตกแต่ง, `lang="th"` เฉพาะข้อความไทย
- `prefers-reduced-motion` ครบทั้ง CSS และ JS

## ยังต้องทำเอง

1. **SRI hash ของ Font Awesome** โมกะใส่ให้ไม่ได้เพราะ container เข้า cdnjs ไม่ได้
   ```bash
   curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css \
     | openssl dgst -sha384 -binary | openssl base64 -A
   ```
   แล้วเติม `integrity="sha384-<ผลลัพธ์>"` ใน `<link>` (มี comment บอกไว้ในไฟล์แล้ว)
2. **Google Search Console** ส่ง `sitemap.xml` ใหม่ และกด Request Indexing ทั้ง 3 URL
3. ลบไฟล์เก่า `assets/bg-cyberpunk.png` กับ `assets/580289.jpg` ออกจาก repo
