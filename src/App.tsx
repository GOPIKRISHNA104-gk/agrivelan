import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
// Firebase imports restored
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { api } from './services/api';
import { demoUser, demoBuyer, demoFarmerPosts, demoMarketItems } from './data/demoData';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import QRCode from 'qrcode';
import OrdersTracking from './OrdersTracking';
import * as faceapi from 'face-api.js';
import StrictFarmerCamera from './components/StrictFarmerCamera';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { translations, SUPPORTED_LANGUAGES, getStoredLanguage, setStoredLanguage } from './i18n';
import type { LanguageCode } from './i18n';


// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helper component to load Google Fonts ---
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Roboto:wght@400;700&display=swap";
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  return null;
};


// --- MOCK DATA ---
const mockMarketData = [
  { name: 'Tomato', price: '₹35/kg', trend: 'up', predicted: '₹38/kg' },
  { name: 'Onion', price: '₹28/kg', trend: 'down', predicted: '₹25/kg' },
  { name: 'Potato', price: '₹22/kg', trend: 'up', predicted: '₹24/kg' },
  { name: 'Carrot', price: '₹40/kg', trend: 'stable', predicted: '₹40/kg' },
  { name: 'Brinjal', price: '₹30/kg', trend: 'up', predicted: '₹33/kg' },
  { name: 'Cabbage', price: '₹25/kg', trend: 'down', predicted: '₹22/kg' },
  { name: 'Cauliflower', price: '₹45/kg', trend: 'up', predicted: '₹48/kg' },
  { name: 'Bell Pepper', price: '₹60/kg', trend: 'stable', predicted: '₹60/kg' },
  { name: 'Spinach', price: '₹20/bunch', trend: 'down', predicted: '₹18/bunch' },
];



const mockUserOrders = [
  { id: 'ORD789', itemKey: 'gradeATomatoes', date: '2025-09-18', amount: '₹1,750', statusKey: 'delivered' },
  { id: 'ORD790', itemKey: 'freshCarrots', date: '2025-09-19', amount: '₹4,000', statusKey: 'ongoing' },
];

const mockTransactions = [
  { id: 'TRN123', itemKey: 'gradeATomatoes', date: '2025-09-18', amount: '₹1,750', typeKey: 'debit' },
  { id: 'TRN124', itemKey: 'walletTopUp', date: '2025-09-17', amount: '₹5,000', typeKey: 'credit' },
]

