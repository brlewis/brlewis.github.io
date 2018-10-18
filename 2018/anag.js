const readline = require('readline');
const fs = require('fs');

// http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html

const freq = {
    e: 2,
    t: 3,
    a: 5,
    o: 7,
    i: 11,
    n: 13,
    s: 17,
    r: 19,
    h: 23,
    d: 29,
    l: 31,
    u: 37,
    c: 41,
    m: 43,
    f: 47,
    y: 53,
    w: 59,
    g: 61,
    p: 67,
    b: 71,
    v: 73,
    k: 79,
    x: 83,
    q: 89,
    j: 97,
    z: 101
}

const hashFunctions = [];

hashFunctions['fundamental'] = word => {
    let product = 1;
    for (let i = 0; i < word.length; i++) {
        const prime = freq[word[i]];
        if (prime) {
            product = product * prime;
        } else {
            return 0;
        }
    }
    return product;
}

hashFunctions['sort'] = word => {
    return '=' + word.split('').sort().join('');
}

const hash = hashFunctions[process.argv[2]];
if (!hash) {
    console.error('Usage:');
    Object.keys(hashFunctions).forEach(key => console.error(` node anag.js ${key}`));
    process.exit(1);
}

const anagrams = {};

const start = Date.now();

const rl = readline.createInterface({
  input: fs.createReadStream('/usr/share/dict/words'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
    const h = hash(line.toLowerCase());
    if (h) {
        if (anagrams[h]) {
            anagrams[h].push(line);
            console.log(anagrams[h]);
        } else {
            anagrams[h] = [line];
        }
    }
});

rl.on('close', () => {
    console.log(`${(Date.now() - start)/1000} seconds`);
});
