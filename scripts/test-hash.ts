import { compare, hash } from 'bcryptjs';

async function testHash() {
    const pwd = 'Naim18005';
    const oldHash = '$2a$10$W2iEhyH4vB1y6VnO.I2lKeP4T2tXXt3TzWeq7vGZ2c43ZtG1oA6/q';

    const isValid = await compare(pwd, oldHash);
    console.log(`Hash matches: ${isValid}`);

    if (!isValid) {
        const newHash = await hash(pwd, 10);
        console.log(`New correct hash: ${newHash}`);
    }
}

testHash();
