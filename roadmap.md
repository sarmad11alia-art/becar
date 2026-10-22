# Roadmap

- [x] Apple Pay: clicking it shows a red alert "هذا الخيار غير متوفر في الوقت الحالي" (summary.tsx + insurance-summary.tsx); toast host mounted in __root.tsx
- [x] Insurance offers page: report well-known Saudi insurers missing from the catalog so the user can add them
- [x] Promo popup on /summary: user decided it should stay as-is — no auto-close
- [x] Payment page: restore the Visa/Mastercard/مَدى strip above the card form; card-number field keeps logos hidden until the typed number reveals its brand on the right
- [x] Dashboard: stop the duplicate top-center toasts (the global host in __root.tsx also fires on /dashboard); keep only the bottom-right host from _authenticated/route.tsx
- [x] Dashboard inbox: professional highlight on a visitor row when new activity arrives (new visit, card entered, submission)
- [ ] GitHub sync: user connects the project from Project settings → Git → GitHub (agent cannot create the connection; it also creates a new private repo, the existing becar repo can't be linked)
