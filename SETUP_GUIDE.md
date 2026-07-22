# Mohammad Abdullah — Portfolio Website
### সম্পূর্ণ সেটআপ গাইড (ধাপে ধাপে)

---

## ১. GitHub-এ ফাইলগুলো আপলোড করুন

1. আপনার `portfolio-website` রিপোতে যান: `https://github.com/trendytouch65-alt/portfolio-website`
2. **"uploading an existing file"** লিংকে ক্লিক করুন (রিপো খালি থাকলে হোমপেজেই দেখাবে)
3. এই zip-এর ভেতরের **সবগুলো ফাইল ও ফোল্ডার** (index.html, css/, js/, data/, assets/) ঠিক এই স্ট্রাকচার বজায় রেখে ড্র্যাগ করে আপলোড করুন
4. নিচে "Commit changes" বাটনে ক্লিক করুন

> ⚠️ ফোল্ডার স্ট্রাকচার (css/, js/, data/, assets/) ঠিক এভাবেই থাকতে হবে, নাহলে সাইট কাজ করবে না।

---

## ২. Netlify-তে ডিপ্লয় করুন

1. [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
2. GitHub সিলেক্ট করে `portfolio-website` রিপোটা বেছে নিন
3. Build settings-এ কিছু বদলাতে হবে না — এটা প্লেইন HTML/CSS/JS সাইট:
   - Build command: **খালি রাখুন**
   - Publish directory: **`/` (root)**
4. **Deploy** ক্লিক করুন — কিছুক্ষণের মধ্যেই লাইভ লিংক পাবেন (যেমন: `yourname.netlify.app`)

---

## ৩. GitHub Personal Access Token বানানো (এডমিন প্যানেলের জন্য)

এটা একবারই করতে হবে।

1. GitHub-এ লগইন করে যান: **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
   সরাসরি লিংক: https://github.com/settings/personal-access-tokens/new
2. **Token name:** যেকোনো নাম দিন (যেমন: `portfolio-admin`)
3. **Expiration:** যত দিন চান (৯০ দিন / ১ বছর / কাস্টম) — মেয়াদ শেষ হলে নতুন টোকেন বানিয়ে আবার বসাতে হবে
4. **Repository access:** "Only select repositories" সিলেক্ট করে শুধু **`portfolio-website`** বেছে নিন
5. **Permissions → Repository permissions →** "Contents" খুঁজে **Read and write** সিলেক্ট করুন (বাকি সব default/No access রাখতে পারেন)
6. নিচে **"Generate token"** ক্লিক করুন
7. যে টোকেনটা দেখাবে (শুরু হবে `github_pat_...` দিয়ে) সেটা **কপি করে রাখুন** — এটা শুধু একবারই পুরোপুরি দেখাবে

> 🔒 এই টোকেন শুধু `portfolio-website` রিপোর জন্যই কাজ করবে, আপনার পুরো GitHub অ্যাকাউন্টে অ্যাক্সেস দেবে না।

---

## ৪. এডমিন প্যানেল ব্যবহার

1. আপনার লাইভ সাইটে যান, একদম নিচে ফুটারে আপনার প্রোফাইল আইকনে **ডাবল-ক্লিক** করুন
2. পাসওয়ার্ড দিন (যেটা আপনি ঠিক করেছেন) → **Unlock**
3. প্রথমবার — **"GitHub Setup"** ট্যাবে গিয়ে ধাপ ৩-এ বানানো টোকেনটা পেস্ট করে **Save Token** করুন (এটা একবার করলেই এই ব্রাউজারে সবসময়ের জন্য থেকে যাবে)
4. এরপর থেকে **Marquee / Drift Gallery / More Work / Videos / Social & Branding** ট্যাবে গিয়ে —
   - ছবি/ভিডিওর জন্য: GitHub blob লিংক বা YouTube লিংক পেস্ট করে **Add**
   - ↑ ↓ বাটনে ক্রম বদলানো যাবে
   - 🗑 বাটনে ডিলিট (কনফার্মেশন পপআপ আসবে)
   - সবশেষে **"Save Changes"** চাপলেই GitHub-এ কমিট হয়ে যাবে ও সাথে সাথে সাইটে দেখা যাবে
5. পাসওয়ার্ড সেশন ব্রাউজার বন্ধ না করা পর্যন্ত মনে রাখবে; **Log out** বাটনে ম্যানুয়ালি বেরও হতে পারবেন

---

## ৫. নতুন ছবি/ভিডিও যোগ করার নিয়ম

- **ছবি:** আগে যেভাবে GitHub-এ ছবি আপলোড করে blob লিংক কপি করতেন, ঠিক সেভাবেই করুন, তারপর সেই লিংকটা এডমিন প্যানেলের Add বক্সে পেস্ট করুন — বাকিটা প্যানেল নিজে বুঝে নেবে
- **ভিডিও:** YouTube Shorts/সাধারণ যেকোনো লিংক পেস্ট করলেই হবে, থাম্বনেইল অটোমেটিক আসবে

---

## ৬. মনে রাখার মতো বিষয়

- পরিবর্তন সাধারণত কয়েক সেকেন্ডের মধ্যেই লাইভ হয়ে যায় (GitHub-এর সামান্য ক্যাশিং-এর কারণে কদাচিৎ ১-২ মিনিট লাগতে পারে)
- Facebook লিংক এখনো ফাঁকা — Social & Branding ট্যাব থেকে যোগ করলেই কার্ডটা সক্রিয় হয়ে যাবে
- GitHub Token-এর মেয়াদ শেষ হলে এডমিন প্যানেল সেভ করতে ব্যর্থ হবে (টোস্ট মেসেজে জানাবে) — তখন নতুন টোকেন বানিয়ে আবার বসিয়ে দিলেই হবে
