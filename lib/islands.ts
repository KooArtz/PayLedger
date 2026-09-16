// Maldives cities and inhabited islands, grouped by atoll (atoll code in parentheses).
// Used for the customer form's island/city picker. Free text is still allowed for anything not listed.
const A=(code:string,names:string[])=>names.map(n=>n+" ("+code+")");
export const maldivesIslands:string[]=[
 // Cities
 "Malé","Hulhumalé","Villimalé","Addu City","Fuvahmulah","Kulhudhuffushi","Thinadhoo (GDh)",
 // Haa Alif
 ...A("HA",["Thuraakunu","Uligamu","Molhadhoo","Hoarafushi","Ihavandhoo","Kelaa","Vashafaru","Dhidhdhoo","Filladhoo","Maarandhoo","Thakandhoo","Utheemu","Muraidhoo","Baarah"]),
 // Haa Dhaalu
 ...A("HDh",["Hanimaadhoo","Finey","Naivaadhoo","Hirimaradhoo","Nolhivaram","Nellaidhoo","Nolhivaranfaru","Kurinbi","Kumundhoo","Neykurendhoo","Vaikaradhoo","Maavaidhoo","Makunudhoo","Kunburudhoo"]),
 // Shaviyani
 ...A("Sh",["Kaditheemu","Noomaraa","Goidhoo","Feydhoo","Feevah","Bileffahi","Foakaidhoo","Narudhoo","Maroshi","Lhaimagu","Firunbaidhoo","Komandoo","Maaungoodhoo","Funadhoo","Milandhoo"]),
 // Noonu
 ...A("N",["Hebadhoo","Kedhikolhudhoo","Landhoo","Maalhendhoo","Kudafari","Lhohi","Miladhoo","Magoodhoo","Manadhoo","Holhudhoo","Fodhdhoo","Velidhoo","Maafaru"]),
 // Raa
 ...A("R",["Alifushi","Vaadhoo","Rasgetheemu","Angolhitheemu","Hulhudhuffaaru","Ungoofaaru","Kadholhudhoo","Maakurathu","Rasmaadhoo","Innamaadhoo","Meedhoo","Fainu","Kinolhas","Maduvvaree","Inguraidhoo","Dhuvaafaru"]),
 // Baa
 ...A("B",["Kudarikilu","Kamadhoo","Kendhoo","Kihaadhoo","Dhonfanu","Dharavandhoo","Maalhos","Eydhafushi","Thulhaadhoo","Hithaadhoo","Fulhadhoo","Fehendhoo","Goidhoo"]),
 // Lhaviyani
 ...A("Lh",["Hinnavaru","Naifaru","Kurendhoo","Olhuvelifushi"]),
 // Kaafu
 ...A("K",["Kaashidhoo","Gaafaru","Dhiffushi","Thulusdhoo","Huraa","Himmafushi","Gulhi","Maafushi","Guraidhoo"]),
 // Alif Alif
 ...A("AA",["Thoddoo","Rasdhoo","Ukulhas","Mathiveri","Bodufolhudhoo","Feridhoo","Maalhos","Himandhoo"]),
 // Alif Dhaalu
 ...A("ADh",["Hangnaameedhoo","Omadhoo","Kunburudhoo","Mahibadhoo","Mandhoo","Dhangethi","Dhigurah","Dhidhdhoo","Fenfushi","Maamigili"]),
 // Vaavu
 ...A("V",["Fulidhoo","Thinadhoo","Felidhoo","Keyodhoo","Rakeedhoo"]),
 // Meemu
 ...A("M",["Raimmandhoo","Madifushi","Veyvah","Mulah","Muli","Naalaafushi","Kolhufushi","Dhiggaru","Maduvvaree"]),
 // Faafu
 ...A("F",["Feeali","Bilehdhoo","Magoodhoo","Dharaboodhoo","Nilandhoo"]),
 // Dhaalu
 ...A("Dh",["Meedhoo","Bandidhoo","Rinbudhoo","Hulhudheli","Vaanee","Maaenboodhoo","Kudahuvadhoo"]),
 // Thaa
 ...A("Th",["Buruni","Vilufushi","Madifushi","Dhiyamigili","Guraidhoo","Kandoodhoo","Vandhoo","Hirilandhoo","Gaadhiffushi","Thimarafushi","Veymandoo","Kibidhoo","Omadhoo"]),
 // Laamu
 ...A("L",["Isdhoo","Dhabidhoo","Maabaidhoo","Mundoo","Kalaidhoo","Gan","Maavah","Fonadhoo","Gaadhoo","Maamendhoo","Hithadhoo","Kunahandhoo"]),
 // Gaafu Alif
 ...A("GA",["Kolamaafushi","Villingili","Maamendhoo","Nilandhoo","Dhaandhoo","Dhevvadhoo","Kondey","Gemanafushi","Kanduhulhudhoo","Dhiyadhoo","Kooddoo"]),
 // Gaafu Dhaalu
 ...A("GDh",["Madaveli","Hoandeddhoo","Nadella","Gaddhoo","Rathafandhoo","Vaadhoo","Fiyoari","Faresmaathodaa"]),
 // Seenu (Addu City districts)
 ...A("S",["Hithadhoo","Maradhoo","Maradhoo-Feydhoo","Feydhoo","Hulhudhoo","Meedhoo"]),
];
