// ─────────────────────────────────────────
// NoSQL operator injection guard.
//
// Every controller passes request data straight into Mongoose filters, e.g.
// `User.findOne({ email })` in auth.controller's login. Because Express parses
// JSON bodies into real objects, a request body of
//
//     { "email": { "$ne": null }, "password": "x" }
//
// turns that into `User.findOne({ email: { $ne: null } })`, which matches the
// FIRST user in the collection instead of nobody. bcrypt still rejects the
// password (so this is not an auth bypass), but the failed attempt is recorded
// against that unrelated account — so an unauthenticated attacker can lock a
// real user out of their own account without ever knowing their email, and can
// probe which accounts exist. The same trick reaches other users' OTP records
// in resetPassword / verifyOTP, where it can burn a victim's live reset code.
//
// Rather than patch each call site, strip Mongo operators at the edge: any key
// starting with '$' (query operator) or containing '.' (dotted path traversal)
// is removed before a controller ever sees it. Legitimate payloads in this app
// never use either form.
// ─────────────────────────────────────────

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Buffer.isBuffer(value);
}

// Mutates in place rather than rebuilding: in Express 5 `req.query` is exposed
// through a getter with no setter, so reassigning it throws.
function stripOperators(value, depth = 0) {
  // Bounds the walk so a deliberately deep payload can't blow the stack.
  if (depth > 10 || !isPlainObject(value)) return;

  if (Array.isArray(value)) {
    for (const item of value) stripOperators(item, depth + 1);
    return;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      continue;
    }
    stripOperators(value[key], depth + 1);
  }
}

function sanitizeRequest(req, res, next) {
  stripOperators(req.body);
  stripOperators(req.params);
  // Express 5's default 'simple' query parser already returns strings only,
  // but this stays defensive in case the parser is ever switched to 'extended'.
  try { stripOperators(req.query); } catch { /* getter-only in some setups */ }
  next();
}

module.exports = { sanitizeRequest, stripOperators };
