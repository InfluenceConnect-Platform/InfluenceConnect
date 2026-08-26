// Single source of truth for the platform's India state → city taxonomy.
// Replaces the old flat ~7-city "metro only" lists that used to be hardcoded
// separately (and inconsistently) in three different frontend pages. See
// frontend/lib/locations.ts for the mirror.
//
// Selection is two-step: pick a state/UT, then pick a city within it. City
// values already stored on old records (all metro names) are preserved
// verbatim inside their correct state so legacy data keeps matching.

const LOCATIONS = [
  { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Chittoor', 'Srikakulam', 'Vizianagaram'] },
  { state: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila'] },
  { state: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Karimganj', 'Sivasagar', 'Bongaigaon'] },
  { state: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Bihar Sharif'] },
  { state: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh'] },
  { state: 'Goa', cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'] },
  { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Mehsana', 'Bharuch', 'Vapi', 'Morbi'] },
  { state: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa'] },
  { state: 'Himachal Pradesh', cities: ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Bilaspur', 'Una'] },
  { state: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih'] },
  { state: 'Karnataka', cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Davanagere', 'Bellary', 'Shimoga', 'Tumkur', 'Udupi', 'Gulbarga', 'Hassan'] },
  { state: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Kottayam', 'Palakkad', 'Malappuram'] },
  { state: 'Madhya Pradesh', cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'] },
  { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Akola', 'Jalgaon', 'Latur', 'Nanded'] },
  { state: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur'] },
  { state: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai'] },
  { state: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Champhai'] },
  { state: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung'] },
  { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'] },
  { state: 'Punjab', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot'] },
  { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar'] },
  { state: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Gyalshing'] },
  { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Thanjavur'] },
  { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad'] },
  { state: 'Tripura', cities: ['Agartala', 'Udaipur (Tripura)', 'Dharmanagar'] },
  { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Jhansi'] },
  { state: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Haldwani', 'Roorkee'] },
  { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur'] },
  { state: 'Andaman and Nicobar Islands', cities: ['Port Blair'] },
  { state: 'Chandigarh', cities: ['Chandigarh'] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', cities: ['Silvassa', 'Daman', 'Diu'] },
  { state: 'Delhi', cities: ['Delhi', 'New Delhi'] },
  { state: 'Jammu and Kashmir', cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'] },
  { state: 'Ladakh', cities: ['Leh', 'Kargil'] },
  { state: 'Lakshadweep', cities: ['Kavaratti'] },
  { state: 'Puducherry', cities: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'] },
];

const STATES = LOCATIONS.map(s => s.state);

const CITIES_BY_STATE = Object.fromEntries(LOCATIONS.map(s => [s.state, s.cities]));

const ALL_CITIES = [...new Set(LOCATIONS.flatMap(s => s.cities))].sort();

// City -> state lookup, for deriving a legacy profile's state from its
// already-saved free-text city (first state wins on rare name collisions).
const STATE_OF_CITY = {};
LOCATIONS.forEach(s => {
  s.cities.forEach(c => {
    if (!(c in STATE_OF_CITY)) STATE_OF_CITY[c] = s.state;
  });
});

module.exports = {
  LOCATIONS,
  STATES,
  CITIES_BY_STATE,
  ALL_CITIES,
  STATE_OF_CITY,
};
