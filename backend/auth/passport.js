const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function setupPassport() {
    // Google
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK || '/auth/google/callback'
        }, (accessToken, refreshToken, profile, cb) => {
            // Minimal profile: id, displayName, emails[0].value
            // Google may put a photo in profile.photos[0].value or profile._json.picture
            const photo = (profile.photos && profile.photos[0] && profile.photos[0].value) || (profile._json && profile._json.picture) || '';
            const user = {
                id: profile.id,
                name: profile.displayName || '',
                email: (profile.emails && profile.emails[0] && profile.emails[0].value) || '',
                photo
            };
            return cb(null, user);
        }));
    }

    // Passport serialize/deserialize - we keep it minimal since we'll issue JWTs
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
};
