// Frontend mirror of backend/utils/locations.js — single source of truth for
// the platform's India state → city taxonomy. Do not duplicate city lists
// elsewhere — import from here. Replaces the old flat ~7-city "metro only"
// lists that used to live separately (and inconsistently) in the discover,
// profile, and campaigns pages.

export interface StateDef { state: string; cities: string[]; }

export const LOCATIONS: StateDef[] = [
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
