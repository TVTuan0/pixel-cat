// GET: two rooms to compare, with a one-time voting ticket.
import { contestRoute } from '../_lib/http.js';
import { nextDuel } from '../_lib/contest.js';

export const GET = contestRoute((store, ctx) => nextDuel(store, ctx));
