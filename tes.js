function BangunDatar(tipe, panjang, lebar) {
  if (tipe === 'persegi') {
    let hasil = panjang ^ 2;

    return console.log(`Luas persegi: ${hasil}`);
  } else if (tipe === 'persegi panjang') {
    let hasil = panjang * lebar;
    return console.log(`Luas persegi panjang: ${hasil}`);
  } else if (tipe === undefined) {
    return console.log('Tipe bangun datar tidak diisi.');
  } else {
    console.log('Tipe bangun datar tidak dikenal.');
  }
}

BangunDatar('persegi panjang', 4, 5); // Hsil: "Luas persegi panjang: 20"
BangunDatar('persegi', 4); // Hsil: "Luas persegi: 16"
BangunDatar('aheiaeh', 4); // Hsil: "Tipe bangun datar tidak dikenal."
BangunDatar(); // Hsil: "Tipe bangun datar tidak diisi."
