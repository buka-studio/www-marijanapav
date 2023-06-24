function filterTokensByType(type, tokens) {
  const obj = tokens.reduce((acc, cur) => {
    if (cur.type === type) {
      acc[cur.path.join('.')] = `var(--${cur.name})`;
    }
    return acc;
  }, {});

  const deep = deepen(obj);

  return deep;
}

function deepen(obj) {
  const result = {};

  // For each object path (property key) in the object
  for (const objectPath in obj) {
    // Split path into component parts
    const parts = objectPath.split('.');

    // Create sub-objects along path as needed
    let target = result;
    while (parts.length > 1) {
      const part = parts.shift();
      target = target[part] = target[part] || {};
    }

    // Set value at end of path
    target[parts[0]] = obj[objectPath];
  }

  return result;
}

function createArray({ dictionary, platform }) {
  const arr = dictionary.allTokens;
  return JSON.stringify(arr);
}

module.exports = { createArray, filterTokensByType };
