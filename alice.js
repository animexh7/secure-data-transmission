// Day 3 - Alice's BB84 Functions

const NUM_BITS = 8;


// Generate random bits: 0 or 1
function generateRandomBits(numberOfBits) {
    const bits = [];

    for (let i = 0; i < numberOfBits; i++) {
        bits.push(Math.floor(Math.random() * 2));
    }

    return bits;
}


// Generate random bases: Z or X
function generateRandomBases(numberOfBits) {
    const bases = [];

    for (let i = 0; i < numberOfBits; i++) {
        bases.push(Math.random() < 0.5 ? "Z" : "X");
    }

    return bases;
}


// Encode each bit using the selected basis
function encodePhoton(bits, bases) {
    const photons = [];

    for (let i = 0; i < bits.length; i++) {
        photons.push({
            bit: bits[i],
            basis: bases[i]
        });
    }

    return photons;
}


// Sift the key by keeping only positions
// where Alice and Bob used the same basis
function siftKey(bits, aliceBases, bobBases) {
    const siftedKey = [];

    for (let i = 0; i < bits.length; i++) {
        if (aliceBases[i] === bobBases[i]) {
            siftedKey.push(bits[i]);
        }
    }

    return siftedKey;
}