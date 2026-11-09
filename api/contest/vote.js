// POST { ticket, winner }: one vote for the cuter of the two rooms in a duel.
import { contestRoute } from '../_lib/http.js';
import { castVote } from '../_lib/contest.js';

export const POST = contestRoute((store, ctx) => castVote(store, { ...ctx, ticket: ctx.body.ticket, winner: ctx.body.winner }));
