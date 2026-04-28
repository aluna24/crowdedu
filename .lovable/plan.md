Update `src/pages/Home.tsx` so the "Reserve Space" hero CTA and the "Reservations" feature card both link to `/reservations` instead of `/group-fitness`.

Changes:
- Hero "Reserve Space" button `<Link to="/group-fitness">` → `<Link to="/reservations">`
- Features array entry titled "Reservations" `to: "/group-fitness"` → `to: "/reservations"`