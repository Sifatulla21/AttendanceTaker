# **App Name**: Attendify Pro

## Core Features:

- Biometric-Linked Google Authentication: Secure sign-in with Google isolation, ensuring attendance records are bound strictly to the user's unique profile with persistence across devices.
- Interactive Matrix Attendance Engine: Dynamic roll-based grid with sticky headers and month navigation. Includes a toggle to activate/deactivate 'On Days' for restricted data entry.
- Cloud Synchronized Registry: Real-time storage of classes, student records, and attendance logs utilizing a scalable cloud database.
- Multi-Month Analytic Reporting: Generates aggregate statistics across custom date ranges, calculating absence totals and cumulative fine penalties for direct CSV export.
- AI Attendance Predictor Tool: An AI tool that analyzes historical attendance patterns to predict at-risk students and recommend optimal 'On Day' scheduling to maximize class participation.
- Haptic Interaction System: Hardware-level vibration feedback when toggling student presence based on conditional history-aware logic.
- Hybrid Backup & Restore: Export structured system state to timestamped JSON files for local redundant storage and manual file-system restoration.

## Style Guidelines:

- Primary Color: Deep dynamic teal (#007D8A) used for highlighting active tokens and main UI actions.
- Background Color: Deep charcoal (#0A0E0F), reflecting the high-contrast dark-mode requirement with a hint of teal hue saturation (15%).
- Accent Color: Forest mint (#008A76), an analogous hue used for secondary active indicators and supportive contrast.
- Status Colors: Emerald green (#50C878) for presence, bold red (#FF4B4B) for absence, and amber-gold (#F7C358) for fine banners.
- Headline and Display font: 'Alegreya', providing a warm, slightly humanist/literary feel for numbers and names; Body font: 'Inter' for high-precision, objective tabular data.
- A 'mobile-first' Single Page Architecture featuring sticky boundaries for tabular columns/rows and a horizontally scrollable navigation system.
- Fluid modal transitions and haptic feedback loops synced with real-time Firestore database updates.