const jsonText = '{\n  "origin": "majestic",\n  "destination": "sadashivnagar"\n}';
const match = jsonText.match(/\{[\s\S]*\}/);
if (match) {
  console.log(JSON.parse(match[0]));
} else {
  console.log('no match');
}
