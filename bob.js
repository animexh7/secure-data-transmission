function generateRandomBases(length) {
    let bases = [];

    for (let i = 0; i < length; i++) {
        let randomNumber = Math.random();

        if (randomNumber < 0.5) {
            bases.push("Z");
        } else {
            bases.push("X");
        }
    }

    return bases;
}
function measurePhoton(photon, guessedBasis) {
    if (photon.basis === guessedBasis) {
        return photon.bit;
    } else {
        return Math.random() < 0.5 ? 0 : 1;
    }
}
function compareKeys(aliceKey, bobKey) {
    let matches = 0;

    for (let i = 0; i < aliceKey.length; i++) {
        if (aliceKey[i] === bobKey[i]) {
            matches++;
        }
    }

    let matchRate = (matches / aliceKey.length) * 100;

    console.log("Matching bits:", matches);
    console.log("Match rate:", matchRate + "%");
}
