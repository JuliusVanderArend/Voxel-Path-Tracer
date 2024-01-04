async function loadVox(url) {// function to load a text file asynchronously 
  try {
    const response = await fetch(url);
    const data = await response.text();
    return data
  } catch (err) {
    console.error(err);
  }
}
