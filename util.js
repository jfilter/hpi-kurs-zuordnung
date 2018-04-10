// https://stackoverflow.com/a/43053803/4028896
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

function* generateCombinations(arr) {
  let i = 0,
    ii = 0;
  while (true) {
    if (i == ++ii) ii++;
    if (ii >= arr.length) {
      i++;
      ii = 0;
    }
    const res = [arr[i], arr[ii]];
    if (i === arr.length) return res;
    yield res;
  }
}

module.exports = { cartesian, generateCombinations };
