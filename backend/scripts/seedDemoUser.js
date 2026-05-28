const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const { DEMO_USER_GOOGLE_ID, demoUser, demoHoldings } = require('../config/demoPortfolio');

async function seedDemoUser() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is required to seed the demo user.');
    }

    await mongoose.connect(mongoUri);

    const holdings = demoHoldings.map((holding) => ({
        ...holding,
        addedAt: new Date()
    }));

    const result = await User.findOneAndUpdate(
        { googleId: DEMO_USER_GOOGLE_ID },
        {
            $set: {
                ...demoUser,
                holdings
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    ).lean();

    console.log(`Seeded demo user ${result.googleId} with ${result.holdings.length} holdings.`);
}

seedDemoUser()
    .catch((error) => {
        console.error('[seedDemoUser] failed', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
