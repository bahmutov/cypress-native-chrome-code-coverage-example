function add (a, b) {
  return a + b
}

function sub (a, b) {
  return a - b
}

// call add twice to check code coverage counter
console.log('adding 2 + 3 %d, 1 - 10 %d', add(2, 3), add(1, -10))
