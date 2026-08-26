// Frontend mirror of backend/utils/locations.js — single source of truth for
// the platform's India state → city taxonomy. Do not duplicate city lists
// elsewhere — import from here. Lists cover major cities/towns per state
// (district headquarters and above), not just the metros, per client
// feedback that the old lists were too short.

export interface StateDef { state: string; cities: string[]; }

export const LOCATIONS: StateDef[] = [
  { state: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru", "Ongole", "Chittoor", "Srikakulam", "Vizianagaram", "Machilipatnam", "Tenali", "Proddatur", "Hindupur", "Bhimavaram", "Madanapalle", "Guntakal", "Dharmavaram", "Gudivada", "Narasaraopet", "Tadipatri", "Tadepalligudem", "Chilakaluripet", "Yemmiganur", "Kadiri", "Chirala", "Adoni", "Nandyal", "Palasa", "Amalapuram", "Bapatla", "Kavali", "Ponnur", "Vinukonda", "Nuzvid", "Markapur", "Rajam"] },
  { state: "Arunachal Pradesh", cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Along (Aalo)", "Tezu", "Changlang", "Khonsa", "Roing", "Anini", "Daporijo", "Yingkiong", "Seppa", "Namsai"] },
  { state: "Assam", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Karimganj", "Sivasagar", "Bongaigaon", "Diphu", "North Lakhimpur", "Dhubri", "Goalpara", "Barpeta", "Nalbari", "Mangaldoi", "Golaghat", "Hailakandi", "Morigaon", "Kokrajhar", "Hojai", "Sonari", "Digboi", "Margherita", "Rangia", "Haflong", "Lumding"] },
  { state: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger", "Chapra", "Bihar Sharif", "Motihari", "Bettiah", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Buxar", "Kishanganj", "Jamalpur", "Jehanabad", "Aurangabad", "Gopalganj", "Nawada", "Bagaha", "Madhubani", "Samastipur", "Sitamarhi", "Supaul", "Araria", "Khagaria", "Lakhisarai", "Sheohar", "Sheikhpura", "Banka", "Jamui", "Madhepura"] },
  { state: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari", "Mahasamund", "Kanker", "Kawardha", "Champa", "Naila Janjgir", "Chirmiri", "Bhatapara", "Dongargarh", "Baloda Bazar", "Kondagaon"] },
  { state: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanguem", "Canacona", "Pernem", "Cuncolim", "Valpoi"] },
  { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Nadiad", "Mehsana", "Bharuch", "Vapi", "Morbi", "Navsari", "Veraval", "Porbandar", "Godhra", "Bhuj", "Anjar", "Gandhidham", "Patan", "Palanpur", "Botad", "Amreli", "Surendranagar", "Valsad", "Deesa", "Jetpur", "Wankaner", "Gondal", "Dahod", "Vyara", "Ankleshwar", "Kalol", "Himatnagar", "Modasa", "Bardoli"] },
  { state: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Kaithal", "Rewari", "Jind", "Kurukshetra", "Palwal", "Jhajjar", "Fatehabad", "Mahendragarh", "Narnaul", "Pehowa", "Tohana", "Thanesar", "Bahadurgarh", "Hansi", "Narwana"] },
  { state: "Himachal Pradesh", cities: ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Kullu", "Bilaspur", "Una", "Hamirpur", "Chamba", "Nahan", "Kangra", "Nurpur", "Palampur", "Baddi", "Paonta Sahib", "Sundarnagar", "Kasauli", "Rampur"] },
  { state: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar (Daltonganj)", "Phusro", "Chaibasa", "Chirkunda", "Dumka", "Gumla", "Godda", "Sahibganj", "Pakur", "Chatra", "Koderma", "Lohardaga", "Simdega", "Jamtara", "Khunti", "Latehar"] },
  { state: "Karnataka", cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Davanagere", "Bellary", "Shimoga", "Tumkur", "Udupi", "Gulbarga", "Hassan", "Bijapur", "Bidar", "Raichur", "Hospet", "Gadag", "Chitradurga", "Kolar", "Mandya", "Chikmagalur", "Robertsonpet (KGF)", "Karwar", "Bagalkot", "Ranebennuru", "Ramanagara", "Gangavati", "Yadgir", "Chikkaballapur", "Koppal", "Sirsi", "Puttur", "Kundapura", "Madikeri", "Sagar"] },
  { state: "Kerala", cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram", "Kasaragod", "Idukki", "Pathanamthitta", "Wayanad", "Thodupuzha", "Kayamkulam", "Perinthalmanna", "Manjeri", "Ponnani", "Guruvayur", "Chalakudy", "Muvattupuzha", "Changanassery", "Nedumangad", "Attingal", "Punalur", "Kanhangad", "Payyanur"] },
  { state: "Madhya Pradesh", cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara (Katni)", "Singrauli", "Burhanpur", "Khandwa", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Betul", "Seoni", "Sehore", "Datia", "Nagda", "Itarsi", "Sarni", "Balaghat", "Hoshangabad", "Shahdol", "Morena", "Bhind"] },
  { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai", "Sangli", "Akola", "Jalgaon", "Latur", "Nanded", "Kalyan-Dombivli", "Vasai-Virar", "Malegaon", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Bhiwandi", "Panvel", "Satara", "Beed", "Yavatmal", "Achalpur", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Ratnagiri", "Gondia", "Baramati", "Karad", "Sindhudurg (Oros)", "Washim", "Bhandara"] },
  { state: "Manipur", cities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Senapati", "Ukhrul", "Tamenglong", "Jiribam", "Moirang"] },
  { state: "Meghalaya", cities: ["Shillong", "Tura", "Jowai", "Nongstoin", "Baghmara", "Williamnagar", "Nongpoh", "Resubelpara"] },
  { state: "Mizoram", cities: ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Mamit"] },
  { state: "Nagaland", cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Kiphire", "Peren"] },
  { state: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Bargarh", "Rayagada", "Kendrapara", "Angul", "Dhenkanal", "Koraput", "Paradip", "Balangir", "Bhawanipatna", "Nabarangpur", "Sundargarh", "Talcher", "Konark", "Phulbani", "Nayagarh", "Jajpur"] },
  { state: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Pathankot", "Moga", "Firozpur", "Batala", "Kapurthala", "Faridkot", "Muktsar", "Sangrur", "Barnala", "Rajpura", "Phagwara", "Abohar", "Malerkotla", "Khanna", "Mansa", "Gurdaspur", "Zirakpur", "Nawanshahr", "Nabha", "Tarn Taran"] },
  { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Bharatpur", "Pali", "Sri Ganganagar", "Sawai Madhopur", "Churu", "Jhunjhunu", "Barmer", "Tonk", "Hanumangarh", "Dausa", "Nagaur", "Chittorgarh", "Banswara", "Dholpur", "Beawar", "Bundi", "Jaisalmer", "Karauli", "Baran", "Rajsamand", "Sirohi", "Jalore", "Pratapgarh"] },
  { state: "Sikkim", cities: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Jorethang", "Singtam"] },
  { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur", "Dindigul", "Tiruppur", "Nagercoil", "Kanchipuram", "Karur", "Cuddalore", "Kumbakonam", "Rajapalayam", "Hosur", "Nagapattinam", "Sivakasi", "Pudukkottai", "Karaikudi", "Ambur", "Namakkal", "Tiruvannamalai", "Pollachi", "Ranipet", "Krishnagiri", "Dharmapuri", "Virudhunagar", "Theni", "Vaniyambadi", "Gudiyatham", "Neyveli"] },
  { state: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", "Siddipet", "Mancherial", "Kothagudem", "Sangareddy", "Wanaparthy", "Vikarabad", "Bhongir", "Medak", "Zaheerabad"] },
  { state: "Tripura", cities: ["Agartala", "Udaipur (Tripura)", "Dharmanagar", "Kailashahar", "Belonia", "Khowai", "Ambassa", "Sonamura", "Kamalpur"] },
  { state: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Noida", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Saharanpur", "Jhansi", "Mathura", "Firozabad", "Muzaffarnagar", "Rampur", "Shahjahanpur", "Faizabad (Ayodhya)", "Sitapur", "Etawah", "Mirzapur", "Bulandshahr", "Amroha", "Hapur", "Farrukhabad", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sultanpur", "Basti", "Unnao", "Ghazipur", "Jaunpur", "Lakhimpur", "Pilibhit", "Banda", "Bijnor", "Deoria", "Azamgarh", "Bahraich", "Barabanki", "Etah", "Mainpuri", "Auraiya", "Kannauj"] },
  { state: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Haldwani", "Roorkee", "Kashipur", "Rudrapur", "Ramnagar", "Almora", "Pithoragarh", "Pauri", "Tehri", "Chamoli", "Uttarkashi", "Bageshwar", "Champawat", "Kotdwar"] },
  { state: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Kharagpur", "Baharampur", "Habra", "Kanchrapara", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha", "Darjeeling", "Alipurduar", "Purulia", "Jangipur", "Bolpur", "Cooch Behar", "Haldia", "Ranaghat", "Barrackpore", "Bidhannagar (Salt Lake)", "Dankuni", "Serampore", "Chandannagar", "Baranagar", "Barasat"] },
  { state: "Andaman and Nicobar Islands", cities: ["Port Blair", "Diglipur", "Rangat", "Mayabunder", "Car Nicobar"] },
  { state: "Chandigarh", cities: ["Chandigarh"] },
  { state: "Dadra and Nagar Haveli and Daman and Diu", cities: ["Silvassa", "Daman", "Diu"] },
  { state: "Delhi", cities: ["Delhi", "New Delhi", "Dwarka", "Rohini", "Karol Bagh", "Saket", "Janakpuri", "Pitampura", "Vasant Kunj", "Lajpat Nagar", "Connaught Place", "Mayur Vihar", "Rajouri Garden", "Shahdara", "Najafgarh"] },
  { state: "Jammu and Kashmir", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Sopore", "Kathua", "Rajouri", "Punch", "Kupwara", "Pulwama", "Kulgam", "Budgam", "Ganderbal", "Bandipora", "Shopian", "Reasi", "Doda", "Kishtwar", "Ramban", "Samba"] },
  { state: "Ladakh", cities: ["Leh", "Kargil"] },
  { state: "Lakshadweep", cities: ["Kavaratti", "Agatti", "Minicoy", "Amini"] },
  { state: "Puducherry", cities: ["Puducherry", "Karaikal", "Yanam", "Mahe"] },
];

export const STATES: string[] = LOCATIONS.map(s => s.state);

export const CITIES_BY_STATE: Record<string, string[]> = Object.fromEntries(
  LOCATIONS.map(s => [s.state, s.cities])
);

export const ALL_CITIES: string[] = [...new Set(LOCATIONS.flatMap(s => s.cities))].sort();

// City -> state lookup, for pre-selecting a state dropdown from a legacy
// profile that only has a saved free-text city (first state wins on rare
// name collisions, e.g. "Udaipur" in Rajasthan vs Tripura).
export const STATE_OF_CITY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  LOCATIONS.forEach(s => {
    s.cities.forEach(c => {
      if (!(c in map)) map[c] = s.state;
    });
  });
  return map;
})();