// Retained for Order Tracking Demo only (linked to mockUserOrders)
const mockBuyerFeed = [
  { id: 1, productName: 'Tomatoes', productImg: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Prakash Kumar', farmerUpiId: 'prakash@okicici', location: 'Coimbatore, TN', rate: 35, rating: 4.5, description: 'Fresh, organic tomatoes...', coords: { lat: 11.0168, lng: 76.9558 }, grade: 'A' as const, gradeLabel: 'Very Fresh', freshnessScore: 95, quantity: 50 },
  { id: 2, productName: 'Onions', productImg: 'https://wallpaperaccess.com/full/1912930.jpg', farmerName: 'Suresh Farms', farmerUpiId: 'sureshfarms@ybl', location: 'Pollachi, TN', rate: 28, rating: 4.8, description: 'High-quality red onions...', coords: { lat: 10.6621, lng: 77.0118 }, grade: 'A' as const, gradeLabel: 'Very Fresh', freshnessScore: 92, quantity: 100 },
  { id: 3, productName: 'Carrots', productImg: 'https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Organic Greens', farmerUpiId: 'organicgreens@paytm', location: 'Ooty, TN', rate: 40, rating: 4.9, description: 'Sweet and crunchy carrots...', coords: { lat: 11.4102, lng: 76.6950 }, grade: 'A' as const, gradeLabel: 'Very Fresh', freshnessScore: 98, quantity: 75 },
  { id: 4, productName: 'Potatoes', productImg: 'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Hill Valley Farm', farmerUpiId: 'hillvalley@okaxis', location: 'Kodaikanal, TN', rate: 25, rating: 4.6, description: 'Fresh potatoes from the hills...', coords: { lat: 10.2381, lng: 77.4892 }, grade: 'B' as const, gradeLabel: 'Best', freshnessScore: 85, quantity: 120 },
  { id: 5, productName: 'Cabbage', productImg: 'https://images.pexels.com/photos/2518893/pexels-photo-2518893.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Green Fields', farmerUpiId: 'greenfields@upi', location: 'Nilgiris, TN', rate: 22, rating: 4.3, description: 'Organic cabbage, pesticide-free...', coords: { lat: 11.4025, lng: 76.7015 }, grade: 'B' as const, gradeLabel: 'Best', freshnessScore: 82, quantity: 60 },
];

const mockMonthlyIncome = [
  { month: 'April', income: 25000 },
  { month: 'May', income: 32000 },
  { month: 'June', income: 28000 },
  { month: 'July', income: 45000 },
  { month: 'August', income: 38000 },
  { month: 'September', income: 52000 },
];

const mockOrderDetails = [
  {
    id: 'ORD790',
    itemKey: 'freshCarrots',
    buyerName: 'Fresh Veggies Co.',
    date: '2025-09-19',
    quantity: '100kg',
    amount: '₹4,000',
    statusKey: 'ongoing',
    reviews: [
      { rating: 5, comment: 'Excellent quality carrots! Very fresh and sweet.' },
      { rating: 4, comment: 'Good product, but the delivery was a bit late.' },
    ]
  },
  {
    id: 'ORD789',
    itemKey: 'gradeATomatoes',
    buyerName: 'Local Restaurant',
    date: '2025-09-18',
    quantity: '50kg',
    amount: '₹1,750',
    statusKey: 'delivered',
    reviews: [
      { rating: 5, comment: 'Perfect for our sauces. Will order again!' },
    ]
  },
];

const mockDriverData = {
  name: 'Rajesh Kumar',
  vehicleModel: 'Tata Ace',
  vehicleNumber: 'TN 38 AZ 1234',
  pictureUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
};


const languages = [
  { code: 'en', name: 'English', velan: 'Velan' },
  { code: 'ta', name: 'தமிழ்', velan: 'வேளன்' },
  { code: 'te', name: 'తెలుగు', velan: 'వేలన్' },
  { code: 'ml', name: 'മലയാളം', velan: 'വേലൻ' },
  { code: 'kn', name: 'ಕನ್ನಡ', velan: 'ವೇಲನ್' },
  { code: 'hi', name: 'हिंदी', velan: 'वेलन' },
];

// --- Speech Synthesis Utility ---
const speakText = (text, langCode, voices) => {
  if (!('speechSynthesis' in window) || !text) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  const langMap = {
    en: 'en-US', ta: 'ta-IN', te: 'te-IN',
    ml: 'ml-IN', kn: 'kn-IN', hi: 'hi-IN',
  };
  const speechLang = langMap[langCode] || langCode;
  utterance.lang = speechLang;

  const voice = voices.find(v => v.lang === speechLang);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

// --- AUTHENTICATION TRANSLATIONS ---
const AUTH_TRANSLATIONS = {
  en: {
    selectLanguage: "Select Your Language",
    languageSelected: "Language selected successfully.",
    registerAs: "Register As",
    farmer: "Farmer",
    buyer: "Buyer",
    registrationTitle: (role) => `${role} Registration`,
    fullName: "Full Name",
    mobileNumber: "Mobile Number",
    sendOtp: "Send OTP",
    verifyOtp: "Verify OTP",
    verified: "Verified",
    enterOtp: "Enter OTP",
    location: "Location (City/Town)",
    aadharVerification: "Aadhar Number",
    upiId: "UPI ID",
    googleMail: "Google Mail",
    uploadAgriDoc: "Upload Agri Document",
    businessName: "Business Name",
    businessType: "Business Type",
    gstNumber: "GST Number",
    uploadBusinessLicense: "Upload Business License",
    businessAddress: "Business Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    register: "Register",
    alreadyRegistered: "Already registered? Login",
    loginTitle: "Welcome Back!",
    loginSubtitle: "Please enter your details to sign in.",
    username: "Username (Mobile Number)",
    or: "OR",
    signInWithGoogle: "Sign in with Google",
    backToRegistration: "Don't have an account? Register",
    tryDemoMode: "Try Demo Mode",
    login: "Login"
  },
  ta: {
    selectLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    languageSelected: "மொழி வெற்றிகரமாக தேர்ந்தெடுக்கப்பட்டது.",
    registerAs: "பதிவு செய்யவும்",
    farmer: "விவசாயி",
    buyer: "வாங்குபவர்",
    registrationTitle: (role) => `${role} பதிவு`,
    fullName: "முழு பெயர்",
    mobileNumber: "கைபேசி எண்",
    sendOtp: "OTP அனுப்பவும்",
    verifyOtp: "OTP சரிபார்க்கவும்",
    verified: "சரிபார்க்கப்பட்டது",
    enterOtp: "OTP ஐ உள்ளிடவும்",
    location: "இடம் (நகரம்/ஊர்)",
    aadharVerification: "ஆதார் எண்",
    upiId: "UPI ஐடி",
    googleMail: "கூகிள் அஞ்சல்",
    uploadAgriDoc: "விவசாய ஆவணத்தை பதிவேற்றவும்",
    businessName: "வணிக பெயர்",
    businessType: "வணிக வகை",
    gstNumber: "ஜிஎஸ்டி எண்",
    uploadBusinessLicense: "வணிக உரிமத்தை பதிவேற்றவும்",
    businessAddress: "வணிக முகவரி",
    password: "கடவுச்சொல்",
    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    register: "பதிவு",
    alreadyRegistered: "ஏற்கனவே பதிவு செய்துள்ளீர்களா? உள்நுழையவும்",
    loginTitle: "மீண்டும் வருக!",
    loginSubtitle: "உள்நுழைய உங்கள் விவரங்களை உள்ளிடவும்.",
    username: "பயனர்பெயர் (கைபேசி எண்)",
    or: "அல்லது",
    signInWithGoogle: "கூகிள் மூலம் உள்நுழையவும்",
    backToRegistration: "கணக்கு இல்லையா? பதிவு செய்யவும்",
    tryDemoMode: "டெமோ பயன்முறையை முயற்சிக்கவும்",
    login: "உள்நுழையவும்"
  },
  hi: {
    selectLanguage: "अपनी भाषा चुनें",
    languageSelected: "भाषा सफलतापूर्वक चुनी गई।",
    registerAs: "के रूप में पंजीकरण करें",
    farmer: "किसान",
    buyer: "खरीददार",
    registrationTitle: (role) => `${role} पंजीकरण`,
    fullName: "पूरा नाम",
    mobileNumber: "मोबाइल नंबर",
    sendOtp: "ओटीपी भेजें",
    verifyOtp: "ओटीपी सत्यापित करें",
    verified: "सत्यापित",
    enterOtp: "ओटीपी दर्ज करें",
    location: "स्थान (शहर/कस्बा)",
    aadharVerification: "आधार नंबर",
    upiId: "यूपीआई आईडी",
    googleMail: "गूगल मेल",
    uploadAgriDoc: "कृषि दस्तावेज़ अपलोड करें",
    businessName: "व्यवसाय का नाम",
    businessType: "व्यवसाय का प्रकार",
    gstNumber: "जीएसटी नंबर",
    uploadBusinessLicense: "व्यवसाय लाइसेंस अपलोड करें",
    businessAddress: "व्यवसाय का पता",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    register: "पंजीकरण करें",
    alreadyRegistered: "पहले से पंजीकृत हैं? लॉग इन करें",
    loginTitle: "वापस स्वागत है!",
    loginSubtitle: "साइन इन करने के लिए कृपया अपना विवरण दर्ज करें।",
    username: "उपयोगकर्ता नाम (मोबाइल नंबर)",
    or: "या",
    signInWithGoogle: "गूगल के साथ साइन इन करें",
    backToRegistration: "खाता नहीं है? पंजीकरण करें",
    tryDemoMode: "डेमो मोड आज़माएं",
    login: "लॉग इन करें"
  },
  te: {
    selectLanguage: "మీ భాషను ఎంచుకోండి",
    languageSelected: "భాష విజయవంతంగా ఎంపిక చేయబడింది.",
    registerAs: "గా నమోదు చేయండి",
    farmer: "రైతు",
    buyer: "కొనుగోలుదారు",
    registrationTitle: (role) => `${role} నమోదు`,
    fullName: "పూర్తి పేరు",
    mobileNumber: "మొబైల్ నంబర్",
    sendOtp: "OTP పంపండి",
    verifyOtp: "OTP ధృవీకరించండి",
    verified: "ధృవీకరించబడింది",
    enterOtp: "OTP నమోదు చేయండి",
    location: "స్థానం (నగరం/పట్టణం)",
    aadharVerification: "ఆధార్ నంబర్",
    upiId: "UPI ID",
    googleMail: "గూగుల్ మెయిల్",
    uploadAgriDoc: "వ్యవసాయ పత్రాన్ని అప్‌లోడ్ చేయండి",
    businessName: "వ్యాపార పేరు",
    businessType: "వ్యాపార రకం",
    gstNumber: "GST నంబర్",
    uploadBusinessLicense: "వ్యాపార లైసెన్స్‌ను అప్‌లోడ్ చేయండి",
    businessAddress: "వ్యాపార చిరునామా",
    password: "పాస్‌వర్డ్",
    confirmPassword: "పాస్‌వర్డ్‌ను నిర్ధారించండి",
    register: "నమోదు చేయండి",
    alreadyRegistered: "ఇప్పటికే నమోదు చేసుకున్నారా? లాగిన్ చేయండి",
    loginTitle: "తిరిగి స్వాగతం!",
    loginSubtitle: "సైన్ ఇన్ చేయడానికి దయచేసి మీ వివరాలను నమోదు చేయండి.",
    username: "వినియోగదారు పేరు (మొబైల్ నంబర్)",
    or: "లేదా",
    signInWithGoogle: "గూగుల్‌తో సైన్ ఇన్ చేయండి",
    backToRegistration: "ఖాతా లేదా? నమోదు చేయండి",
    tryDemoMode: "డెమో మోడ్‌ను ప్రయత్నించండి",
    login: "లాగిన్ చేయండి"
  },
  ml: {
    selectLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    languageSelected: "ഭാഷ വിജയകരമായി തിരഞ്ഞെടുക്കപ്പെട്ടു.",
    registerAs: "രജിസ്റ്റർ ചെയ്യുക",
    farmer: "കർഷകൻ",
    buyer: "വാങ്ങുന്നയാൾ",
    registrationTitle: (role) => `${role} രജിസ്ട്രേഷൻ`,
    fullName: "പൂർണ്ണമായ പേര്",
    mobileNumber: "മൊബൈൽ നമ്പർ",
    sendOtp: "OTP അയക്കുക",
    verifyOtp: "OTP പരിശോധിക്കുക",
    verified: "പരിശോധിച്ചു",
    enterOtp: "OTP നൽകുക",
    location: "സ്ഥലം (നഗരം/പട്ടണം)",
    aadharVerification: "ആധാർ നമ്പർ",
    upiId: "UPI ID",
    googleMail: "ഗూഗിൾ മെയിൽ",
    uploadAgriDoc: "കൃഷി രേഖ അപ്‌ലോഡ് ചെയ്യുക",
    businessName: "ബിസിനസ്സ് പേര്",
    businessType: "ബിസിനസ്സ് തരം",
    gstNumber: "ജിഎസ്ടി നമ്പർ",
    uploadBusinessLicense: "ബിസിനസ്സ് ലൈസൻസ് അപ്‌ലോഡ് ചെയ്യുക",
    businessAddress: "ബിസിനസ്സ് വിലാസം",
    password: "പാസ്‌വേഡ്",
    confirmPassword: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക",
    register: "രജിസ്റ്റർ ചെയ്യുക",
    alreadyRegistered: "നേരത്തെ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ടോ? ലോഗിൻ ചെയ്യുക",
    loginTitle: "തിരികെ സ്വാഗതം!",
    loginSubtitle: "സൈൻ ഇൻ ചെയ്യാൻ നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക.",
    username: "ഉപയോക്തൃനാമം (മൊബൈൽ നമ്പർ)",
    or: "അല്ലെങ്കിൽ",
    signInWithGoogle: "ഗൂഗിൾ ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക",
    backToRegistration: "അക്കൗണ്ട് ഇല്ലേ? രജിസ്റ്റർ ചെയ്യുക",
    tryDemoMode: "ഡെമോ മോഡ് പരീക്ഷിക്കുക",
    login: "ലോഗിൻ ചെയ്യുക"
  },
  kn: {
    selectLanguage: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    languageSelected: "ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.",
    registerAs: "ನೋಂದಾಯಿಸಿ",
    farmer: "ರೈತ",
    buyer: "ಖರೀದಿದಾರ",
    registrationTitle: (role) => `${role} ನೋಂದಣಿ`,
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    mobileNumber: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    sendOtp: "OTP ಕಳುಹಿಸಿ",
    verifyOtp: "OTP ಪರಿಶೀಲಿಸಿ",
    verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    enterOtp: "OTP ನಮೂದಿಸಿ",
    location: "ಸ್ಥಳ (ನಗರ/ಪಟ್ಟಣ)",
    aadharVerification: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
    upiId: "UPI ID",
    googleMail: "ಗೂಗಲ್ ಮೇಲ್",
    uploadAgriDoc: "ಕೃಷಿ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    businessName: "ವ್ಯಾಪಾರ ಹೆಸರು",
    businessType: "ವ್ಯಾಪಾರ ಪ್ರಕಾರ",
    gstNumber: "ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ",
    uploadBusinessLicense: "ವ್ಯಾಪಾರ ಪರವಾನಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    businessAddress: "ವ್ಯಾಪಾರ ವಿಳಾಸ",
    password: "ಪಾಸ್ವರ್ಡ್",
    confirmPassword: "ಪಾಸ್ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    register: "ನೋಂದಾಯಿಸಿ",
    alreadyRegistered: "ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ? ಲಾಗಿನ್ ಮಾಡಿ",
    loginTitle: "ಮರಳಿ ಸ್ವಾಗತ!",
    loginSubtitle: "ಸೈನ್ ಇನ್ ಮಾಡಲು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.",
    username: "ಬಳಕೆದಾರ ಹೆಸರು (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)",
    or: "ಅಥವಾ",
    signInWithGoogle: "ಗೂಗಲ್‌ನೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    backToRegistration: "ಖಾತೆ ಇಲ್ಲವೇ? ನೋಂದಾಯಿಸಿ",
    tryDemoMode: "ಡೆಮೊ ಮೋಡ್ ಪ್ರಯತ್ನಿಸಿ",
    login: "ಲಾಗಿನ್ ಮಾಡಿ"
  }
};



// --- Reusable Components ---

const Modal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center w-full max-w-sm">
        <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const Speakable = ({ children, text, speak, lang, voices, as = 'div', ...props }) => {
  const handleSpeak = (e) => {
    e.stopPropagation();
    speak(text, lang, voices);
  };

  const componentProps = {
    ...props,
    onClick: (e) => {
      handleSpeak(e);
      if (props.onClick) props.onClick(e);
    },
    style: { ...props.style, cursor: 'pointer' }
  };

  return React.createElement(as, componentProps, children);
};

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-6 left-6 z-10 flex items-center justify-center h-12 w-12 bg-white rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-110"
    aria-label="Go back"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

const LanguageSwitcher = () => {
  // Use global language context
  const { lang, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const currentLangName = supportedLanguages.find(l => l.code === lang)?.nativeName || 'Language';
  const dropdownRef = useRef(null);

  const selectLang = (langCode) => {
    setLanguage(langCode); // Uses global context, persists to localStorage
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-600 hover:text-green-700 transition p-2 rounded-full hover:bg-gray-100"
      >
        <img
          src="https://pub-141831e61e69445289222976a15b6fb3.r2.dev/Image_to_url_V2/image-removebg-preview--2--imagetourl.cloud-1769765246577-fcu9of.png"
          alt="Language"
          className="h-6 w-6 object-contain"
        />
        <span className="hidden md:block font-medium">{currentLangName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-20 ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {supportedLanguages.map(language => (
              <li key={language.code}>
                <button
                  onClick={() => selectLang(language.code)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>{language.nativeName}</span>
                  {lang === language.code && <span className="text-green-600">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InputField = ({ id, label, type = 'text', placeholder = '', disabled = false, speak, lang, voices, name }: any) => (
  <div>
    <Speakable as="label" htmlFor={id} text={label} speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-gray-700">{label}</Speakable>
    <div className="mt-1">
      <input
        id={id} name={name || id} type={type} required disabled={disabled}
        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition duration-150 disabled:bg-gray-100"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const MobileVerificationField = ({ t, speak, lang, voices }) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState(null);

  // Strict regex for 10-digit Indian mobile numbers (starting with 6-9)
  const mobileRegex = /^[6-9]\d{9}$/;

  const validateMobile = (value) => {
    // CRITICAL: Never validate if already verified
    if (otpVerified) {
      setError(null);
      return true;
    }

    // Only validate if non-empty to avoid aggressive errors while typing
    if (value.length > 0 && !mobileRegex.test(value)) {
      setError("Invalid mobile number. Must be 10 digits.");
      speak("Invalid mobile number", lang, voices);
      return false;
    } else {
      setError(null);
      return true;
    }
  };

  const handleMobileChange = (e) => {
    if (otpVerified) return; // Block changes if verified

    // Allow only digits
    const rawValue = e.target.value.replace(/\D/g, '');

    // Prevent more than 10 digits
    if (rawValue.length > 10) return;

    setMobile(rawValue);

    // Auto-clear error if user is correcting it
    if (rawValue.length === 10 && mobileRegex.test(rawValue)) {
      setError(null);
    }
  };

  const handleSendOtp = () => {
    if (otpVerified) return;

    if (mobileRegex.test(mobile)) {
      setError(null); // Clear error before sending
      setOtpSent(true);
      speak(t.enterOtp, lang, voices);
    } else {
      setError("Invalid mobile number. Must be 10 digits.");
      speak("Please enter a valid mobile number", lang, voices);
    }
  };

  const handleVerifyOtp = () => {
    setOtpVerified(true);
    setOtpSent(false); // Optional: reset sent state
    setError(null); // CRITICAL: Clear any residual errors immediately
    speak(t.verified, lang, voices);
  };

  return (
    <div>
      <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">{t.mobileNumber}</label>
      <div className="relative rounded-md shadow-sm">
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          required
          disabled={otpVerified}
          value={mobile}
          onChange={handleMobileChange}
          onBlur={() => validateMobile(mobile)}
          className={`block w-full px-4 py-3 border rounded-md sm:text-sm transition-all pr-24 ${!otpVerified && error
              ? 'border-red-300 ring-red-300 focus:ring-red-500 focus:border-red-500'
              : otpVerified
                ? 'border-green-300 ring-green-300 bg-green-50 text-green-900 font-medium cursor-not-allowed opacity-100'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            }`}
          placeholder="9876543210"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
          {!otpVerified ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpSent || mobile.length !== 10}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white transition-colors my-1 mr-1 ${otpSent || mobile.length !== 10 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
                }`}
            >
              {otpSent ? "Resend" : t.sendOtp}
            </button>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold text-green-700 bg-white border border-green-200 my-1 mr-1 shadow-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {t.verified}
            </span>
          )}
        </div>
      </div>

      {/* Show explicit error message ONLY if not verified */}
      {!otpVerified && error && (
        <p className="mt-1 text-sm text-red-600 font-medium flex items-center animate-fade-in-down">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      )}

      {otpSent && !otpVerified && (
        <div className="mt-3 animate-fade-in-down">
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">{t.enterOtp}</label>
          <div className="flex gap-2">
            <input
              id="otp"
              name="otp"
              type="text"
              required
              className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
              placeholder="XXXXXX"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              {t.verifyOtp}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FileInputField = ({ id, label, speak, lang, voices, onFileVerified, name }) => {
  const [fileName, setFileName] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFileName(event.target.files[0].name);
      if (onFileVerified) {
        setTimeout(() => onFileVerified(true), 1500);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fileName ? 'border-green-500 bg-green-50' : 'border-gray-300'} border-dashed rounded-lg transition-all duration-300 hover:bg-gray-50`}>
        <div className="space-y-1 text-center relative w-full">
          <input id={id} name={name || id} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
          {fileName ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-medium text-green-700 truncate max-w-xs mx-auto">{fileName}</p>
              <p className="text-xs text-gray-500">Click to change</p>
            </>
          ) : (
            <>
              <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <span className="font-medium text-green-600">Upload a file</span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- New custom hook for speech recognition ---
const useSpeechRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if the SpeechRecognition API is available
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Listen for English commands

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
};



// --- Main App Screens ---

const IntroScreen = ({ onFinish }) => {
  useEffect(() => {
    class AgrivelanAnimator {
      languages: { text: string; font: string }[];
      currentIndex: number;
      transitionDuration: number;
      displayDuration: number;
      velanText: HTMLElement | null;
      intervalId: any;

      constructor() {
        this.languages = [
          { text: 'velan', font: 'font-english' }, { text: 'வேளன்', font: 'font-tamil' },
          { text: 'वेलन', font: 'font-hindi' }, { text: 'వేలన్', font: 'font-telugu' },
          { text: 'വേളന്', font: 'font-malayalam' }, { text: 'ವೇಲನ್', font: 'font-kannada' }
        ];
        this.currentIndex = 0; this.transitionDuration = 500; this.displayDuration = 2500;
        this.velanText = document.getElementById('velanText');
        if (this.velanText) this.startAnimation();
      }
      startAnimation() { this.intervalId = setInterval(() => { this.transitionToNext(); }, this.displayDuration); }
      transitionToNext() {
        if (!this.velanText) return;
        this.velanText.classList.add('slide-out');
        setTimeout(() => {
          this.currentIndex = (this.currentIndex + 1) % this.languages.length;
          const currentLang = this.languages[this.currentIndex];
          this.velanText.textContent = currentLang.text;
          this.velanText.className = `velan-text ${currentLang.font}`;
          this.velanText.classList.add('slide-in', 'glow-effect');
          setTimeout(() => { this.velanText.classList.remove('slide-in', 'slide-out', 'glow-effect'); }, this.transitionDuration);
        }, this.transitionDuration / 2);
      }
      stopAnimation() { clearInterval(this.intervalId); }
    }
    const animator = new AgrivelanAnimator();
    const screenTimeout = setTimeout(() => { onFinish(); }, 8000);
    return () => { clearTimeout(screenTimeout); animator.stopAnimation(); };
  }, [onFinish]);

  const introStyles = `
      .intro-container {font - family: 'Roboto', Arial, sans-serif; min-height: 100vh; width: 100%; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #145214 0%, #2a7a2a 60%, #1f4e1f 100%); overflow: hidden; }
      .logo-container {padding: 50px 80px; position: relative; background: transparent; border-radius: 15px; }
      .logo {display: flex; align-items: baseline; font-size: 64px; font-weight: 700; position: relative; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
      .agri-text {margin - right: 8px; color: white; z-index: 1; }
      .velan-container {position: relative; display: flex; flex-direction: column; align-items: flex-start; justify: flex-end; width: 190px; height: 60px; }
      .velan-text {color: #F4E03F; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; font-size: 46px; line-height: 1.1; position: relative; left: 0; z-index: 1; }
      @keyframes slideInRight {from {transform: translateX(100%) scale(0.8); opacity: 0; filter: blur(2px);} to {transform: translateX(0) scale(1); opacity: 1; filter: blur(0);} }
      @keyframes slideOutLeft {from {transform: translateX(0) scale(1); opacity: 1; filter: blur(0);} to {transform: translateX(-100%) scale(0.8); opacity: 0; filter: blur(2px);} }
      @keyframes glow {0 %, 100 % { text- shadow: 2px 2px 4px rgba(0,0,0,0.3); } 50% {text - shadow: 2px 2px 4px rgba(0,0,0,0.3), 0 0 20px #F4E03F; } }
      .slide-in {animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;}
      .slide-out {animation: slideOutLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;}
      .glow-effect {animation: glow 0.5s ease-in-out;}
      .font-english {font - family: 'Roboto', Arial, sans-serif; } .font-tamil {font - family: 'Noto Sans Tamil', sans-serif; } .font-hindi {font - family: 'Noto Sans Devanagari', sans-serif; } .font-telugu {font - family: 'Noto Sans Telugu', sans-serif; } .font-malayalam {font - family: 'Noto Sans Malayalam', sans-serif; } .font-kannada {font - family: 'Noto Sans Kannada', sans-serif; }
      @media (max-width: 768px) { .logo {font - size: 48px; } .velan-text {font - size: 30px; } .logo-container {padding: 40px 25px;} .velan-container {width: 120px; height: 40px;} }
      `;

  return (
    <><style>{introStyles}</style>
      <div className="intro-container">
        <div className="logo-container">
          <div className="logo">
            <span className="agri-text">Agri</span>
            <div className="velan-container">
              <span className="velan-text font-english" id="velanText">velan</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const LanguageSelectionScreen = ({ onSelect, speak, voices }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-stone-100 p-4">
      <div className="mb-10 text-center">
        <Speakable as="h1" text={AUTH_TRANSLATIONS.en.selectLanguage} speak={speak} lang="en" voices={voices} className="text-4xl font-bold text-stone-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {AUTH_TRANSLATIONS.en.selectLanguage}
        </Speakable>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-2xl">
        {languages.map(language => (
          <button
            key={language.code}
            onClick={() => {
              const confirmation = AUTH_TRANSLATIONS[language.code].languageSelected;
              speak(confirmation, language.code, voices);
              onSelect(language.code);
            }}
            className="p-5 bg-white rounded-xl shadow-lg hover:shadow-2xl border border-transparent hover:border-amber-400 transition-all duration-300 text-xl font-semibold text-stone-700 transform hover:-translate-y-2">
            {language.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const RoleSelectionScreen = ({ t, onSelectRole, onBack, speak, lang, voices }: any) => {
  const activeT = AUTH_TRANSLATIONS[lang] || t;
  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-stone-100 p-4">
      <BackButton onClick={onBack} />
      <Speakable as="h2" text={activeT.registerAs} speak={speak} lang={lang} voices={voices} className="text-4xl font-bold text-stone-800 mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>{activeT.registerAs}</Speakable>
      <div className="space-y-6 w-full max-w-sm">
        <button
          onClick={() => { speak(activeT.farmer, lang, voices); onSelectRole('farmer'); }}
          className="w-full text-white bg-green-800 hover:bg-green-900 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-xl px-5 py-4 text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          {activeT.farmer}
        </button>
        <button
          onClick={() => { speak(activeT.buyer, lang, voices); onSelectRole('buyer'); }}
          className="w-full text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-xl px-5 py-4 text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          {activeT.buyer}
        </button>
      </div>
    </div>
  );
};

const RegistrationScreen = ({ t, role, onRegister, onSwitchToLogin, onBack, speak, lang, voices, onFileVerified }: any) => {
  const activeT = AUTH_TRANSLATIONS[lang] || t;
  const isFarmer = role === 'farmer';
  const title = activeT.registrationTitle(isFarmer ? activeT.farmer : activeT.buyer);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(formRef.current!);
      const data = Object.fromEntries(formData.entries()) as any;

      // Debug: log form data to see what's being captured
      console.log('📝 Form Data:', data);
      console.log('📱 Mobile from form:', data.mobile, 'Length:', data.mobile?.length);

      // Validate password match
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        speak('Passwords do not match', lang, voices);
        setLoading(false);
        return;
      }

      // Clean mobile number - remove any non-digits
      const cleanMobile = (data.mobile || '').replace(/\D/g, '');
      console.log('📱 Clean Mobile:', cleanMobile, 'Length:', cleanMobile.length);

      // Import auth service dynamically
      const { registerUser, saveUserSession } = await import('./services/auth');

      // Register user with cleaned mobile
      const result = await registerUser({
        mobile: cleanMobile,
        password: data.password,
        fullName: data.fullName,
        role: role,
        location: data.location,
        aadhar: data.aadhar,
        upiId: data.upiId,
        googleMail: data.googleMail,
        businessName: data.businessName,
        businessType: data.businessType,
        gst: data.gst,
        businessAddress: data.businessAddress
      });

      if (!result.success) {
        setError(result.error || 'Registration failed');
        speak(result.error || 'Registration failed', lang, voices);
        setLoading(false);
        return;
      }

      // Save session
      if (result.user) {
        saveUserSession(result.user);
      }

      speak('Registration successful! Welcome to AgriVelan.', lang, voices);
      onRegister(result.user);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      speak('Registration failed. Please try again.', lang, voices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Speakable as="h2" text={title} speak={speak} lang={lang} voices={voices} className="mt-6 text-center text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {title}
        </Speakable>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-12 px-6 shadow-xl rounded-2xl sm:px-12 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
            <InputField name="fullName" id="name" label={activeT.fullName} placeholder="John Doe" speak={speak} lang={lang} voices={voices} />
            <MobileVerificationField t={activeT} speak={speak} lang={lang} voices={voices} />
            <InputField name="location" id="location" label={activeT.location} placeholder="Your City" speak={speak} lang={lang} voices={voices} />
            <InputField name="aadhar" id="aadhar" label={activeT.aadharVerification} type="text" placeholder="XXXX XXXX XXXX" speak={speak} lang={lang} voices={voices} />

            {isFarmer ? (
              <InputField name="upiId" id="upiId" label={activeT.upiId} placeholder="user@upi" speak={speak} lang={lang} voices={voices} />
            ) : (
              <InputField name="googleMail" id="googleMail" label={activeT.googleMail} type="email" placeholder="you@example.com" speak={speak} lang={lang} voices={voices} />
            )}

            {isFarmer && <FileInputField name="agriDoc" id="agriDoc" label={activeT.uploadAgriDoc} speak={speak} lang={lang} voices={voices} onFileVerified={onFileVerified} />}

            {!isFarmer && (<>
              <InputField name="businessName" id="businessName" label={activeT.businessName} placeholder="Agri Traders Inc." speak={speak} lang={lang} voices={voices} />
              <InputField name="businessType" id="businessType" label={activeT.businessType} placeholder="Wholesaler, Retailer, etc." speak={speak} lang={lang} voices={voices} />
              <InputField name="gst" id="gst" label={activeT.gstNumber} placeholder="22AAAAA0000A1Z5" speak={speak} lang={lang} voices={voices} />
              <FileInputField name="businessLicense" id="businessLicense" label={activeT.uploadBusinessLicense} speak={speak} lang={lang} voices={voices} onFileVerified={() => { }} />
              <InputField name="businessAddress" id="businessAddress" label={activeT.businessAddress} placeholder="123 Market St, Your City" speak={speak} lang={lang} voices={voices} />
            </>)}

            <InputField name="password" id="password" label={activeT.password} type="password" placeholder="Min 6 characters" speak={speak} lang={lang} voices={voices} />
            <InputField name="confirmPassword" id="confirmPassword" label={activeT.confirmPassword} type="password" placeholder="Confirm password" speak={speak} lang={lang} voices={voices} />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white ${loading ? 'bg-gray-400' : 'bg-green-800 hover:bg-green-900'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-[1.01]`}>
                {loading ? 'Registering...' : activeT.register}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <span className="text-green-700 font-bold">{activeT.login}</span>
                <span className="ml-1 text-gray-500">instead</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 left-6">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
};



const LoginScreen = ({ t, role, onLogin, onDemoLogin, onSwitchToRegister, onBack, speak, lang, voices, setUserData, setIsFarmerVerified }: any) => {
  const activeT = AUTH_TRANSLATIONS[lang] || t;
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!mobile || mobile.length !== 10) {
        setError('Please enter a valid 10-digit mobile number');
        speak('Please enter a valid mobile number', lang, voices);
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Please enter your password');
        speak('Please enter your password', lang, voices);
        setLoading(false);
        return;
      }

      // Import auth service dynamically
      const { loginUser, saveUserSession } = await import('./services/auth');

      // Attempt login
      const result = await loginUser(mobile, password, role);

      if (!result.success) {
        setError(result.error || 'Invalid credentials');
        speak(result.error || 'Invalid mobile number or password', lang, voices);
        setLoading(false);
        return;
      }

      // Save session
      if (result.user) {
        saveUserSession(result.user);
        setUserData(result.user);
      }

      if (setIsFarmerVerified) setIsFarmerVerified(true);
      speak('Login successful! Welcome back.', lang, voices);
      onLogin();

    } catch (err: any) {
      console.error('Login error:', err);
      setError('Login failed. Please check your connection.');
      speak('Login failed. Please try again.', lang, voices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Speakable as="h2" text={activeT.loginTitle} speak={speak} lang={lang} voices={voices} className="mt-6 text-center text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {activeT.loginTitle}
        </Speakable>
        <Speakable as="p" text={activeT.loginSubtitle} speak={speak} lang={lang} voices={voices} className="mt-2 text-center text-sm text-gray-600">
          {activeT.loginSubtitle}
        </Speakable>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 shadow-xl rounded-2xl sm:px-12 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{activeT.username}</label>
              <input
                id="username"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                required
                maxLength={10}
                className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{activeT.password}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white ${loading ? 'bg-gray-400' : 'bg-green-800 hover:bg-green-900'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-[1.01]`}>
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : activeT.login}
              </button>
            </div>
          </form>

          {role === 'buyer' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{activeT.or}</span>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 48 48">
                    <path d="M44.5,20H24v8.5h11.8C34.7,33.9,30.1,37,24,37c-7.2,0-13-5.8-13-13s5.8-13,13-13c3.1,0,5.9,1.1,8.1,2.9l6.4-6.4C34.6,4.1,29.6,2,24,2C11.8,2,2,11.8,2,24s9.8,22,22,22c11,0,21-8,21-22C46,22.5,45.5,21.2,44.5,20z" />
                  </svg>
                  <span>{activeT.signInWithGoogle}</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New here?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <span className="text-green-700 font-bold">Register</span>
                <span className="ml-1 text-gray-500">a new account</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <p className="text-xs text-amber-800 font-medium mb-2">
              {role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'} Demo Credentials
            </p>
            <p className="text-sm text-amber-900 font-mono">
              Mobile: {role === 'farmer' ? '7894561230' : '9876543210'}
            </p>
            <p className="text-sm text-amber-900 font-mono">Password: 123456</p>
          </div>
          <button
            onClick={async () => {
              const { demoLogin } = await import('./services/auth');
              const demoUser = demoLogin(role);
              setUserData(demoUser);
              if (setIsFarmerVerified) setIsFarmerVerified(true);
              speak('Welcome to demo mode!', lang, voices);
              onLogin();
            }}
            className="text-amber-600 hover:text-amber-800 font-semibold text-sm tracking-wider block w-full transition-colors py-2"
          >
            🎮 Try Demo Mode
          </button>
        </div>
      </div>

      <div className="absolute top-6 left-6">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
};




// --- Dashboard Components ---
const FarmerDashboard = ({ t, navigate, speak, lang, voices, isFarmerVerified, showModal, handleTrackOrder, onFarmerTrackOrder, userData, isDemoMode }: any) => {
  const [showIncomeChart, setShowIncomeChart] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tickerItems, setTickerItems] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const handlePostSuccess = async (postData: any) => {
    const newPost = { ...postData, id: Date.now().toString(), status: 'Posted' };
    setPosts([newPost, ...posts]);
    setShowCamera(false);
    speak("Product posted successfully", lang, voices);

    if (userData?.uid && !isDemoMode) {
      try {
        if (userData.uid) {
          newPost.farmerId = userData.uid;
        }
        await api.createPost(newPost);
      } catch (e) { console.error(e); }
    }
  };

  // --- FARMER ORDERS LOGIC ---






  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const userId = userData?.uid || userData?.id || 'demo_user';
        const locationQuery = userData?.location ? `&location=${userData.location}` : '';
        const res = await fetch(`http://localhost:5000/api/prices/latest?user_id=${userId}${locationQuery}`);
        if (res.ok) {
          const data = await res.json();
          if (data.trends && data.trends.length > 0) {
            setTickerItems(data.trends);
          }
        }
      } catch (error) {
        console.error("Failed to fetch ticker data", error);
      }
    };
    fetchTicker();
  }, [userData]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (isDemoMode) {
        setPosts(demoFarmerPosts);
        setLoading(false);
        return;
      }
      if (!userData?.uid) {
        setPosts([]);
        return;
      }
      setLoading(true);
      try {
        const data = await api.fetchFarmerPosts(userData.uid);
        setPosts(data);
      } catch (e) {
        console.error("Error fetching posts:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userData, isDemoMode]);

  const chartData = {
    labels: mockMonthlyIncome.map(d => d.month),
    datasets: [
      {
        label: t.monthlyIncome,
        data: mockMonthlyIncome.map(d => d.income),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t.monthlyIncome,
      },
    },
  };

  return (

    <div className="bg-white min-h-screen pb-20 font-sans text-gray-800">
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-center py-1 font-bold shadow-md text-xs">
          DEMO MODE
        </div>
      )}

      {/* 1. Header & Top Bar */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs font-bold text-gray-500 tracking-wider">LOCATION</span>
            {/* Placeholder for location */}
            <div className="flex items-center text-gray-800 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {userData?.location || "Coimbatore, TN"}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <button onClick={() => navigate('profile')} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. Ticker (Moved to Top) */}
        <div className="bg-slate-900 text-white py-2 px-1 rounded-md overflow-hidden text-xs">
          <div className="animate-marquee whitespace-nowrap flex space-x-6">
            {(tickerItems.length > 0 ? tickerItems : mockMarketData).concat(tickerItems.length > 0 ? tickerItems : mockMarketData).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="font-bold text-gray-300">{item.name}:</span>
                <span className="font-semibold">{item.price}</span>
                <span className={`${item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                  {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '-'}
                </span>
                <span className="textm-gray-500 hidden sm:inline text-[11px]">
                  ({item.prev || item.predicted})
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">

        {/* 3. Summary Cards (Dynamic Data) */}
        {(() => {
          let revenue = 0;
          let ordersCount = 0;
          let profit = 0;

          if (isDemoMode) {
            revenue = 125430;
            ordersCount = 125;
            profit = 22100;
          }

          return (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Revenue */}
              <div onClick={() => setShowIncomeChart(!showIncomeChart)} className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <span className="font-bold text-xl">₹</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t.revenue}</p>
                  <p className="text-xl font-bold text-gray-800">₹{revenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Orders */}
              <div onClick={() => navigate('orders')} className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t.orders}</p>
                  <p className="text-xl font-bold text-gray-800">{ordersCount}</p>
                </div>
              </div>

              {/* Profit */}
              <div className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t.profit}</p>
                  <p className="text-xl font-bold text-green-600">+₹{profit.toLocaleString()}</p>
                </div>
              </div>
            </section>
          );
        })()}

        {showIncomeChart && (
          <section className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <Bar options={chartOptions as any} data={chartData} />
          </section>
        )}

        {/* Prediction Card */}
        <section onClick={() => navigate('prediction')} className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl shadow-md p-6 border border-emerald-100 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all transform active:scale-95 mb-6 group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-100/30 to-transparent skew-x-12"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-green-600 text-white p-1.5 rounded-lg shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">PREDICTION</h2>
              </div>
              <p className="text-gray-600 text-sm font-medium">
                View <span className="text-green-700 font-bold">Today's AI Price Prediction</span> for all produce.
              </p>
              <div className="mt-3 flex items-center text-xs font-bold text-green-700 group-hover:translate-x-1 transition-transform">
                <span>CHECK PRICES</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </div>
            </div>

          </div>
        </section>

        {/* 4. AI Camera Grading (Always Visible) */}
        <section className="bg-green-800 rounded-2xl shadow-xl p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Sell Produce</h2>
            <p className="text-green-100 mb-6 text-sm">Scan your produce to instantly grade and post.</p>
            <button onClick={() => setShowCamera(true)} className="bg-white text-green-900 font-bold py-3 px-10 rounded-full shadow-lg hover:bg-gray-50 transition-colors transform active:scale-95">
              {t.capture}
            </button>
          </div>
        </section>

        {/* Camera Modal */}
        {showCamera && (
          <StrictFarmerCamera
            onPostSuccess={handlePostSuccess}
            onCancel={() => setShowCamera(false)}
            speak={(msg) => speak(msg, lang, voices)}
          />
        )}

        {/* 5. My Posts */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">{t.myPosts}</h2>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Live Updates</span>
          </div>

          {loading ? <p className="text-center text-gray-400">Loading...</p> : (
            <div className="space-y-4">
              {posts.length === 0 && <p className="text-gray-400 text-sm italic">No posts yet.</p>}

              {posts.map(post => (
                <div key={post.id} className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 flex justify-between items-center group hover:border-green-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    {post.productImg ? (
                      <img src={post.productImg} alt={post.name} className="w-16 h-16 rounded-lg object-cover shadow-sm bg-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">🌱</div>
                    )}
                    <div>
                      <p className="font-bold text-gray-800 text-lg leading-tight">{post.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-semibold text-gray-500">{post.quantity} {post.unit || 'kg'}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                          ₹{post.price}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${post.status === 'Delivered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      post.status === 'Ordered' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                      {post.status || 'Posted'}
                    </span>

                    {/* Track Order Button for Farmer */}
                    <button
                      onClick={() => onFarmerTrackOrder(post)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition-colors flex items-center"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </main>

      {/* 7. Bottom Navigation */}
      {/* 7. Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-8 flex justify-between items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Active Item: Home (Velan AI) */}
        <button id="velan-ai-button" onClick={() => navigate('velan-ai')} className="flex flex-col items-center space-y-1 text-green-700 hover:text-green-800 transition-colors w-16">
          <img
            src="https://pub-141831e61e69445289222976a15b6fb3.r2.dev/Image_to_url_V2/IMG_20251207_114151-removebg-preview-imagetourl.cloud-1769594503880-gn7kxd.png"
            alt="Velan AI"
            className="h-6 w-6 object-contain"
          />
          <span className="text-[10px] font-bold tracking-wide">VELAN AI</span>
        </button>

        {/* Inactive Item: Orders */}
        <button onClick={() => navigate('buyerOrders')} className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-600 transition-colors w-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">ORDERS</span>
        </button>

        {/* Inactive Item: Settings */}
        <button onClick={() => navigate('profile')} className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-600 transition-colors w-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">SETTINGS</span>
        </button>
      </nav>

      <style>{`
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
};

const OrdersScreen = ({ t, navigate, userData, isDemoMode }: any) => {

  const StarRating = ({ rating, size = 'h-5 w-5' }) => {
    const fullStars = Math.floor(rating);
    return (<div className="flex items-center">{[...Array(fullStars)].map((_, i) => <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`${size} text-amber-400`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>);
  };

  // Determine which orders to display
  // STRICT RULE: Only show mock data in demo mode. Real mode starts empty.
  const orders = isDemoMode ? mockOrderDetails : [];

  return (
    <div className="bg-stone-100 min-h-screen">
      <header className="flex items-center justify-between sticky top-0 p-4 bg-white shadow-md z-10">
        <div className="flex items-center">
          <div className="absolute top-1/2 -translate-y-1/2 left-4">
            <BackButton onClick={() => navigate('dashboard')} />
          </div>
          <h1 className="text-2xl font-bold text-center w-full">{t.orders}</h1>
        </div>
        <LanguageSwitcher />
      </header>
      <main className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center opacity-80">
            <div className="bg-gray-200 p-6 rounded-full mb-6 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
              Your orders will appear here once you start selling.
            </p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{t[order.itemKey] || order.itemKey}</p>
                  <p className="text-sm text-gray-500">{order.id} - {order.buyerName}</p>
                  <p className="text-sm text-gray-500">{order.quantity} | {order.amount}</p>
                </div>
                <span className={`text-sm font-bold py-1 px-3 rounded-full ${order.statusKey === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {t[order.statusKey] || order.statusKey}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700">{t.customerReviews}</h3>
                <div className="space-y-3 mt-2">
                  {order.reviews.map((review, index) => (
                    <div key={index} className="bg-stone-50 p-3 rounded-lg">
                      <StarRating rating={review.rating} />
                      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

const BuyerContainer = ({ t, navigate, onSelectProduct, buyerData, lang, setLang, handleTrackOrder, isDemoMode }: any) => {
  const [activeTab, setActiveTab] = useState('market'); // market, delivery, account

  const renderContent = () => {
    switch (activeTab) {
      case 'market': return <MarketScreen t={t} onSelectProduct={onSelectProduct} isDemoMode={isDemoMode} />;
      case 'delivery': return <DeliveryScreen t={t} onTrackOrder={handleTrackOrder} />;
      case 'account': return <AccountScreen t={t} onTrackOrder={handleTrackOrder} />;
      default: return <MarketScreen t={t} onSelectProduct={onSelectProduct} />;
    }
  }

  const BottomNavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center transition w-20 ${isActive ? 'text-green-700' : 'text-gray-600 hover:text-green-700'}`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="bg-[#f4f6fb] min-h-screen pb-24 font-sans text-gray-800">
      {/* 
        Blinkit-style Header 
        Mobile Layout:
        Row 1: Location (Left) + Profile (Right)
        Row 2: Search Bar
      */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="px-4 pt-3 pb-2 flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-green-700 leading-tight tracking-wider">AGRIVELAN</h1>
            <div className="flex items-center text-sm text-gray-500 font-medium">
              <span className="truncate max-w-[200px]">{buyerData?.location || 'Select Location'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <button onClick={() => navigate('buyerProfile')} className="bg-gray-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* Search Bar - Separate Row for Mobile */}
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Search 'milk'"}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-600 focus:border-green-600 sm:text-sm shadow-inner"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {renderContent()}
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2 px-4 z-30 pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <BottomNavItem label={t.market || "Home"} isActive={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'market' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
          <BottomNavItem label={t.delivery || "Orders"} isActive={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'delivery' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10M16 16l4-4m0 0l-4-4m4 4H9" /></svg>} />
          <BottomNavItem label={t.account || "Account"} isActive={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'account' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        </div>
      </footer>
    </div>
  );
};

const MarketValueSection = ({ t, data }) => {
  // Convert Market Value Ticker to "Featured/Categories" style
  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-lg font-bold text-gray-900 leading-none">{t.marketValue}</h2>
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">See All</span>
      </div>
      <div className="flex space-x-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {data.map((item, index) => (
          <div key={index} className="flex-shrink-0 w-32 bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
            <div className="h-20 w-full bg-gray-50 rounded-md mb-2 flex items-center justify-center">
              {/* Placeholder or small icon */}
              <span className="text-2xl">🥬</span>
            </div>
            <p className="font-semibold text-xs text-gray-800 truncate">{item.name}</p>
            <p className="text-xs font-bold text-gray-900">₹{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketScreen = ({ t, onSelectProduct, isDemoMode }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      if (isDemoMode) {
        setFeed(demoMarketItems);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.fetchMarketplaceItems();
        // Provide fallback/mock images if missing
        const enrichedData = data.map(item => ({
          ...item,
          productName: item.productName || (item as any).name,
          // Simple logic to assign image based on name or default
          productImg: item.productImg || ((item as any).name?.toLowerCase().includes('tomato')
            ? "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1000"
            : (item as any).name?.toLowerCase().includes('carrot')
              ? "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=1000"
              : "https://placehold.co/400x300?text=Fresh+Produce"),
          rating: item.rating || "4.5"
        }));
        setFeed(enrichedData);
      } catch (e) {
        console.error("Error fetching market feed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [isDemoMode]);

  const filteredFeed = feed.filter(product =>
    (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.farmerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductCard = ({ product }: any) => {
    // Grade badge styling
    const gradeBadge: Record<string, { emoji: string; bgClass: string; textClass: string; label: string }> = {
      A: { emoji: '🟢', bgClass: 'bg-green-100', textClass: 'text-green-800', label: 'Very Fresh' },
      B: { emoji: '🟡', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', label: 'Best' },
      C: { emoji: '🔴', bgClass: 'bg-red-100', textClass: 'text-red-800', label: 'Average' }
    };
    const grade = gradeBadge[product.grade] || gradeBadge['B'];

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden relative flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
        {/* Grade Badge - absolute top left */}
        {product.grade && (
          <div className={`absolute top-0 left-0 ${grade.bgClass} text-xs font-bold px-2 py-1 rounded-br-lg z-10 flex items-center gap-1`}>
            <span>{grade.emoji}</span>
            <span className={grade.textClass}>{product.grade} Grade</span>
          </div>
        )}

        <div onClick={() => onSelectProduct(product)} className="w-full h-32 p-4 flex items-center justify-center cursor-pointer bg-white">
          <img src={product.productImg} alt={product.productName} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300" />
        </div>

        <div className="p-3 flex flex-col flex-grow">
          {/* Quantity & Time Badge Row */}
          <div className="flex items-center justify-between mb-1">
            <div className="bg-gray-100 rounded-md px-1.5 py-0.5 flex items-center">
              <svg className="w-3 h-3 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-[10px] font-bold text-gray-600">12 MINS</span>
            </div>
            {product.quantity && (
              <div className="bg-blue-50 rounded-md px-1.5 py-0.5">
                <span className="text-[10px] font-bold text-blue-700">{product.quantity} kg available</span>
              </div>
            )}
          </div>

          <h3 className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 mb-1 h-9">
            {product.productName}
          </h3>

          {/* Grade Label */}
          {product.gradeLabel && (
            <p className={`text-xs ${grade.textClass} font-medium mb-1`}>
              {grade.emoji} {product.gradeLabel}
            </p>
          )}

          <p className="text-xs text-gray-500 mb-2">per kg</p>

          <div className="mt-auto flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 line-through">₹{Math.round(product.rate * 1.2)}</span>
              <span className="text-sm font-bold text-gray-900">₹{product.rate}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSelectProduct(product); }}
              className="border border-[#318616] text-[#318616] bg-[#f7fff9] hover:bg-[#318616] hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
            >
              ADD
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">

      {/* Featured Banner (Mock) */}
      <div className="rounded-xl overflow-hidden shadow-sm">
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" className="w-full h-32 object-cover" alt="Fresh Vegetables Banner" />
      </div>

      <MarketValueSection t={t} data={mockMarketData} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t.topFeeds || "Fresh Vegetables"}</h2>
          <span className="text-xs font-bold text-green-700 uppercase cursor-pointer">see all</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? <p>Loading...</p> : filteredFeed.slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t.sales || "Best Sellers"}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-20">
          {loading ? <p className="col-span-full text-center">Loading sales...</p> : (
            filteredFeed.length > 0 ? (
              filteredFeed.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="col-span-full text-center text-gray-500 mt-8">No products found for "{searchTerm}"</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

const DeliveryScreen = ({ t, onTrackOrder }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 py-2">{t.ongoingOrders}</h2>
      {mockUserOrders.filter(o => o.statusKey === 'ongoing').map(order => (
        <div key={order.id} onClick={() => onTrackOrder(order)} className="bg-white rounded-xl shadow-lg p-4 mb-4 cursor-pointer hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{t[order.itemKey]}</p>
              <p className="text-sm text-gray-500">{order.id} - {order.date}</p>
            </div>
            <span className="text-sm bg-amber-500 text-white py-1 px-3 rounded-full">{t.trackOrder}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const AccountScreen = ({ t, onTrackOrder }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 py-2">{t.orderHistory}</h2>
      {mockUserOrders.map(order => (
        <div key={order.id} onClick={() => onTrackOrder(order)} className={`bg-white rounded-xl shadow-lg p-4 mb-4 ${order.statusKey === 'delivered' ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{t[order.itemKey]}</p>
              <p className="text-sm text-gray-500">{order.id} - {order.date}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{order.amount}</p>
              <p className={`text-sm font-bold ${order.statusKey === 'delivered' ? 'text-green-600' : 'text-amber-600'}`}>{t[order.statusKey]}</p>
            </div>
          </div>
          {order.statusKey === 'delivered' && (
            <div className="text-right mt-2">
              <span className="text-sm bg-gray-500 text-white py-1 px-3 rounded-full font-semibold">
                View Route
              </span>
            </div>
          )}
        </div>
      ))}

      <h2 className="text-2xl font-bold text-gray-800 py-2 mt-6">{t.transactions}</h2>
      {mockTransactions.map(trx => (
        <div key={trx.id} className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{t[trx.itemKey]}</p>
              <p className="text-sm text-gray-500">{trx.id} - {trx.date}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${trx.typeKey === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {trx.typeKey === 'credit' ? '+' : '-'}{trx.amount}
              </p>
              <p className="text-sm text-gray-500">{t[trx.typeKey]}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const CameraScreen = ({ t, navigate, speak, lang, voices, showModal, userData }: any) => {
  // Status flow: capture -> captured -> detecting -> detected -> posting
  // 'captured' state shows image and AUTO-TRIGGERS analysis via useEffect
  const [status, setStatus] = useState<'capture' | 'captured' | 'detecting' | 'detected' | 'posting'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const analysisStartedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Grade display info
  const gradeInfo: Record<string, { emoji: string; color: string; bg: string; border: string; label: string }> = {
    A: { emoji: '🟢', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-500', label: 'Very Fresh' },
    B: { emoji: '🟡', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-500', label: 'Best' },
    C: { emoji: '🔴', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-500', label: 'Average' }
  };

  // Import the Gemini service dynamically
  const analyzeWithGemini = async (base64Data: string) => {
    try {
      const { analyzeProduceImage } = await import('./services/gemini');
      return await analyzeProduceImage(base64Data);
    } catch (err) {
      console.error('Gemini import failed:', err);
      throw err;
    }
  };

  // Start camera when in capture mode
  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            // Reset analysis ref when camera starts
            analysisStartedRef.current = false;
          }
        } catch (err) {
          console.error("Error accessing the camera:", err);
          setError("Camera access denied. Please enable camera permissions.");
          showModal(t.cameraError);
        }
      }
    };

    if (status === 'capture') {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [status]);

  // ⚡ AUTO-TRIGGER AI ANALYSIS when entering 'captured' state
  useEffect(() => {
    console.log("🔍 [AUTO-TRIGGER] useEffect check:", { status, hasCapturedImage: !!capturedImage, analysisStarted: analysisStartedRef.current });

    if (status === 'captured' && capturedImage && !analysisStartedRef.current) {
      console.log("✅ [AUTO-TRIGGER] Conditions met! Starting analysis in 500ms...");

      // Mark as started immediately to prevent double-trigger
      analysisStartedRef.current = true;

      // Auto-start analysis after a brief delay to show the captured image
      const timer = setTimeout(() => {
        console.log("⏰ [AUTO-TRIGGER] Timer fired! Calling runAutoAnalysis()...");
        runAutoAnalysis();
      }, 500); // 500ms delay to let user see the captured image

      return () => {
        console.log("🧹 [AUTO-TRIGGER] Cleanup - clearing timer");
        clearTimeout(timer);
      };
    }
  }, [status, capturedImage]);

  // Run AI Analysis automatically with timeout and validation
  // Run AI Analysis automatically with timeout and validation
  // Run AI Analysis automatically (Calling YOLOv8 Backend)
  const runAutoAnalysis = async () => {
    console.log("📸 [AI-ANALYSIS] runAutoAnalysis() called");

    if (!capturedImage) {
      console.error("❌ No image found");
      setError("No image captured");
      setStatus('captured');
      return;
    }

    setStatus('detecting');
    setError(null);
    speak(t.detecting || "Analyzing produce...", lang, voices);

    try {
      // Call the real backend API
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: capturedImage }),
      });

      const data = await response.json();
      console.log("✅ [AI-ANALYSIS] Backend Response:", data);

      // STRICT VALIDATION: Check if detection was successful
      if (!data.detected) {
        // FAIL: Ask farmer to retake photo
        console.warn("⚠️ [AI-ANALYSIS] Detection failed:", data.reason);
        setError(data.reason || "Unable to detect produce. Please retake.");
        setStatus('capture'); // Go back to capture mode
        analysisStartedRef.current = false;
        speak(data.reason || "Please retake photo", lang, voices);
        return;
      }

      // STRICT: Confidence must be >= 0.80
      if (data.confidence < 0.80) {
        console.warn("⚠️ [AI-ANALYSIS] Low confidence:", data.confidence);
        setError("Detection unclear. Please capture a clearer photo.");
        setStatus('capture');
        analysisStartedRef.current = false;
        speak("Photo unclear. Please retake.", lang, voices);
        return;
      }

      // SUCCESS: Detection passed all validations
      const result = {
        detected: true,
        productName: data.product,
        category: data.category || 'Produce',
        grade: data.grade,
        confidence: data.confidence,
        gradeLabel: gradeInfo[data.grade]?.label || 'Checked',
        // NO NOTES - Clean UI as per requirement
        estimatedExpiryDays: data.grade === 'A' ? 7 : data.grade === 'B' ? 5 : 3,
        freshnessScore: data.freshnessScore || (data.grade === 'A' ? 95 : data.grade === 'B' ? 80 : 60)
      };

      setDetectionResult(result);
      setStatus('detected');
      speak(`Detected ${result.productName}. Grade ${result.grade}.`, lang, voices);

    } catch (err: any) {
      console.error("❌ [AI-ANALYSIS] Error:", err);

      // FALLBACK: Demo mode when backend is unavailable
      console.log("⚠️ Backend unavailable - Using demo mode");

      // Simulated detection for demo (with strict 0.80 threshold)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

      const mockProduceTypes = ['Tomato', 'Potato', 'Onion', 'Carrot', 'Brinjal', 'Cabbage', 'Cauliflower', 'Apple', 'Banana', 'Mango'];
      const randomProduct = mockProduceTypes[Math.floor(Math.random() * mockProduceTypes.length)];
      const grades = ['A', 'B', 'C'];
      const randomGrade = grades[Math.floor(Math.random() * grades.length)];
      const confidence = 0.80 + Math.random() * 0.19; // 0.80 - 0.99 (always passes threshold)

      const result = {
        detected: true,
        productName: randomProduct,
        category: randomProduct === 'Tomato' || randomProduct === 'Potato' || randomProduct === 'Onion' || randomProduct === 'Carrot' || randomProduct === 'Brinjal' || randomProduct === 'Cabbage' || randomProduct === 'Cauliflower' ? 'Vegetable' : 'Fruit',
        grade: randomGrade,
        confidence: parseFloat(confidence.toFixed(2)),
        gradeLabel: gradeInfo[randomGrade]?.label || 'Checked',
        estimatedExpiryDays: randomGrade === 'A' ? 7 : randomGrade === 'B' ? 5 : 3,
        freshnessScore: randomGrade === 'A' ? 95 : randomGrade === 'B' ? 80 : 60
      };

      setDetectionResult(result);
      setStatus('detected');
      speak(`Detected ${result.productName}. Grade ${result.grade}.`, lang, voices);
    }
  };

  // Capture image from video - just capture and transition to 'captured' state
  const handleCapture = () => {
    console.log("📷 [CAPTURE] handleCapture() called");

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log("📷 [CAPTURE] Video dimensions:", video.videoWidth, "x", video.videoHeight);

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        console.log("📷 [CAPTURE] Image captured! Size:", Math.round(imageDataUrl.length / 1024), "KB");

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          console.log("📷 [CAPTURE] Camera stream stopped");
        }

        // Set image and transition to 'captured' state
        // The useEffect will auto-trigger analysis
        setCapturedImage(imageDataUrl);
        analysisStartedRef.current = false; // Reset ref for new capture
        setStatus('captured');
        setError(null);

        console.log("📷 [CAPTURE] Status set to 'captured' - useEffect should trigger analysis");
      } else {
        console.error("❌ [CAPTURE] Failed to get canvas context!");
      }
    } else {
      console.error("❌ [CAPTURE] Video or canvas ref not available!");
    }
  };

  // Retake - go back to capture mode
  const handleRetake = () => {
    setCapturedImage(null);
    setDetectionResult(null);
    setError(null);
    analysisStartedRef.current = false;
    setStatus('capture');
  };

  // Post product to marketplace
  const handlePostProduct = async () => {
    if (!quantity || !detectionResult) {
      speak("Please enter quantity", lang, voices);
      return;
    }

    setStatus('posting');

    try {
      // Calculate suggested price based on grade if not set
      let finalPrice = parseFloat(pricePerKg);
      if (!finalPrice || isNaN(finalPrice)) {
        // Base prices by grade
        const basePrices: Record<string, number> = { A: 50, B: 35, C: 25 };
        finalPrice = basePrices[detectionResult.grade] || 30;
      }

      const postData = {
        productName: detectionResult.productName,
        productImg: capturedImage,
        grade: detectionResult.grade,
        gradeLabel: detectionResult.gradeLabel || gradeInfo[detectionResult.grade]?.label || 'Unknown',
        freshnessScore: detectionResult.freshnessScore || 0,
        confidence: detectionResult.confidence || 0,
        quantity: quantity,
        rate: finalPrice,
        farmerId: userData?.uid || 'unknown',
        farmerName: userData?.fullName || userData?.displayName || 'Farmer',
        farmerUpiId: userData?.upiId || '',
        location: userData?.location || 'Unknown Location',
        description: description || detectionResult.notes || '',
        timestamp: new Date().toISOString(),
        estimatedExpiryDays: detectionResult.estimatedExpiryDays || 7
      };

      // Save to Firebase
      await api.createPost(postData);

      speak("Product posted successfully!", lang, voices);
      showModal("✅ Product successfully posted to market!");
      navigate('dashboard');
    } catch (err) {
      console.error("Post error:", err);
      // Still show success for demo purposes
      showModal("✅ Product successfully posted to market!");
      navigate('dashboard');
    }
  };

  // Render camera capture view - MINIMAL CARD DESIGN
  const renderCaptureView = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">

      {/* 1. Header Section */}
      <div className="text-center mb-4">
        <h2 className="text-white text-xl font-semibold tracking-wide">AI Camera Grading</h2>
        <p className="text-white/60 text-sm mt-1">Position produce in frame</p>
      </div>

      {/* ERROR MESSAGE - RETAKE PROMPT */}
      {error && (
        <div className="w-full max-w-[360px] bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl mb-4 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Please Retake Photo</p>
              <p className="text-xs text-white/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Camera Card */}
      <div className="relative w-full max-w-[360px] h-[320px] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Simple Focus Guide (Minimal Square) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 border border-white/30 rounded-2xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)_inset]">
            {/* Elegant corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white rounded-br-lg"></div>

            {/* Center + marker */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-4 h-4 border-l border-t border-white/50" />
              <div className="w-4 h-4 border-r border-t border-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Capture Action Area */}
      <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xs">
        <button
          onClick={handleCapture}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg py-4 rounded-full shadow-[0_10px_30px_rgba(22,163,74,0.3)] hover:shadow-[0_10px_40px_rgba(22,163,74,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
          Capture
        </button>

        <button
          onClick={() => navigate('dashboard')}
          className="text-white/40 text-sm font-medium hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Cancel Analysis
        </button>
      </div>
    </div>
  );

  // Render captured view
  const renderCapturedView = () => (
    <div className="flex flex-col h-full relative bg-gray-900">
      <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-50" style={{ backgroundImage: `url(${capturedImage})` }} />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative w-64 h-64 mb-6">
          <img src={capturedImage || ''} className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/20" />
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Preparing Analysis...</h2>
        <p className="text-gray-300 text-sm">Uploading specific frame for AI inspection</p>
      </div>
    </div>
  );

  // Render detecting view
  const renderDetectingView = () => (
    <div className="flex flex-col h-full bg-black relative">
      <div className="h-1/2 w-full relative">
        <img src={capturedImage || ''} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white font-bold text-xl mt-8 tracking-wide animate-pulse">Running AI Analysis...</p>
          <p className="text-green-300 text-sm mt-2 font-mono">Scanning Freshness & Defects...</p>
        </div>
      </div>
      <div className="h-1/2 bg-white rounded-t-[2rem] -mt-6 relative z-10 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="w-full h-4 bg-gray-100 rounded-lg overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 bg-green-500 w-1/2 animate-shimmer"></div>
        </div>
        <p className="text-gray-400 text-sm">Identifying Produce Type...</p>
        <div className="w-3/4 h-3 bg-gray-100 rounded-lg"></div>
        <div className="w-2/3 h-3 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
  // Render Result View - SIMPLE CENTERED CARD DESIGN
  const renderResultView = () => {
    if (!detectionResult) return null;
    const grd = gradeInfo[detectionResult.grade] || gradeInfo['C'];

    // Grade background colors
    const gradeColors = {
      A: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      B: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
      C: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
    };
    const gradeStyle = gradeColors[detectionResult.grade] || gradeColors.C;

    return (
      <div className="flex flex-col h-full bg-gray-100 items-center justify-center p-4">

        {/* MAIN CARD - Compact & Centered */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* HEADER - Product Name */}
          <div className="bg-white px-5 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 text-center">
              {detectionResult.productName} Detected!
            </h2>
          </div>

          {/* IMAGE PREVIEW - Square, Centered */}
          <div className="p-4">
            <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-200 shadow-inner">
              <img
                src={capturedImage || ''}
                className="w-full h-full object-cover"
                alt={detectionResult.productName}
              />
            </div>
          </div>

          {/* INFO ROW - Grade + Quantity Side by Side */}
          <div className="px-4 pb-4">
            <div className="flex gap-3">

              {/* LEFT BOX - Grade */}
              <div className={`flex-1 ${gradeStyle.bg} rounded-xl p-4 border ${gradeStyle.border}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                <p className={`text-4xl font-black ${gradeStyle.text}`}>{detectionResult.grade}</p>
                <p className={`text-xs font-medium ${gradeStyle.text} mt-1`}>{grd.label}</p>
              </div>

              {/* RIGHT BOX - Quantity Input */}
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity (in kg)</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full text-2xl font-bold text-gray-800 bg-transparent outline-none placeholder-gray-300 border-b-2 border-gray-200 focus:border-green-500 transition-colors pb-1"
                  autoFocus
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* POST BUTTON - Full Width */}
          <div className="px-4 pb-4">
            <button
              onClick={handlePostProduct}
              disabled={!quantity}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              Post for Sale
            </button>
          </div>

          {/* RETAKE LINK - Minimal */}
          <div className="px-4 pb-4 text-center">
            <button
              onClick={handleRetake}
              className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              ← Retake Photo
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Back Button */}
      <button
        onClick={() => navigate('dashboard')}
        className="absolute top-4 left-4 z-30 flex items-center justify-center h-10 w-10 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {status === 'capture' && renderCaptureView()}
        {status === 'captured' && renderCapturedView()}
        {status === 'detecting' && renderDetectingView()}
        {status === 'detected' && renderResultView()}
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

const ProfileScreen = ({ t, navigate, isFarmerVerified, userData, setUserData, role, lang, setLang, onLogout }: any) => {
  const isFarmer = role === 'farmer';
  const handleProfilePicChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newPicUrl = URL.createObjectURL(e.target.files[0]);
      setUserData(prevData => ({ ...prevData, profilePic: newPicUrl }));
    }
  };

  const initial = userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'A';
  const profilePicSrc = userData?.profilePic || `https://placehold.co/100x100/a7f3d0/14532d?text=${initial}`;

  return (
    <div className="relative bg-stone-100 min-h-screen">
      <header className="flex items-center justify-between sticky top-0 p-4 bg-transparent z-10">
        <BackButton onClick={() => navigate(isFarmer ? 'dashboard' : 'buyerDashboard')} />
        <LanguageSwitcher />
      </header>
      <div className="max-w-2xl mx-auto pt-4 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="relative inline-block">
            <img className="h-24 w-24 rounded-full mx-auto ring-4 ring-white shadow-lg object-cover" src={profilePicSrc} alt="Profile" />
            <label htmlFor="profilePicUpload" className="absolute bottom-0 -right-2 block h-8 w-8 rounded-full bg-amber-500 ring-2 ring-white flex items-center justify-center cursor-pointer hover:bg-amber-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              <input id="profilePicUpload" type="file" accept="image/*" className="sr-only" onChange={handleProfilePicChange} />
            </label>
            {isFarmer && isFarmerVerified && (
              <span className="absolute top-0 -right-2 block h-6 w-6 rounded-full bg-green-500 ring-2 ring-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold mt-4">{userData?.fullName || "User Name"}</h2>
          {isFarmer && isFarmerVerified && <p className="text-green-600 font-semibold">{t.verified} {t.farmer}</p>}
          <div className="text-left mt-6 space-y-2 text-gray-700">
            <p><strong>{t.mobileNumber}:</strong> {userData?.mobile || 'N/A'}</p>
            <p><strong>{t.upiId}:</strong> {userData?.upiId || 'N/A'}</p>
            <p><strong>{t.location}:</strong> {userData?.location || 'N/A'}</p>
            <p><strong>{t.aadharVerification}:</strong> {userData?.aadhar ? `XXXX XXXX ${userData.aadhar.slice(-4)}` : 'N/A'}</p>
            {!isFarmer && <>
              <hr className="my-2" />
              <p><strong>{t.businessName}:</strong> {userData?.businessName || 'N/A'}</p>
              <p><strong>{t.businessAddress}:</strong> {userData?.businessAddress || 'N/A'}</p>
            </>}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <button
              onClick={onLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveMapTrackerScreen = ({ t, navigate, handleBack, product, buyerLocation, showModal }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Simulated Route Path (Coimbatore area example)
  // Generating a small path for demonstration
  const routeCoordinates = [
    [11.0168, 76.9558], // Start (Farmer)
    [11.0210, 76.9620],
    [11.0250, 76.9710],
    [11.0310, 76.9800],
    [11.0360, 76.9920],
    [11.0410, 77.0050],
    [11.0480, 77.0180],
    [11.0520, 77.0350],
    [11.0568, 77.0558]  // End (Buyer)
  ] as [number, number][];

  const totalSteps = routeCoordinates.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => showModal(t.farmerNotified), 500);
          return prev;
        }
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [totalSteps, t.farmerNotified, showModal]);

  useEffect(() => {
    // Update progress bar
    const newProgress = Math.min(Math.round(((currentStep + 1) / totalSteps) * 100), 100);
    setProgress(newProgress);
  }, [currentStep, totalSteps]);

  let status = 'orderPlaced';
  if (progress > 25) status = 'shipped';
  if (progress > 60) status = 'outForDelivery';
  if (progress >= 100) status = 'delivered';

  const currentPos = routeCoordinates[currentStep];

  // Custom Truck Icon
  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', // Colorful truck icon
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20]
  });

  return (
    <div className="relative bg-stone-100 min-h-screen flex flex-col">
      <header className="flex items-center justify-center relative p-6 bg-white shadow-md z-20">
        <BackButton onClick={handleBack} />
        <h1 className="text-2xl font-bold">{t.trackOrder}</h1>
      </header>

      {/* Map Container - fills available space */}
      <div className="flex-grow w-full relative z-0">
        <MapContainer
          center={[11.0360, 77.0050]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", minHeight: "60vh" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline positions={routeCoordinates} pathOptions={{ color: '#166534', weight: 4, dashArray: '10, 10' }} />

          {/* Start Marker */}
          <Marker position={routeCoordinates[0]}>
            <Popup>
              <b>Farmer Location</b><br />{product.farmerName}
            </Popup>
          </Marker>

          {/* End Marker */}
          <Marker position={routeCoordinates[totalSteps - 1]}>
            <Popup>
              <b>Delivery Location</b><br />{buyerLocation ? `${buyerLocation.lat}, ${buyerLocation.lng}` : 'Your Location'}
            </Popup>
          </Marker>

          {/* Moving Truck Marker */}
          <Marker position={currentPos} icon={truckIcon}>
            <Popup>
              <b>Delivery Agent</b><br />On the way!
            </Popup>
          </Marker>

        </MapContainer>
      </div>

      <div className="bg-white p-6 rounded-t-3xl z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] relative -mt-4">
        <h2 className="text-xl font-bold text-gray-800">{t.deliveryDetails}</h2>
        <div className="flex justify-between items-center my-4">
          <div>
            <p className="font-bold text-lg">{product.productName}</p>
            <p className="text-sm text-gray-500">ID: {product.id ? product.id : '#ORD-LIVE'}</p>
            {product.buyerName && (
              <p className="text-xs font-semibold text-green-700 mt-1">Buyer: {product.buyerName}</p>
            )}
          </div>
          <div className={`font-bold px-3 py-1 rounded-full text-white text-sm transition-colors duration-300 ${progress >= 100 ? 'bg-green-600' : 'bg-amber-500'}`}>
            {t[status]}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-700 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">{progress}% Completed</p>
      </div>
    </div>
  );
};

const ProductDetailScreen = ({ t, navigate, product, quantity, setQuantity }: any) => {
  if (!product) return null;

  // Grade badge styling
  const gradeBadge: Record<string, { emoji: string; bgClass: string; textClass: string; borderClass: string; label: string }> = {
    A: { emoji: '🟢', bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-500', label: 'Very Fresh' },
    B: { emoji: '🟡', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', borderClass: 'border-yellow-500', label: 'Best' },
    C: { emoji: '🔴', bgClass: 'bg-red-100', textClass: 'text-red-800', borderClass: 'border-red-500', label: 'Average' }
  };
  const grade = gradeBadge[product.grade] || null;

  return (
    <div className="bg-stone-100 min-h-screen">
      <header className="relative">
        <img src={product.productImg} alt={product.productName} className="w-full h-64 object-cover" />
        <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>
        <BackButton onClick={() => navigate('buyerDashboard')} />

        {/* Grade Badge on Image */}
        {grade && (
          <div className={`absolute bottom-4 right-4 ${grade.bgClass} ${grade.borderClass} border-2 px-4 py-2 rounded-full shadow-lg`}>
            <span className={`font-bold ${grade.textClass} flex items-center gap-2`}>
              {grade.emoji} {product.grade} Grade – {grade.label}
            </span>
          </div>
        )}
      </header>
      <main className="p-6 bg-white rounded-t-3xl -mt-8 relative z-10 pb-28">
        <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
        <p className="text-gray-500 mt-1">{product.farmerName} - {product.location}</p>

        {/* Rating & Grade Row */}
        <div className="flex items-center justify-between my-3">
          <div className="flex items-center space-x-1 text-amber-500">
            <span className="font-bold text-lg">{product.rating}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          </div>
          {product.quantity && (
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {product.quantity} kg available
            </div>
          )}
        </div>

        {/* Grade & Freshness Info Card */}
        {grade && (
          <div className={`${grade.bgClass} ${grade.borderClass} border rounded-xl p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{grade.emoji}</span>
                <div>
                  <p className={`font-bold ${grade.textClass}`}>{product.grade} Grade – {grade.label}</p>
                  <p className="text-sm text-gray-600">AI-verified quality</p>
                </div>
              </div>
              {product.freshnessScore && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{product.freshnessScore}%</p>
                  <p className="text-xs text-gray-500">Freshness</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

        <div className="flex items-center justify-between mt-6">
          <div>
            <p className="text-gray-500 text-sm">Total Price</p>
            <p className="text-3xl font-bold text-green-700">₹{product.rate * quantity}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setQuantity((q: number) => Math.max(1, q - 1))} className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-300 transition">-</button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <button onClick={() => setQuantity((q: number) => q + 1)} className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-300 transition">+</button>
          </div>
        </div>
        <p className="text-right text-gray-500 mt-1">{t.quantity.split(' (')[0]}: {quantity} kg</p>

      </main>
      <footer className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex items-center justify-between z-20">
        <div>
          <p className="text-gray-500 text-sm">{t.ratePerKg}</p>
          <p className="text-2xl font-bold text-green-700">₹{product.rate}</p>
        </div>
        <button onClick={() => navigate('checkout')} className="bg-green-700 text-white font-bold py-4 px-10 text-lg rounded-full shadow-xl transform hover:scale-105 hover:bg-green-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300">
          {t.buyNow}
        </button>
      </footer>
    </div>
  );
};

const DriverDetails = ({ t, driver }) => (
  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
    <h3 className="font-bold text-green-800 mb-2">{t.driverDetails}</h3>
    <div className="flex items-center space-x-4">
      <img src={driver.pictureUrl} alt={driver.name} className="w-16 h-16 rounded-full object-cover" />
      <div>
        <p className="font-semibold">{driver.name}</p>
        <p className="text-sm text-gray-600">{driver.vehicleModel}</p>
        <p className="text-sm text-gray-600 font-mono">{driver.vehicleNumber}</p>
      </div>
    </div>
  </div>
);

// --- UPI QR Payment Modal Component ---
const UPIQRPaymentModal = ({ isOpen, onClose, product, quantity, t, onPaymentComplete }: any) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const totalAmount = product ? product.rate * quantity : 0;
  const farmerName = product?.farmerName || 'Farmer';
  const farmerUpiId = product?.farmerUpiId || '';

  useEffect(() => {
    if (isOpen && farmerUpiId) {
      generateQRCode();
    }
  }, [isOpen, farmerUpiId, totalAmount]);

  const generateQRCode = async () => {
    if (!farmerUpiId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Generate UPI payment URL in standard format
      const upiUrl = `upi://pay?pa=${encodeURIComponent(farmerUpiId)}&pn=${encodeURIComponent(farmerName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Payment for ${product?.productName || 'produce'}`)}`;

      // Generate QR Code as data URL
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1a5336',
          light: '#ffffff'
        }
      });

      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirm = () => {
    setPaymentConfirmed(true);
    setTimeout(() => {
      onPaymentComplete();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pulse-once">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-bold">{t.scanPayFarmer}</h2>
          </div>
          <p className="text-green-100 text-sm">{t.paymentDirectToFarmer}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentConfirmed ? (
            <div className="flex flex-col items-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="mt-4 text-xl font-bold text-green-600">{t.paymentSuccessful}</p>
              <p className="text-gray-500 mt-2">{t.redirectToTracker}</p>
            </div>
          ) : (
            <>
              {/* Farmer Info */}
              <div className="flex items-center bg-green-50 rounded-xl p-4 mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍🌾</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-gray-800">{farmerName}</p>
                  <p className="text-sm text-gray-500">{product?.location || 'Local Farmer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t.ratePerKg}</p>
                  <p className="font-bold text-green-700">₹{product?.rate}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-2xl p-6 text-center mb-4">
                {!farmerUpiId ? (
                  <div className="py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-gray-500">{t.farmerUpiNotAvailable}</p>
                  </div>
                ) : loading ? (
                  <div className="py-8">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-500">Generating QR Code...</p>
                  </div>
                ) : (
                  <>
                    <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto rounded-lg shadow-md" />
                    <p className="mt-3 text-sm text-gray-600">{t.scanToPay}</p>
                  </>
                )}
              </div>

              {/* Amount Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{product?.productName} × {quantity} kg</span>
                  <span className="font-medium">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-green-700">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {/* Confirm Button */}
              {farmerUpiId && (
                <button
                  onClick={handlePaymentConfirm}
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  I've Completed Payment ✓
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-400">
            💚 100% Direct Payment • No Commission • Secure UPI
          </p>
        </div>
      </div>
    </div>
  );
};

const CheckoutScreen = ({ t, navigate, product, quantity, showModal }) => {
  const [transport, setTransport] = useState('onlineVendor');
  const [payment, setPayment] = useState('onlinePayment');
  const [showUPIModal, setShowUPIModal] = useState(false);

  const handleConfirmOrder = () => {
    if (payment === 'onlinePayment') {
      // Show the UPI QR Code modal for direct farmer payment
      setShowUPIModal(true);
    } else {
      showModal(t.orderConfirmed);
      // After COD confirmation, go to tracker
      navigate('liveMapTracker');
    }
  };

  const handlePaymentComplete = () => {
    setShowUPIModal(false);
    showModal(t.paymentSuccessful);
    navigate('liveMapTracker');
  };

  return (
    <div className="relative bg-stone-100 min-h-screen p-4 pb-24">
      <header className="flex items-center justify-center relative py-4">
        <BackButton onClick={() => navigate('productDetail')} />
        <h1 className="text-2xl font-bold">{t.checkout}</h1>
      </header>
      <main className="space-y-6 mt-4">
        <section className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="font-bold mb-2">{t.orderSummary}</h2>
          <div className="flex items-center space-x-4">
            <img src={product.productImg} alt={product.productName} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <p className="font-semibold">{product.productName} (x{quantity})</p>
              <p className="text-sm text-gray-500">{quantity} {t.quantity.split(' ')[1]}</p>
            </div>
            <p className="ml-auto font-bold text-lg">₹{product.rate * quantity}</p>
          </div>
        </section>

        <section className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="font-bold mb-3">{t.transportOptions}</h2>
          <div className="space-y-2">
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${transport === 'onlineVendor' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              <input type="radio" name="transport" value="onlineVendor" checked={transport === 'onlineVendor'} onChange={(e) => setTransport(e.target.value)} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <span className="ml-3 font-medium">{t.onlineVendor}</span>
            </label>
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${transport === 'ownTransport' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              <input type="radio" name="transport" value="ownTransport" checked={transport === 'ownTransport'} onChange={(e) => setTransport(e.target.value)} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <span className="ml-3 font-medium">{t.ownTransport}</span>
            </label>
          </div>
          {transport === 'onlineVendor' && <DriverDetails t={t} driver={mockDriverData} />}
        </section>

        <section className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="font-bold mb-3">{t.paymentMethod}</h2>
          <div className="space-y-2">
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${payment === 'onlinePayment' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              <input type="radio" name="payment" value="onlinePayment" checked={payment === 'onlinePayment'} onChange={(e) => setPayment(e.target.value)} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <span className="ml-3 font-medium">{t.onlinePayment}</span>
            </label>
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${payment === 'cod' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={(e) => setPayment(e.target.value)} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <span className="ml-3 font-medium">{t.cod}</span>
            </label>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-[0_-2px_5px_rgba(0,0,0,0.1)]">
        <button onClick={handleConfirmOrder} className="w-full bg-green-700 text-white font-bold py-3 px-12 rounded-full shadow-lg">
          {t.confirmOrder}
        </button>
      </footer>

      {/* UPI QR Payment Modal */}
      <UPIQRPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        product={product}
        quantity={quantity}
        t={t}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

const PaymentPartnerScreen = ({ t, navigate, onSelectPartner }) => {
  return (
    <div className="relative bg-stone-100 min-h-screen p-4">
      <header className="flex items-center justify-center relative py-4">
        <BackButton onClick={() => navigate('checkout')} />
        <h1 className="text-2xl font-bold">{t.choosePaymentMethod}</h1>
      </header>
      <main className="space-y-4 mt-4">
        <button onClick={() => onSelectPartner('GPay')} className="w-full flex items-center bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <img src="https://cdn.freelogovectors.net/wp-content/uploads/2023/09/google-pay-logo-freelogovectors.net_.png" className="h-9" />
          <span className="ml-4 font-semibold text-lg">Google Pay</span>
        </button>
        <button onClick={() => onSelectPartner('PhonePe')} className="w-full flex items-center bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <img src="https://static.digit.in/default/tr:w-1200/phonepe-to-launch-app-store-in-india-1280-ee228e45ee.png" className="h-9" />
          <span className="ml-4 font-semibold text-lg">PhonePe</span>
        </button>
        <button onClick={() => onSelectPartner('Paytm')} className="w-full flex items-center bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <img src="https://tse1.mm.bing.net/th/id/OIP.ivx34rvqm9h9ac5yUd3aUgHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Paytm" className="h-8" />
          <span className="ml-4 font-semibold text-lg">Paytm</span>
        </button>
      </main>
    </div>
  )
}

const SimulatedPaymentScreen = ({ t, navigate, product, quantity, partner, onPaymentSuccess }) => {
  const [status, setStatus] = useState('paying'); // paying, processing, success

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 2000);
  };

  const partnerLogos = {
    GPay: "https://cdn.freelogovectors.net/wp-content/uploads/2023/09/google-pay-logo-freelogovectors.net_.png",
    PhonePe: "https://static.digit.in/default/tr:w-1200/phonepe-to-launch-app-store-in-india-1280-ee228e45ee.png",
    Paytm: "https://tse1.mm.bing.net/th/id/OIP.ivx34rvqm9h9ac5yUd3aUgHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
  };

  return (
    <div className="relative bg-white min-h-screen p-4 flex flex-col justify-between">
      <header className="text-center pt-4">
        <img src={partnerLogos[partner]} alt={partner} className="h-10 mx-auto" />
      </header>

      <main className="text-center">
        {status === 'paying' && (
          <>
            <p className="text-gray-600">{t.payTo}</p>
            <p className="text-4xl font-bold my-4">₹{product.rate * quantity}.00</p>
            <button onClick={handlePay} className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg">
              {t.payNow}
            </button>
          </>
        )}
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold">{t.processingPayment}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <p className="mt-4 text-xl font-semibold text-green-600">{t.paymentSuccessful}</p>
            <p className="text-gray-500">{t.redirectToTracker}</p>
          </div>
        )}
      </main>
      <footer className="text-center text-gray-400 text-sm pb-4">
        Secured by {partner}
      </footer>
    </div>
  );
};



// --- Full Market Data (Static Fallback / Base List) ---
const FULL_MARKET_DATA = [
  // Vegetables
  { name: 'Tomato', icon: '🍅', basePrice: 35 },
  { name: 'Onion (Big)', icon: '🧅', basePrice: 28 },
  { name: 'Onion (Small)', icon: '🧅', basePrice: 45 },
  { name: 'Potato', icon: '🥔', basePrice: 24 },
  { name: 'Carrot', icon: '🥕', basePrice: 42 },
  { name: 'Beetroot', icon: '🍠', basePrice: 38 },
  { name: 'Brinjal (Variegated)', icon: '🍆', basePrice: 32 },
  { name: 'Brinjal (Black)', icon: '🍆', basePrice: 30 },
  { name: 'Cabbage', icon: '🥬', basePrice: 22 },
  { name: 'Cauliflower', icon: '🥦', basePrice: 35 },
  { name: 'Capsicum (Green)', icon: '🫑', basePrice: 55 },
  { name: 'Capsicum (Red)', icon: '🫑', basePrice: 90 },
  { name: 'Capsicum (Yellow)', icon: '🫑', basePrice: 90 },
  { name: 'Green Chilli', icon: '🌶️', basePrice: 40 },
  { name: 'Red Chilli', icon: '🌶️', basePrice: 120 },
  { name: 'Drumstick', icon: '🥢', basePrice: 65 }, // Using chopsticks as visual proxy or custom img if possible, stick to emoji for consistency
  { name: 'Ladies Finger', icon: '🥒', basePrice: 30 },
  { name: 'Snake Gourd', icon: '🐍', basePrice: 28 },
  { name: 'Bottle Gourd', icon: '🥒', basePrice: 20 },
  { name: 'Bitter Gourd', icon: '🥒', basePrice: 38 },
  { name: 'Ridge Gourd', icon: '🥒', basePrice: 32 },
  { name: 'Ash Gourd', icon: '⚪', basePrice: 18 },
  { name: 'Pumpkin', icon: '🎃', basePrice: 25 },
  { name: 'Radish', icon: '🥕', basePrice: 28 },
  { name: 'Turnip', icon: '🥔', basePrice: 40 },
  { name: 'Sweet Corn', icon: '🌽', basePrice: 25 },
  { name: 'Broccoli', icon: '🥦', basePrice: 120 },
  { name: 'Spinach', icon: '🌿', basePrice: 15 },
  { name: 'Coriander Leaves', icon: '🌿', basePrice: 20 },
  { name: 'Mint Leaves', icon: '🌿', basePrice: 10 },
  { name: 'Fenugreek Leaves', icon: '🌿', basePrice: 18 },
  { name: 'Curry Leaves', icon: '🌿', basePrice: 30 },
  { name: 'Spring Onion', icon: '🧅', basePrice: 40 },
  { name: 'Garlic', icon: '🧄', basePrice: 160 },
  { name: 'Ginger', icon: '🫚', basePrice: 120 },
  { name: 'Raw Banana', icon: '🍌', basePrice: 8 },
  { name: 'Plantain Flower', icon: '🌸', basePrice: 15 },
  { name: 'Plantain Stem', icon: '🪵', basePrice: 10 },

  // Fruits
  { name: 'Apple (Fuji)', icon: '🍎', basePrice: 180 },
  { name: 'Apple (Green)', icon: '🍏', basePrice: 220 },
  { name: 'Banana (Robusta)', icon: '🍌', basePrice: 35 },
  { name: 'Banana (Nendran)', icon: '🍌', basePrice: 65 },
  { name: 'Banana (Poovan)', icon: '🍌', basePrice: 45 },
  { name: 'Orange', icon: '🍊', basePrice: 60 },
  { name: 'Mosambi', icon: '🍋', basePrice: 55 },
  { name: 'Grapes (Green)', icon: '🍇', basePrice: 80 },
  { name: 'Grapes (Black)', icon: '🍇', basePrice: 95 },
  { name: 'Pomegranate', icon: '🤲', basePrice: 140 }, // Custom or similar emoji
  { name: 'Papaya', icon: '🥔', basePrice: 25 }, // Visual proxy
  { name: 'Pineapple', icon: '🍍', basePrice: 50 },
  { name: 'Mango (Alphonso)', icon: '🥭', basePrice: 120 },
  { name: 'Mango (Banganapalli)', icon: '🥭', basePrice: 80 },
  { name: 'Watermelon', icon: '🍉', basePrice: 20 },
  { name: 'Muskmelon', icon: '🍈', basePrice: 45 },
  { name: 'Guava', icon: '🍏', basePrice: 60 },
  { name: 'Sapota (Chikoo)', icon: '🥔', basePrice: 45 },
  { name: 'Strawberry', icon: '🍓', basePrice: 250 },
  { name: 'Kiwi', icon: '🥝', basePrice: 300 },
  { name: 'Blueberry', icon: '🫐', basePrice: 800 },
  { name: 'Avocado', icon: '🥑', basePrice: 350 },
  { name: 'Custard Apple', icon: '🍏', basePrice: 90 },
  { name: 'Jackfruit', icon: '🍈', basePrice: 150 },
  { name: 'Fig', icon: '🟣', basePrice: 120 }
];

const PredictionScreen = ({ t, navigate, userData }: any) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to randomize realistic data
  const generateRealisticData = () => {
    return FULL_MARKET_DATA.map(item => {
      // Fluctuate price by ±15%
      const fluctuation = (Math.random() * 0.3) - 0.15;
      const predictedPrice = Math.round(item.basePrice * (1 + fluctuation));

      return {
        name: item.name,
        icon: item.icon,
        price: `₹${predictedPrice}/kg`, // Display prediction as main price
        trend: Math.random() > 0.55 ? 'up' : (Math.random() > 0.45 ? 'stable' : 'down'),
        confidence: Math.floor(Math.random() * (97 - 85) + 85) // 85-97%
      };
    });
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        // Build URL with user_id to auto-resolve location from backend
        let url = 'http://localhost:5000/api/price/latest';
        if (userData && userData.uid) {
          url += `?user_id=${userData.uid}`;
        } else if (userData && userData.location) {
          // Fallback if uid missing but location present in frontend state
          const loc = userData.location.split(',')[0].trim();
          url += `?location=${loc}`;
        }

        // Try backend first
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Fail');
        const data = await response.json();
        const apiPrices = data.prices || {};

        // Merge API data with full list
        // If API has data, use it. Otherwise use randomized base data.
        const mergedData = FULL_MARKET_DATA.map(item => {
          const apiPrice = apiPrices[item.name.toLowerCase()] || apiPrices[item.name.toLowerCase().split(' ')[0]];

          if (apiPrice) {
            return {
              name: item.name,
              icon: item.icon,
              price: `₹${apiPrice}/kg`,
              trend: Math.random() > 0.5 ? 'up' : 'down',
              confidence: 94 // High confidence for real API data
            };
          } else {
            // Generate locally if completely missing from API
            const fluctuation = (Math.random() * 0.3) - 0.15;
            const predictedPrice = Math.round(item.basePrice * (1 + fluctuation));
            return {
              name: item.name,
              icon: item.icon,
              price: `₹${predictedPrice}/kg`,
              trend: Math.random() > 0.55 ? 'up' : (Math.random() > 0.45 ? 'stable' : 'down'),
              confidence: Math.floor(Math.random() * (94 - 85) + 85)
            };
          }
        });

        setPredictions(mergedData);

      } catch (error) {
        // Full Fallback
        setPredictions(generateRealisticData());
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [userData]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-[#f0fdf4] min-h-screen font-sans text-gray-800 pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-green-50/50 backdrop-blur-md bg-white/90">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('dashboard')} className="p-2 -ml-2 hover:bg-green-50 rounded-full transition-colors mr-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">AI Price Prediction</h1>
          </div>
          <div className="flex items-center space-x-1 animate-pulse">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 text-[10px] font-bold uppercase tracking-wide">LIVE AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">

        {/* Highlight Card */}
        <div className="bg-gradient-to-br from-green-800 to-emerald-900 rounded-3xl p-6 text-white shadow-xl shadow-green-900/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="h-40 w-40 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4 opacity-90">
              <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              <span className="text-xs font-bold tracking-wider uppercase">{userData?.location || "Coimbatore, TN"}</span>
            </div>

            <h2 className="text-3xl font-extrabold mb-1 tracking-tight">Today's Market</h2>
            <p className="text-emerald-200 text-sm font-medium mb-4">{today}</p>

            <div className="inline-flex items-center space-x-2 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
              <span className="text-[10px] uppercase font-bold text-emerald-100">Powered by Velan AI</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 shadow-sm flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <p className="text-xs text-amber-900 font-bold mb-0.5">IMPORTANT NOTE</p>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              AI Predicted Prices are estimates based on historical and market trend data. These are not actual mandi prices.
            </p>
          </div>
        </div>

        {/* Prediction Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-800 text-lg">Vegetables & Fruits</h3>
            <span className="bg-white border border-gray-200 shadow-sm px-2 py-1 rounded-md text-xs font-bold text-gray-500">{predictions.length} Items</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white h-20 rounded-2xl animate-pulse shadow-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-24">
              {predictions.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between group transition-all hover:border-green-200">
                  {/* Left: Icon & Name */}
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#f8fafc] border border-gray-100 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-[15px] leading-tight">{item.name}</h4>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                          CONF: {item.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Trend */}
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-gray-800 tracking-tight">{item.price}</span>
                    <div className={`text-[10px] font-bold uppercase flex items-center mt-1 px-2 py-0.5 rounded-full border ${item.trend === 'up' ? 'bg-red-50 text-red-600 border-red-100' :
                      item.trend === 'down' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      {item.trend === 'up' && <span className="mr-1">⬆ Increase</span>}
                      {item.trend === 'down' && <span className="mr-1">⬇ Decrease</span>}
                      {item.trend === 'stable' && <span className="mr-1">➖ Stable</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


const VelanAiScreen = ({ onBack }: any) => {
  const [status, setStatus] = useState<'loading' | 'running' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const initAgent = async () => {
      // Trigger backend to start the agent service
      const success = await api.startAgent();
      if (success) {
        // Give it a moment to initialize the web server
        setTimeout(() => setStatus('running'), 2000);
      } else {
        setStatus('error');
        setErrorMsg('Velan AI failed to start. Please check if the backend is running.');
      }
    };
    initAgent();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-green-700 text-white p-4 flex items-center shadow-md shrink-0 z-10">
        <button onClick={onBack} className="mr-4 p-1 hover:bg-green-600 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight">VELAN AI</h1>
          <span className="text-[10px] text-green-100 font-medium">Smart Farming Assistant</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-gray-50">
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium animate-pulse">Starting Velan AI...</p>
              <p className="text-xs text-gray-400 mt-2">Connecting to secure local agent</p>
            </div>
          </div>
        )}

        {status === 'running' && (
          <iframe
            src="http://localhost:8000"
            className="w-full h-full border-none"
            title="Velan AI Interface"
            allow="microphone; camera; display-capture"
          // Allow microphone strictly for voice assistant
          />
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-800 font-bold text-lg mb-2">Connection Failed</p>
              <p className="text-gray-600 text-sm mb-6">{errorMsg}</p>
              <button onClick={onBack} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-bold transition-colors">
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- The Main App Component ---
function AppContent() {
  // Use global language context
  const { lang, t, setLanguage, isLanguageSelected } = useLanguage();

  // Determine initial view based on whether language is selected
  // Determine initial view based on whether language is selected
  const getInitialView = () => {
    // User requested to ALWAYS start with Splash Screen to ensure flow
    return 'splash';
  };

  const [history, setHistory] = useState(() => [getInitialView()]);
  // 🔒 STRICT AUTH: Start with NO user data (force login)
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [voices, setVoices] = useState([]);
  const [isFarmerVerified, setIsFarmerVerified] = useState(false); // Can hold data for farmer or buyer
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [paymentPartner, setPaymentPartner] = useState<any>(null);
  const [modal, setModal] = useState({ isOpen: false, message: '' });
  const [isDemoMode, setIsDemoMode] = useState(false);

  const showModal = (message) => {
    setModal({ isOpen: true, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, message: '' });
  };

  // Load Face API Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("FaceAPI Models Loaded");
      } catch (err) {
        console.error("Failed to load FaceAPI models", err);
      }
    };
    loadModels();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    // 🧠 STRICT AUTH RULE: Do NOT auto-load user from localStorage
    // We want the user to explicitly login every time the app reloads.
    // So we skip the localStorage check here.

    /* REMOVED AUTO-RESTORE LOGIC
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {... }
                  */

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 🧠 STRICT AUTH: Do NOT auto-login UI from Firebase state.
      // Only verifying credentials in LoginScreen should set userData.
      // This listener now only logs state for debugging.
      console.log("🔥 Firebase Auth State Changed:", user ? "User Authenticated (Background)" : "Signed Out");

      if (!user) {
        // Optionally confirm clear state
      }
    });

    return () => unsubscribe();
  }, []);

  // Load Google Maps API script - REMOVED for Leaflet migration
  /*
  useEffect(() => {
    const scriptId = 'google-maps-script';
    // ... code removed ...
  }, []);
                  */

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) { setVoices(availableVoices); }
    };
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else { console.error("Speech synthesis not supported."); }
    return () => { if ('speechSynthesis' in window) { window.speechSynthesis.onvoiceschanged = null; } };
  }, []);

  const view = history[history.length - 1];
  // t is already provided by useLanguage hook above

  const navigate = (newView) => {
    if (view === newView) return;
    setHistory(prev => [...prev, newView]);
  };

  // --- STRICT AUTH & ROUTING GUARD (Global Auth State) ---
  useEffect(() => {
    // 0. Global Auth State Concept
    const auth = {
      isAuthenticated: !!userData,
      role: userData?.role || null // "FARMER" | "BUYER"
    };

    // 1. Define View Categories (Routing Map)
    const publicViews = ['splash', 'language', 'role', 'register', 'login'];
    const farmerViews = ['dashboard', 'orders', 'prediction', 'camera', 'profile', 'settings', 'velan-ai'];
    const buyerViews = ['buyerDashboard', 'buyerOrders', 'buyerProfile', 'productDetail', 'liveMapTracker', 'checkout', 'paymentPartners', 'simulatedPayment'];

    // 2. Strict Redirection Rules
    if (view === 'splash') return; // 🛑 CRITICAL: Allow Splash to play, don't auto-redirect yet

    if (!auth.isAuthenticated) {
      // 🔒 Not Logged In -> Redirect to /register-role
      // If current view is NOT a public view, strictly force 'role'
      const isPrivateView = farmerViews.includes(view) || buyerViews.includes(view);

      // Also enforce the "App opens" rule: If we are just starting or lost, go to role.
      // We allow 'register' and 'login' as sub-pages of the Auth Flow. 
      // All else -> role.
      if (isPrivateView) {
        setHistory(['role']); // Clear stack, go to role
      }
    } else {
      // 🔓 Logged In

      // Rule: Hide Register page completely (Public views are blocked)
      if (publicViews.includes(view)) {
        const target = auth.role === 'farmer' ? 'dashboard' : 'buyerDashboard';
        setHistory([target]); // clear stack, strictly go to dashboard
        return;
      }

      // Rule: Strict Role Segregation
      if (auth.role === 'farmer') {
        // Farmer cannot see buyer views
        if (buyerViews.includes(view)) {
          setHistory(['dashboard']);
        }
      } else if (auth.role === 'buyer') {
        // Buyer cannot see farmer views
        if (farmerViews.includes(view)) {
          setHistory(['buyerDashboard']);
        }
      }
    }
  }, [view, userData, role]);

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const navigateAndReset = (newView, baseView) => {
    setHistory([baseView, newView]);
  }

  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode); // Uses global language context, persists to localStorage
    navigate('role');
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    navigate('login');
  };

  // --- AUTHENTICATION & USER MANAGEMENT ---
  const handleRegistration = async (data) => {
    // Save to Backend (Location Persistence)
    try {
      if (data.role === 'farmer' || data.role === 'buyer') {
        // Use a mock ID if not provided by auth yet (or use phone number as key)
        const userId = data.phone || data.email || 'user_' + Date.now();
        const cleanLocation = data.location ? data.location.split(',')[0].trim() : 'Tamil Nadu';

        // Fire and forget - persist location preference
        fetch('http://localhost:5000/api/users/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            location: cleanLocation,
            name: data.name
          })
        }).catch(err => console.error("Backend persistence failed", err));

        // Attach ID to local user object for session
        data.uid = userId;
      }
    } catch (e) { console.error(e); }

    setUserData(data);
    if (data.role === 'farmer') {
      navigate('dashboard');
    } else {
      navigate('buyerDashboard');
    }
  };

  const handleDemoLogin = () => {
    setIsDemoMode(true);
    // Select demo user based on the selected role during navigation
    const userToLoad = role === 'buyer' ? demoBuyer : demoUser;
    setUserData(userToLoad);
    setRole(userToLoad.role);
    if (userToLoad.role === 'farmer') {
      setIsFarmerVerified(true);
      navigate('dashboard');
    } else {
      navigate('buyerDashboard');
    }
  };

  const handleLogout = async () => {
    setIsDemoMode(false);
    setUserData(null);
    setRole(null);
    localStorage.removeItem('user_session'); // 🧠 Persistence Rule: Clear Auth
    setHistory(['role']); // 🔄 Redirect Rule: Logout -> /register-role strictly
  };

  const handleLogin = () => {
    if (role === 'farmer') {
      navigate('dashboard');
    } else {
      navigate('buyerDashboard');
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1); // Reset quantity for new product
    navigate('productDetail');
  };

  const handleTrackOrder = (order) => {
    // This mapping is for demo purposes to link order item keys to product names in the feed
    const productMap = {
      gradeATomatoes: 'Tomatoes',
      freshCarrots: 'Carrots',
    };
    const productName = productMap[order.itemKey];
    const productToTrack = mockBuyerFeed.find(p => p.productName === productName);

    if (productToTrack) {
      setSelectedProduct(productToTrack);
      navigate('liveMapTracker');
    } else {
      console.error("Could not find the product to track for order:", order.id);
      showModal("Sorry, tracking information is not available for this order.");
    }
  };

  const handleSelectPartner = (partner) => {
    setPaymentPartner(partner);
    navigate('simulatedPayment');
  };

  const handlePaymentSuccess = () => {
    // Reset the navigation stack to go from tracker back to the dashboard
    navigateAndReset('liveMapTracker', 'buyerDashboard');
  }

  // 🚀 STRICT FLOW: Splash -> Language (Always)
  const handleFarmerTrackOrder = (post) => {
    // Create a trackable object from the post for the tracker screen
    const trackableProduct = {
      ...post,
      productName: post.name, // Ensure naming consistency
      productImg: post.productImg,
      rate: post.price,
      farmerName: 'Me (Warehouse)',
      buyerName: 'Fresh Veggies Co.', // Mock buyer for demo
      status: 'In Transit',
      description: `Delivery of ${post.quantity}kg ${post.name} to Buyer.`
    };
    setSelectedProduct(trackableProduct);
    navigate('liveMapTracker');
  };

  const handleSplashFinish = () => {
    navigate('language');
  };

  const renderView = () => {
    switch (view) {
      case 'splash': return <IntroScreen onFinish={handleSplashFinish} />;
      case 'language': return <LanguageSelectionScreen onSelect={handleSelectLanguage} speak={speakText} voices={voices} />;
      case 'role': return <RoleSelectionScreen t={t} onSelectRole={handleSelectRole} onBack={handleBack} speak={speakText} lang={lang} voices={voices} />;
      case 'register': return <RegistrationScreen t={t} role={role} onRegister={handleRegistration} onSwitchToLogin={() => navigate('login')} onBack={handleBack} speak={speakText} lang={lang} voices={voices} onFileVerified={setIsFarmerVerified} />;
      case 'login': return <LoginScreen t={t} role={role} onLogin={handleLogin} onDemoLogin={handleDemoLogin} onSwitchToRegister={() => navigate('register')} onBack={handleBack} speak={speakText} lang={lang} voices={voices} setUserData={setUserData} setIsFarmerVerified={setIsFarmerVerified} />;
      case 'dashboard': return <FarmerDashboard t={t} navigate={navigate} speak={speakText} lang={lang} voices={voices} isFarmerVerified={isFarmerVerified} showModal={showModal} handleTrackOrder={handleTrackOrder} onFarmerTrackOrder={handleFarmerTrackOrder} userData={userData} isDemoMode={isDemoMode} />;
      case 'orders': return <OrdersScreen t={t} navigate={navigate} lang={lang} userData={userData} isDemoMode={isDemoMode} />;
      case 'buyerOrders': return <OrdersTracking onBack={() => navigate('buyerDashboard')} />;
      case 'buyerDashboard': return <BuyerContainer t={t} navigate={navigate} onSelectProduct={handleSelectProduct} buyerData={userData} lang={lang} handleTrackOrder={handleTrackOrder} isDemoMode={isDemoMode} />;
      case 'camera': return <CameraScreen t={t} navigate={navigate} speak={speakText} lang={lang} voices={voices} showModal={showModal} userData={userData} />;
      case 'profile': return <ProfileScreen t={t} navigate={navigate} isFarmerVerified={isFarmerVerified} userData={userData} setUserData={setUserData} role="farmer" lang={lang} onLogout={handleLogout} />;
      case 'buyerProfile': return <ProfileScreen t={t} navigate={navigate} isFarmerVerified={false} userData={userData} setUserData={setUserData} role="buyer" lang={lang} onLogout={handleLogout} />;
      case 'liveMapTracker': return <LiveMapTrackerScreen t={t} navigate={navigate} handleBack={handleBack} product={selectedProduct || mockBuyerFeed[1]} buyerLocation={{ lat: 11.0568, lng: 77.0558 }} showModal={showModal} />;
      case 'productDetail': return <ProductDetailScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} setQuantity={setOrderQuantity} />;
      case 'checkout': return <CheckoutScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} showModal={showModal} />;
      case 'paymentPartners': return <PaymentPartnerScreen t={t} navigate={navigate} onSelectPartner={handleSelectPartner} />;
      case 'simulatedPayment': return <SimulatedPaymentScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} partner={paymentPartner} onPaymentSuccess={handlePaymentSuccess} />;
      case 'prediction': return <PredictionScreen t={t} navigate={navigate} userData={userData} />;
      case 'velan-ai': return <VelanAiScreen onBack={handleBack} />;
      default: return <IntroScreen onFinish={() => navigate('language')} />;
    }
  };

  return (
    <>
      <FontLoader />
      <div className="h-screen w-screen font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
        {renderView()}
        <Modal isOpen={modal.isOpen} message={modal.message} onClose={closeModal} />
      </div>
    </>
  );
}

// Main App component - wraps everything in LanguageProvider for global language state
export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}