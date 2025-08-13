const bcrypt = require('bcryptjs');

async function test() {
  const password = 'TopSteel44!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('Hash length:', hash.length);
  
  // Test de vérification
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid);
}

test();