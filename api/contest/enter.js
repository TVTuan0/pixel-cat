// POST { entry }: enters (or updates) the player's room for this week.
import { contestRoute } from '../_lib/http.js';
import { enterContest } from '../_lib/contest.js';

export const POST = contestRoute((store, ctx) => enterContest(store, { ...ctx, entry: ctx.body.entry }));
