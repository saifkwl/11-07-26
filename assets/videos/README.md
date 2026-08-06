# Apni videos yahan rakhein

## Zaroori limit
Cloudflare Pages har file ki limit **25 MB** hai. Isse bari video deploy fail kar degi.
Target: **10–20 MB** per video, 1080x1920 (portrait), H.264 mp4.

## Video chhoti karne ka tareeqa (free, HandBrake app)
1. HandBrake kholein -> video open karein
2. Preset: "Fast 1080p30"
3. Video tab -> Quality slider **RF 26–28** par le jayein
4. Start Encode -> file 10-20 MB me aa jayegi

## File yahan rakhein
assets/videos/mix-achar.mp4
assets/images/poster-mix-achar.jpg   (video ka pehla frame, 720px wide, jpg)

## Phir products.json me us product ki entry me likhein:
  "videoFile": "/assets/videos/mix-achar.mp4",
  "videoPoster": "/assets/images/poster-mix-achar.jpg",

Bas. Jis product me videoFile khali hoga, wahan YouTube video hi chalti rahegi —
is liye aap ek ek karke shift kar sakte hain, site kabhi khali nahi dikhegi.
