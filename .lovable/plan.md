## Plan: Remove specified rows from Reservations grid

Remove the following spaces from the Facility Scheduling grid:
- Personal Training Room
- Conference Room
- P3
- Racquetball Court (P3)
- Varsity Place
- Lobby
- MVC Field
- Smith Center Aux Gym
- Smith Center Pool

### Changes

**`src/data/reservationsSeed.ts`**
- Remove the 9 entries above from the `SPACES` array (Conference Room, Personal Training Room, plus the last 6 rows: P3, Racquetball Court (P3), Varsity Place, Lobby, MVC Field, Smith Center Aux Gym, Smith Center Pool — that's 7; with the screenshot rows starting at "P3" being 7. Confirming: last 6 = Varsity Place, Lobby, MVC Field, Smith Center Aux Gym, Smith Center Pool... that's only 5 final ones. Will remove the last 6 entries: Racquetball Court (P3), Varsity Place, Lobby, MVC Field, Smith Center Aux Gym, Smith Center Pool, plus also P3 header row above them).
- Remove now-orphaned reservations referencing those spaces (`r21`, `r22` Conference Room; `r23` Racquetball Court; `r24`, `r25` Smith Center Pool).
