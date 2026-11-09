// GET: this week's contest, the player's entry, and last week's winners.
import { contestRoute } from '../_lib/http.js';
import { contestStatus } from '../_lib/contest.js';

export const GET = contestRoute((store, ctx) => contestStatus(store, ctx));
