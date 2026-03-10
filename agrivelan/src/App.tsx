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


// --- Translations Object ---
const translations = {
  en: {
    appName: 'AGRIVELAN',
    selectLanguage: 'Select Your Language',
    registerAs: 'Register as a...',
    farmer: 'Farmer',
    buyer: 'Buyer',
    register: 'Register',
    registrationTitle: (role) => `${role} Registration`,
    fullName: 'Full Name',
    mobileNumber: 'Mobile Number',
    location: 'Location (City/Town)',
    aadharVerification: 'Aadhar Number',
    uploadAgriDoc: 'Upload Agri Document',
    password: 'PIN (6 Digits)',
    confirmPassword: 'Confirm Password',
    businessName: 'Business Name',
    businessType: 'Type of Business',
    gstNumber: 'GST Number',
    uploadBusinessLicense: 'Upload Business License',
    businessAddress: 'Business Address',
    login: 'Login',
    loginTitle: 'Welcome Back!',
    loginSubtitle: 'Please enter your details to sign in.',
    username: 'Email Address',
    alreadyRegistered: 'Already registered? Login',
    backToRegistration: 'Don\'t have an account? Register',
    googleMail: 'Google Mail',
    mobileVerification: 'Mobile Number Verification',
    sendOtp: 'Send OTP',
    enterOtp: 'Enter OTP',
    verifyOtp: 'Verify OTP',
    verified: 'Verified',
    languageSelected: 'English selected. The app will now be in English.',
    signInWithGoogle: 'Sign in with Google',
    or: 'OR',
    dashboard: 'Dashboard',
    profile: 'Profile',
    marketValue: 'Today\'s Market Value',
    sales: 'Sales',
    cameraGrading: 'AI Camera Grading',
    capture: 'Capture',
    detecting: 'Detecting...',
    grade: 'Grade',
    quantity: 'Quantity (in kg)',
    postForSale: 'Post for Sale',
    revenue: 'Revenue',
    orders: 'Orders',
    profit: 'Profit',
    myPosts: 'My Posts',
    ongoingOrders: 'Ongoing Orders',
    completedOrders: 'Completed Orders',
    trackOrder: 'Track Order',
    orderPlaced: 'Order Placed',
    shipped: 'Shipped',
    outForDelivery: 'Out for Delivery',
    delivered: 'Delivered',
    predictedValue: 'Predicted',
    ratePerKg: 'Rate/Kg',
    rating: 'Rating',
    delivery: 'Delivery',
    market: 'Market',
    account: 'Account',
    searchPlaceholder: 'Search for fruits & vegetables...',
    buyNow: 'Buy Now',
    checkout: 'Checkout',
    orderSummary: 'Order Summary',
    transportOptions: 'Transport Options',
    ownTransport: 'Own Transport',
    onlineVendor: 'Online Vendor',
    paymentMethod: 'Payment Method',
    cod: 'Cash on Delivery',
    onlinePayment: 'Online Payment',
    confirmOrder: 'Confirm Order',
    payNow: 'Pay Now',
    scanToPay: 'Scan QR to Pay with UPI',
    paymentSuccessful: 'Payment Successful!',
    choosePaymentMethod: 'Choose Payment Method',
    payTo: 'Pay to AgriVelan',
    processingPayment: 'Processing Payment...',
    redirectToTracker: 'Redirecting to your order...',
    topFeeds: 'Top Feeds',
    transactions: 'Transactions',
    deals: 'Deals',
    orderHistory: 'Order History',
    deliveryDetails: 'Delivery Details',
    farmerNotified: 'Farmer has been notified of delivery.',
    ongoing: 'Ongoing',
    credit: 'Credit',
    debit: 'Debit',
    walletTopUp: 'Wallet Top-up',
    gradeATomatoes: 'Grade A Tomatoes',
    freshCarrots: 'Fresh Carrots',
    cameraError: 'Could not access the camera. Please check permissions.',
    orderConfirmed: 'Order Confirmed!',
    postedForSale: 'Posted for sale!',
    monthlyIncome: 'Monthly Income',
    orderDetails: 'Order Details',
    customerReviews: 'Customer Reviews',
    driverDetails: 'Driver Details',
  },


  ta: { // Tamil
    appName: 'அக்ரிவேலன்',
    selectLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    registerAs: 'ஒருவராக பதிவு செய்யுங்கள்...',
    farmer: 'விவசாயி',
    buyer: 'வாங்குபவர்',
    register: 'பதிவு செய்யுங்கள்',
    registrationTitle: (role) => `${role} பதிவு`,
    fullName: 'முழு பெயர்',
    mobileNumber: 'மொபைல் எண்',
    location: 'இடம் (நகரம்/ஊர்)',
    aadharVerification: 'ஆதார் எண்',
    uploadAgriDoc: 'வேளாண் ஆவணத்தைப் பதிவேற்றவும்',
    password: 'கடவுச்சொல்',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    businessName: 'வணிகப் பெயர்',
    businessType: 'வணிக வகை',
    gstNumber: 'ஜிஎஸ்டி எண்',
    uploadBusinessLicense: 'வணிக உரிமத்தைப் பதிவேற்றவும்',
    businessAddress: 'வணிக முகவரி',
    login: 'உள்நுழைய',
    loginTitle: 'மீண்டும் வருக!',
    loginSubtitle: 'உள்நுழைய உங்கள் விவரங்களை உள்ளிடவும்.',
    username: 'பயனர்பெயர் (மொபைல் எண்)',
    alreadyRegistered: 'ஏற்கனவே பதிவு செய்துள்ளீர்களா? உள்நுழைய',
    backToRegistration: 'கணக்கு இல்லையா? பதிவு செய்யுங்கள்',
    googleMail: 'கூகுள் மெயில்',
    mobileVerification: 'மொபைல் எண் சரிபார்ப்பு',
    sendOtp: 'OTP அனுப்பவும்',
    enterOtp: 'OTP ஐ உள்ளிடவும்',
    verifyOtp: 'OTP ஐ சரிபார்க்கவும்',
    verified: 'சரிபார்க்கப்பட்டது',
    languageSelected: 'தமிழ் தேர்ந்தெடுக்கப்பட்டது. செயலி இப்போது தமிழில் இருக்கும்.',
    signInWithGoogle: 'Google மூலம் உள்நுழையவும்',
    or: 'அல்லது',
    dashboard: 'டாஷ்போர்டு',
    profile: 'சுயவிவரம்',
    marketValue: 'இன்றைய சந்தை மதிப்பு',
    sales: 'விற்பனை',
    cameraGrading: 'AI கேமரா தரப்படுத்தல்',
    capture: 'படம் எடு',
    detecting: 'கண்டறிகிறது...',
    grade: 'தரம்',
    quantity: 'அளவு (கிலோவில்)',
    postForSale: 'விற்பனைக்கு இடு',
    revenue: 'வருவாய்',
    orders: 'ஆர்டர்கள்',
    profit: 'லாபம்',
    myPosts: 'எனது பதிவுகள்',
    ongoingOrders: 'நடப்பு ஆர்டர்கள்',
    completedOrders: 'முடிந்த ஆர்டர்கள்',
    trackOrder: 'ஆர்டரைக் கண்காணிக்கவும்',
    orderPlaced: 'ஆர்டர் செய்யப்பட்டது',
    shipped: 'அனுப்பப்பட்டது',
    outForDelivery: 'விநியோகத்திற்கு ಹೊರட்டது',
    delivered: 'விநியோகிக்கப்பட்டது',
    predictedValue: 'கணிக்கப்பட்ட',
    ratePerKg: 'விகிதம்/கிலோ',
    rating: 'மதிப்பீடு',
    delivery: 'விநியோகம்',
    market: 'சந்தை',
    account: 'கணக்கு',
    searchPlaceholder: 'பழங்கள் மற்றும் காய்கறிகளைத் தேடுங்கள்...',
    buyNow: 'இப்போது வாங்கு',
    checkout: 'செக்அவுட்',
    orderSummary: 'ஆர்டர் சுருக்கம்',
    transportOptions: 'போக்குவரத்து விருப்பங்கள்',
    ownTransport: 'சொந்த போக்குவரத்து',
    onlineVendor: 'ஆன்லைன் விற்பனையாளர்',
    paymentMethod: 'பணம் செலுத்தும் முறை',
    cod: 'பணம் டெலிவரி',
    onlinePayment: 'ஆன்லைன் கட்டணம்',
    confirmOrder: 'ஆர்டரை உறுதிப்படுத்து',
    payNow: 'இப்போது செலுத்து',
    scanToPay: 'UPI மூலம் செலுத்த QR ஐ ஸ்கேன் செய்யவும்',
    paymentSuccessful: 'பணம் செலுத்துதல் வெற்றி!',
    choosePaymentMethod: 'பணம் செலுத்தும் முறையைத் தேர்வுசெய்க',
    payTo: 'அக்ரிவேலனுக்கு பணம் செலுத்துங்கள்',
    processingPayment: 'பணம் செயலாக்கப்படுகிறது...',
    redirectToTracker: 'உங்கள் ஆர்டருக்கு திருப்பி விடப்படுகிறது...',
    topFeeds: 'சிறந்த ஊட்டங்கள்',
    transactions: 'பரிவர்த்தனைகள்',
    deals: 'ஒப்பந்தங்கள்',
    orderHistory: 'ஆர்டர் வரலாறு',
    deliveryDetails: 'விநியோக விவரங்கள்',
    farmerNotified: 'விநியோகம் குறித்து விவசாயிக்கு அறிவிக்கப்பட்டுள்ளது.',
    ongoing: 'நடப்பில் உள்ளது',
    credit: 'வரவு',
    debit: 'பற்று',
    walletTopUp: 'வாலட் டாப்-அப்',
    gradeATomatoes: 'தரம் A தக்காளி',
    freshCarrots: 'புதிய கேரட்',
    cameraError: 'கேமராவை அணுக முடியவில்லை. அனுமதிகளைச் சரிபார்க்கவும்.',
    orderConfirmed: 'ஆர்டர் உறுதி செய்யப்பட்டது!',
    postedForSale: 'விற்பனைக்கு பதிவு செய்யப்பட்டது!',
    monthlyIncome: 'மாதாந்திர வருமானம்',
    orderDetails: 'ஆர்டர் விவரங்கள்',
    customerReviews: 'வாடிக்கையாளர் மதிப்புரைகள்',
    driverDetails: 'ஓட்டுநர் விவரங்கள்',
  },
  te: { // Telugu
    appName: 'అగ్రివేలన్',
    selectLanguage: 'మీ భాషను ఎంచుకోండి',
    registerAs: 'ఒకరిగా నమోదు చేసుకోండి...',
    farmer: 'రైతు',
    buyer: 'కొనుగోలుదారు',
    register: 'నమోదు చేసుకోండి',
    registrationTitle: (role) => `${role} నమోదు`,
    fullName: 'పూర్తి పేరు',
    mobileNumber: 'మొబైల్ నంబర్',
    location: 'స్థానం (నగరం/పట్టణం)',
    aadharVerification: 'ఆధార్ నంబర్',
    uploadAgriDoc: 'వ్యవసాయ పత్రాన్ని అప్‌లోడ్ చేయండి',
    password: 'పాస్వర్డ్',
    confirmPassword: 'పాస్వర్డ్ను నిర్ధారించండి',
    businessName: 'వ్యాపార పేరు',
    businessType: 'వ్యాపార రకం',
    gstNumber: 'జీఎస్టీ నంబర్',
    uploadBusinessLicense: 'వ్యాపార లైసెన్సును అప్లోడ్ చేయండి',
    businessAddress: 'వ్యాపార చిరునామా',
    login: 'ప్రవేశించండి',
    loginTitle: 'తిరిగి స్వాగతం!',
    loginSubtitle: 'సైన్ ఇన్ చేయడానికి దయచేసి మీ వివరాలను నమోదు చేయండి.',
    username: 'వినియోగదారు పేరు (మొబైల్ నంబర్)',
    alreadyRegistered: 'ఇప్పటికే నమోదు చేసుకున్నారా? ప్రవేశించండి',
    backToRegistration: 'ఖాతా లేదా? నమోదు చేసుకోండి',
    googleMail: 'గూగుల్ మెయిల్',
    mobileVerification: 'మొబైల్ నంబర్ ధృవీకరణ',
    sendOtp: 'OTP పంపండి',
    enterOtp: 'OTP నమోదు చేయండి',
    verifyOtp: 'OTPని ధృవీకరించండి',
    verified: 'ధృవీకరించబడింది',
    languageSelected: 'తెలుగు ఎంచుకోబడింది. యాప్ ఇప్పుడు తెలుగులో ఉంటుంది.',
    signInWithGoogle: 'Googleతో సైన్ ఇన్ చేయండి',
    or: 'లేదా',
    dashboard: 'డాష్‌బోర్డ్',
    profile: 'ప్రొఫైల్',
    marketValue: 'ఈ రోజు మార్కెట్ విలువ',
    sales: 'అమ్మకాలు',
    cameraGrading: 'AI కెమెరా గ్రేడింగ్',
    capture: 'క్యాప్చర్',
    detecting: 'గుర్తిస్తోంది...',
    grade: 'గ్రేడ్',
    quantity: 'పరిమాణం (కిలోలలో)',
    postForSale: 'అమ్మకానికి పోస్ట్ చేయండి',
    revenue: 'రాబడి',
    orders: 'ఆర్డర్లు',
    profit: 'లాభం',
    myPosts: 'నా పోస్ట్‌లు',
    ongoingOrders: 'కొనసాగుతున్న ఆర్డర్‌లు',
    completedOrders: 'పూర్తయిన ఆర్డర్‌లు',
    trackOrder: 'ఆర్డర్‌ను ట్రాక్ చేయండి',
    orderPlaced: 'ఆర్డర్ ఉంచబడింది',
    shipped: 'రవాణా చేయబడింది',
    outForDelivery: 'డెలివరీ కోసం బయలుదేరింది',
    delivered: 'అందజేయబడింది',
    predictedValue: 'అంచనా',
    ratePerKg: 'రేటు/కిలో',
    rating: 'రేటింగ్',
    delivery: 'డెలివరీ',
    market: 'మార్కెట్',
    account: 'ఖాతా',
    searchPlaceholder: 'పండ్లు & కూరగాయల కోసం శోధించండి...',
    buyNow: 'ఇప్పుడు కొనుగోలు చేయండి',
    checkout: 'చెక్అవుట్',
    orderSummary: 'ఆర్డర్ సారాంశం',
    transportOptions: 'రవాణా ఎంపికలు',
    ownTransport: 'సొంత రవాణా',
    onlineVendor: 'ఆన్‌లైన్ విక్రేత',
    paymentMethod: 'చెల్లింపు పద్ధతి',
    cod: 'క్యాష్ ఆన్ డెలివరీ',
    onlinePayment: 'ఆన్‌లైన్ చెల్లింపు',
    confirmOrder: 'ఆర్డర్‌ను నిర్ధారించండి',
    payNow: 'ఇప్పుడు చెల్లించండి',
    scanToPay: 'UPIతో చెల్లించడానికి QRని స్కాన్ చేయండి',
    paymentSuccessful: 'చెల్లింపు విజయవంతమైంది!',
    choosePaymentMethod: 'చెల్లింపు పద్ధతిని ఎంచుకోండి',
    payTo: 'అగ్రివేలన్‌కు చెల్లించండి',
    processingPayment: 'చెల్లింపు ప్రాసెస్ చేయబడుతోంది...',
    redirectToTracker: 'మీ ఆర్డర్‌కు దారి మళ్లిస్తోంది...',
    topFeeds: 'టాప్ ఫీడ్‌లు',
    transactions: 'లావాదేవీలు',
    deals: 'ఒప్పందాలు',
    orderHistory: 'ఆర్డర్ చరిత్ర',
    deliveryDetails: 'డెలివరీ వివరాలు',
    farmerNotified: 'రైతుకు డెలివరీ గురించి తెలియజేయబడింది.',
    ongoing: 'కొనసాగుతోంది',
    credit: 'క్రెడిట్',
    debit: 'డెబిట్',
    walletTopUp: 'వాలెట్ టాప్-అప్',
    gradeATomatoes: 'గ్రేడ్ A టమోటాలు',
    freshCarrots: 'తాజా క్యారెట్లు',
    cameraError: 'కెమెరాను యాక్సెస్ చేయడం సాధ్యం కాలేదు. దయచేసి అనుమతులను తనిఖీ చేయండి.',
    orderConfirmed: 'ఆర్డర్ నిర్ధారించబడింది!',
    postedForSale: 'అమ్మకానికి పోస్ట్ చేయబడింది!',
    monthlyIncome: 'నెలసరి ఆదాయం',
    orderDetails: 'ఆర్డర్ వివరాలు',
    customerReviews: 'వినియోగదారు సమీక్షలు',
    driverDetails: 'డ్రైవర్ వివరాలు',
  },
  ml: { // Malayalam
    appName: 'അഗ്രിവേലൻ',
    selectLanguage: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    registerAs: 'ആയി രജിസ്റ്റർ ചെയ്യുക...',
    farmer: 'കർഷകൻ',
    buyer: 'വാങ്ങുന്നയാൾ',
    register: 'രജിസ്റ്റർ ചെയ്യുക',
    registrationTitle: (role) => `${role} രജിസ്ട്രേഷൻ`,
    fullName: 'മുഴുവൻ പേര്',
    mobileNumber: 'മൊബൈൽ നമ്പർ',
    location: 'സ്ഥലം (നഗരം/പട്ടണം)',
    aadharVerification: 'ആധാർ നമ്പർ',
    uploadAgriDoc: 'കാർഷിക രേഖ അപ്‌ലോഡ് ചെയ്യുക',
    password: 'പാസ്വേഡ്',
    confirmPassword: 'പാസ്വേഡ് സ്ഥിരീകരിക്കുക',
    businessName: 'ബിസിനസ്സ് പേര്',
    businessType: 'ബിസിനസ്സ് തരം',
    gstNumber: 'ജിഎസ്ടി നമ്പർ',
    uploadBusinessLicense: 'ബിസിനസ് ലൈസൻസ് അപ്‌ലോഡ് ചെയ്യുക',
    businessAddress: 'ബിസിനസ്സ് വിലാസം',
    login: 'പ്രവേശിക്കുക',
    loginTitle: 'വീണ്ടും സ്വാഗതം!',
    loginSubtitle: 'സൈൻ ഇൻ ചെയ്യാൻ നിങ്ങളുടെ വിശദാംശങ്ങൾ നൽകുക.',
    username: 'ഉപയോക്തൃനാമം (മൊബൈൽ നമ്പർ)',
    alreadyRegistered: 'ഇതിനകം രജിസ്റ്റർ ചെയ്തോ? പ്രവേശിക്കുക',
    backToRegistration: 'അക്കൗണ്ട് ഇല്ലേ? രജിസ്റ്റർ ചെയ്യുക',
    googleMail: 'ഗൂഗിൾ മെയിൽ',
    mobileVerification: 'മൊബൈൽ നമ്പർ പരിശോധന',
    sendOtp: 'OTP അയയ്ക്കുക',
    enterOtp: 'OTP നൽകുക',
    verifyOtp: 'OTP പരിശോധിക്കുക',
    verified: 'പരിശോധിച്ചു',
    languageSelected: 'മലയാളം തിരഞ്ഞെടുത്തു. ആപ്പ് ഇനി മലയാളത്തിലായിരിക്കും.',
    signInWithGoogle: 'Google ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക',
    or: 'അഥവാ',
    dashboard: 'ഡാഷ്ബോർഡ്',
    profile: 'പ്രൊഫൈൽ',
    marketValue: 'ഇന്നത്തെ മാർക്കറ്റ് വില',
    sales: 'വില്പന',
    cameraGrading: 'AI ക്യാമറ ഗ്രേഡിംഗ്',
    capture: 'ക്യാപ്‌ചർ ചെയ്യുക',
    detecting: 'കണ്ടെത്തുന്നു...',
    grade: 'ഗ്രേഡ്',
    quantity: 'അളവ് (കിലോയിൽ)',
    postForSale: 'വില്പനയ്ക്ക് പോസ്റ്റ് ചെയ്യുക',
    revenue: 'വരുമാനം',
    orders: 'ഓർഡറുകൾ',
    profit: 'ലാഭം',
    myPosts: 'എന്റെ പോസ്റ്റുകൾ',
    ongoingOrders: 'നടന്നുകൊണ്ടിരിക്കുന്ന ഓർഡറുകൾ',
    completedOrders: 'പൂർത്തിയായ ഓർഡറുകൾ',
    trackOrder: 'ഓർഡർ колеса көзөмөлдөө',
    orderPlaced: 'ഓർഡർ നൽകി',
    shipped: 'അയച്ചു',
    outForDelivery: 'ഡെലിവറിക്കായി പുറപ്പെട്ടു',
    delivered: 'വിതരണം ചെയ്തു',
    predictedValue: 'പ്രവചിച്ചത്',
    ratePerKg: 'നിരക്ക്/കിലോ',
    rating: 'റേറ്റിംഗ്',
    delivery: 'ഡെലിവറി',
    market: 'മാർക്കറ്റ്',
    account: 'അക്കൗണ്ട്',
    searchPlaceholder: 'പഴങ്ങൾക്കും പച്ചക്കറികൾക്കുമായി തിരയുക...',
    buyNow: 'ഇപ്പോൾ വാങ്ങുക',
    checkout: 'ചെക്ക്ഔട്ട്',
    orderSummary: 'ഓർഡർ സംഗ്രഹം',
    transportOptions: 'ഗതാഗത ഓപ്ഷനുകൾ',
    ownTransport: 'സ്വന്തം ഗതാഗതം',
    onlineVendor: 'ഓൺലൈൻ വെണ്ടർ',
    paymentMethod: 'പേയ്മെന്റ് രീതി',
    cod: 'ക്യാഷ് ഓൺ ഡെലിവറി',
    onlinePayment: 'ഓൺലൈൻ പേയ്മെന്റ്',
    confirmOrder: 'ഓർഡർ സ്ഥിരീകരിക്കുക',
    payNow: 'ഇപ്പോൾ പണമടയ്ക്കുക',
    scanToPay: 'UPI ഉപയോഗിച്ച് പണമടയ്ക്കാൻ QR സ്കാൻ ചെയ്യുക',
    paymentSuccessful: 'പേയ്മെന്റ് വിജയകരമായി!',
    choosePaymentMethod: 'പേയ്മെന്റ് രീതി തിരഞ്ഞെടുക്കുക',
    payTo: 'അഗ്രിവേലന് പണം നൽകുക',
    processingPayment: 'പേയ്മെന്റ് പ്രോസസ്സ് ചെയ്യുന്നു...',
    redirectToTracker: 'നിങ്ങളുടെ ഓർഡറിലേക്ക് റീഡയറക്‌ടുചെയ്യുന്നു...',
    topFeeds: 'മികച്ച ഫീഡുകൾ',
    transactions: 'ഇടപാടുകൾ',
    deals: 'ഡീലുകൾ',
    orderHistory: 'ഓർഡർ ചരിത്രം',
    deliveryDetails: 'വിശദാംശങ്ങൾ',
    farmerNotified: 'ഡെലിവറി കർഷകനെ അറിയിച്ചു.',
    ongoing: 'പുരോഗമിക്കുന്നു',
    credit: 'ക്രെഡിറ്റ്',
    debit: 'ഡെബിറ്റ്',
    walletTopUp: 'വാലറ്റ് ടോപ്പ്-അപ്പ്',
    gradeATomatoes: 'ഗ്രേഡ് എ തക്കാളി',
    freshCarrots: 'ഫ്രഷ് കാരറ്റ്',
    cameraError: 'ക്യാമറ ആക്‌സസ് ചെയ്യാൻ കഴിഞ്ഞില്ല. ദയവായി അനുമതികൾ പരിശോധിക്കുക.',
    orderConfirmed: 'ഓർഡർ സ്ഥിരീകരിച്ചു!',
    postedForSale: 'വിൽപ്പനയ്ക്ക് പോസ്റ്റ് ചെയ്തു!',
    monthlyIncome: 'പ്രതിമാസ വരുമാനം',
    orderDetails: 'ഓർഡർ വിശദാംശങ്ങൾ',
    customerReviews: 'ഉപഭോക്തൃ അവലോകനങ്ങൾ',
    driverDetails: 'ഡ്രൈവർ വിശദാംശങ്ങൾ',
  },
  kn: { // Kannada
    appName: 'ಅಗ್ರಿವೇಲನ್',
    selectLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    registerAs: 'ಆಗಿ ನೋಂದಾಯಿಸಿ...',
    farmer: 'ರೈತ',
    buyer: 'ಖರೀದಿದಾರ',
    register: 'ನೋಂದಾಯಿಸಿ',
    registrationTitle: (role) => `${role} ನೋಂದಣಿ`,
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    mobileNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    location: 'ಸ್ಥಳ (ನಗರ/ಪಟ್ಟಟಣ)',
    aadharVerification: 'ಆಧಾರ್ ಸಂಖ್ಯೆ',
    uploadAgriDoc: 'ಕೃಷಿ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    password: 'ಪಾಸ್ವರ್ಡ್',
    confirmPassword: 'ಪಾಸ್ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    businessName: 'ವ್ಯಾಪಾರದ ಹೆಸರು',
    businessType: 'ವ್ಯವಹಾರದ ಪ್ರಕಾರ',
    gstNumber: 'ಜಿಎಸ್ಟಿ ಸಂಖ್ಯೆ',
    uploadBusinessLicense: 'ವ್ಯಾಪಾರ ಪರವಾನಗಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    businessAddress: 'ವ್ಯಾಪಾರ ವಿಳಾಸ',
    login: 'ಲಾಗಿನ್ ಮಾಡಿ',
    loginTitle: 'ಮರಳಿ ಸ್ವಾಗತ!',
    loginSubtitle: 'ಸೈನ್ ಇನ್ ಮಾಡಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.',
    username: 'ಬಳಕೆದಾರಹೆಸರು (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)',
    alreadyRegistered: 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ? ಲಾಗಿನ್ ಮಾಡಿ',
    backToRegistration: 'ಖಾತೆ ಇಲ್ಲವೇ? ನೋಂದಾಯಿಸಿ',
    googleMail: 'ಗೂಗಲ್ ಮೇಲ್',
    mobileVerification: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಪರಿಶೀಲನೆ',
    sendOtp: 'OTP ಕಳುಹಿಸಿ',
    enterOtp: 'OTP ನಮೂದಿಸಿ',
    verifyOtp: 'OTP ಪರಿಶೀಲಿಸಿ',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    languageSelected: 'ಕನ್ನಡ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಅಪ್ಲಿಕೇಶನ್ ಈಗ ಕನ್ನಡದಲ್ಲಿರುತ್ತದೆ.',
    signInWithGoogle: 'Google ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    or: 'ಅಥವಾ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    profile: 'ಪ್ರೊಫೈಲ್',
    marketValue: 'ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ಮೌಲ್ಯ',
    sales: 'ಮಾರಾಟ',
    cameraGrading: 'AI ಕ್ಯಾಮೆರಾ ಗ್ರೇಡಿಂಗ್',
    capture: 'ಸೆರೆಹಿಡಿಯಿರಿ',
    detecting: 'ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...',
    grade: 'ದರ್ಜೆ',
    quantity: 'ಪ್ರಮಾಣ (ಕೆಜಿಯಲ್ಲಿ)',
    postForSale: 'ಮಾರಾಟಕ್ಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ',
    revenue: 'ಆದಾಯ',
    orders: 'ಆದೇಶಗಳು',
    profit: 'ಲಾಭ',
    myPosts: 'ನನ್ನ ಪೋಸ್ಟ್‌ಗಳು',
    ongoingOrders: 'ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಆದೇಶಗಳು',
    completedOrders: 'ಪೂರ್ಣಗೊಂಡ ಆದೇಶಗಳು',
    trackOrder: 'ಆದೇಶವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    orderPlaced: 'ಆದೇಶವನ್ನು ಇರಿಸಲಾಗಿದೆ',
    shipped: 'ರವಾನಿಸಲಾಗಿದೆ',
    outForDelivery: 'ವಿತರಣೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    delivered: 'ವಿತರಿಸಲಾಗಿದೆ',
    predictedValue: 'ಊಹಿಸಲಾಗಿದೆ',
    ratePerKg: 'ದರ/ಕೆಜಿ',
    rating: 'ರೇಟಿಂಗ್',
    delivery: 'ವಿತರಣೆ',
    market: 'ಮಾರುಕಟ್ಟೆ',
    account: 'ಖಾತೆ',
    searchPlaceholder: 'ಹಣ್ಣುಗಳು ಮತ್ತು ತರಕಾರಿಗಳಿಗಾಗಿ ಹುಡುಕಿ...',
    buyNow: 'ಈಗ ಖರೀದಿಸು',
    checkout: 'ಚೆಕ್ಔಟ್',
    orderSummary: 'ಆದೇಶದ ಸಾರಾಂಶ',
    transportOptions: 'ಸಾರಿಗೆ ಆಯ್ಕೆಗಳು',
    ownTransport: 'ಸ್ವಂತ ಸಾರಿಗೆ',
    onlineVendor: 'ಆನ್‌ಲೈನ್ ಮಾರಾಟಗಾರ',
    paymentMethod: 'ಪಾವತಿ ವಿಧಾನ',
    cod: 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ',
    onlinePayment: 'ಆನ್‌ಲೈನ್ ಪಾವತಿ',
    confirmOrder: 'ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸಿ',
    payNow: 'ಈಗ ಪಾವತಿಸು',
    scanToPay: 'ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸಲು ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    paymentSuccessful: 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ!',
    choosePaymentMethod: 'ಪಾವತಿ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    processingPayment: 'ಪಾವತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    redirectToTracker: 'ನಿಮ್ಮ ಆದೇಶಕ್ಕೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...',
    topFeeds: 'ಟಾಪ್ ಫೀಡ್‌ಗಳು',
    transactions: 'ವಹಿವಾಟುಗಳು',
    deals: 'ಒಪ್ಪಂದಗಳು',
    orderHistory: 'ಆದೇಶ ಇತಿಹಾಸ',
    deliveryDetails: 'ವಿತರಣಾ ವಿವರಗಳು',
    farmerNotified: 'ರೈತನಿಗೆ ವಿತರಣೆಯ ಬಗ್ಗೆ ತಿಳಿಸಲಾಗಿದೆ.',
    ongoing: 'ಚಾಲ್ತಿಯಲ್ಲಿದೆ',
    credit: 'ಕ್ರೆಡಿಟ್',
    debit: 'ಡೆಬಿಟ್',
    walletTopUp: 'ವ್ಯಾಲೆಟ್ ಟಾಪ್-ಅಪ್',
    gradeATomatoes: 'ದರ್ಜೆ ಎ ಟೊಮ್ಯಾಟೊ',
    freshCarrots: 'ತಾಜಾ ಕ್ಯಾರೆಟ್',
    cameraError: 'ಕ್ಯಾಮರಾವನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅನುಮತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    orderConfirmed: 'ಆರ್ಡರ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ!',
    postedForSale: 'ಮಾರಾಟಕ್ಕೆ ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ!',
    monthlyIncome: 'ಮಾಸಿಕ ಆದಾಯ',
    orderDetails: 'ಆದೇಶದ ವಿವರಗಳು',
    customerReviews: 'ಗ್ರಾಹಕರ ವಿಮರ್ಶೆಗಳು',
    driverDetails: 'ಚಾಲಕ ವಿವರಗಳು',
  },
  hi: { // Hindi
    appName: 'एग्रीवेलन',
    selectLanguage: 'अपनी भाषा चुनें',
    registerAs: 'के रूप में पंजीकरण करें...',
    farmer: 'किसान',
    buyer: 'खरीदार',
    register: 'पंजीकरण करें',
    registrationTitle: (role) => `${role} पंजीकरण`,
    fullName: 'पूरा नाम',
    mobileNumber: 'मोबाइल नंबर',
    location: 'स्थान (शहर/कस्बा)',
    aadharVerification: 'आधार संख्या',
    uploadAgriDoc: 'कृषि दस्तावेज़ अपलोड करें',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    businessName: 'व्यावसायिक नाम',
    businessType: 'व्यवसाय का प्रकार',
    gstNumber: 'जीएसटी संख्या',
    uploadBusinessLicense: 'व्यापार लाइसेंस अपलोड करें',
    businessAddress: 'व्यावसायिक पता',
    login: 'लॉग इन करें',
    loginTitle: 'वापसी पर स्वागत है!',
    loginSubtitle: 'साइन इन करने के लिए कृपया अपना विवरण दर्ज करें।',
    username: 'उपयोगकर्ता नाम (मोबाइल नंबर)',
    alreadyRegistered: 'पहले से पंजीकृत हैं? लॉग इन करें',
    backToRegistration: 'खाता नहीं है? पंजीकरण करें',
    googleMail: 'गूगल मेल',
    mobileVerification: 'मोबाइल नंबर सत्यापन',
    sendOtp: 'ओटीपी भेजें',
    enterOtp: 'ओटीपी दर्ज करें',
    verifyOtp: 'ओटीपी सत्यापित करें',
    verified: 'सत्यापित',
    languageSelected: 'हिन्दी का चयन किया गया। ऐप अब हिन्दी में होगा।',
    signInWithGoogle: 'Google से साइन इन करें',
    or: 'या',
    dashboard: 'डैशबोर्ड',
    profile: 'प्रोफ़ाइल',
    marketValue: 'आज का बाजार मूल्य',
    sales: 'बिक्री',
    cameraGrading: 'एआई कैमरा ग्रेडिंग',
    capture: 'कैप्चर',
    detecting: 'पता लगाया जा रहा है...',
    grade: 'ग्रेड',
    quantity: 'मात्रा (किलो में)',
    postForSale: 'बिक्री के लिए पोस्ट करें',
    revenue: 'राजस्व',
    orders: 'आदेश',
    profit: 'लाभ',
    myPosts: 'मेरी पोस्ट',
    ongoingOrders: 'चल रहे आदेश',
    completedOrders: 'पूर्ण आदेश',
    trackOrder: 'आदेश को ट्रेक करें',
    orderPlaced: 'आदेश दिया गया',
    shipped: 'भेज दिया गया',
    outForDelivery: 'वितरण के लिए बाहर',
    delivered: 'पहुंचा दिया गया',
    predictedValue: 'अनुमानित',
    ratePerKg: 'दर/किग्रा',
    rating: 'रेटिंग',
    delivery: 'डिलिवरी',
    market: 'बाजार',
    account: 'खाता',
    searchPlaceholder: 'फलों और सब्जियों की खोज करें...',
    buyNow: 'अभी खरीदें',
    checkout: 'चेकआउट',
    orderSummary: 'आर्डर का सारांश',
    transportOptions: 'परिवहन विकल्प',
    ownTransport: 'अपना परिवहन',
    onlineVendor: 'ऑनलाइन विक्रेता',
    paymentMethod: 'भुगतान का तरीका',
    cod: 'डिलवरी पर नकदी',
    onlinePayment: 'ऑनलाइन भुगतान',
    confirmOrder: 'आदेश की पुष्टि करें',
    payNow: 'अभी भुगतान करें',
    scanToPay: 'यूपीआई से भुगतान करने के लिए क्यूआर स्कैन करें',
    paymentSuccessful: 'भुगतान सफल!',
    choosePaymentMethod: 'भुगतान विधि चुनें',
    payTo: 'एग्रीवेलन को भुगतान करें',
    processingPayment: 'भुगतान संसाधित हो रहा है...',
    redirectToTracker: 'आपके आदेश पर पुनर्निर्देशित किया जा रहा है...',
    topFeeds: 'शीर्ष फ़ीड',
    transactions: 'लेन-देन',
    deals: 'सौदे',
    orderHistory: 'आदेश इतिहास',
    deliveryDetails: 'वितरण विवरण',
    farmerNotified: 'किसान को डिलीवरी की सूचना दे दी गई है।',
    ongoing: 'चल रहा है',
    credit: 'क्रेडिट',
    debit: 'डेबिट',
    walletTopUp: 'वॉलेट टॉप-अप',
    gradeATomatoes: 'ग्रेड ए टमाटर',
    freshCarrots: 'ताजा गाजर',
    cameraError: 'कैमरे तक नहीं पहुंच सका। कृपया अनुमतियों की जांच करें।',
    orderConfirmed: 'आदेश की पुष्टि हुई!',
    postedForSale: 'बिक्री के लिए पोस्ट किया गया!',
    monthlyIncome: 'मासिक आय',
    orderDetails: 'आदेश विवरण',
    customerReviews: 'ग्राहक समीक्षा',
    driverDetails: 'ड्राइवर का विवरण',
  },
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
  { id: 1, productName: 'Tomatoes', productImg: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Prakash Kumar', location: 'Coimbatore, TN', rate: 35, rating: 4.5, description: 'Fresh, organic tomatoes...', coords: { lat: 11.0168, lng: 76.9558 } },
  { id: 2, productName: 'Onions', productImg: 'https://wallpaperaccess.com/full/1912930.jpg', farmerName: 'Suresh Farms', location: 'Pollachi, TN', rate: 28, rating: 4.8, description: 'High-quality red onions...', coords: { lat: 10.6621, lng: 77.0118 } },
  { id: 3, productName: 'Carrots', productImg: 'https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', farmerName: 'Organic Greens', location: 'Ooty, TN', rate: 40, rating: 4.9, description: 'Sweet and crunchy carrots...', coords: { lat: 11.4102, lng: 76.6950 } },
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
    console.error("Speech synthesis not supported or text is empty.");
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

const LanguageSwitcher = ({ lang, setLang, languages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLangName = languages.find(l => l.code === lang)?.name || 'Language';
  const dropdownRef = useRef(null);

  const selectLang = (langCode) => {
    setLang(langCode);
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m4 16l-7-7-7 7m18-10h-6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden md:block font-medium">{currentLangName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-20 ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {languages.map(language => (
              <li key={language.code}>
                <button
                  onClick={() => selectLang(language.code)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>{language.name}</span>
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

const InputField = ({ id, label, type = 'text', placeholder, disabled = false, speak, lang, voices, name }) => (
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

  const handleSendOtp = () => {
    speak(t.sendOtp, lang, voices);
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    speak(t.verifyOtp, lang, voices);
    setOtpVerified(true);
  };

  return (
    <div>
      <Speakable as="label" htmlFor="mobile" text={t.mobileNumber} speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-gray-700">{t.mobileNumber}</Speakable>
      <div className="mt-1 flex items-stretch">
        <input id="mobile" name="mobile" type="tel" required disabled={otpVerified}
          className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-l-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition duration-150 disabled:bg-gray-100"
          placeholder="9876543210" />
        {!otpVerified ? (
          <button type="button" onClick={handleSendOtp} disabled={otpSent}
            className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-200 disabled:cursor-not-allowed">
            {t.sendOtp}
          </button>
        ) : (
          <span className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-green-500 text-sm font-medium rounded-r-md text-white bg-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <Speakable as="span" text={t.verified} speak={speak} lang={lang} voices={voices}>{t.verified}</Speakable>
          </span>
        )}
      </div>
      {otpSent && !otpVerified && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <Speakable as="label" htmlFor="otp" text={t.enterOtp} speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-amber-800">{t.enterOtp}</Speakable>
          <div className="mt-1 flex items-stretch">
            <input id="otp" name="otp" type="text" required
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-l-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              placeholder="XXXXXX" />
            <button type="button" onClick={handleVerifyOtp}
              className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500">
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
        // Simulate verification after a short delay
        setTimeout(() => onFileVerified(true), 1500);
      }
    }
  };

  return (
    <div>
      <Speakable as="label" text={label} speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-gray-700">{label}</Speakable>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${fileName ? 'border-green-500' : 'border-gray-300'} border-dashed rounded-lg transition-colors duration-300`}>
        <div className="space-y-1 text-center">
          {fileName ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <Speakable as="p" text="File Uploaded!" speak={speak} lang={lang} voices={voices} className="font-medium text-green-600">File Uploaded!</Speakable>
              <p className="text-sm text-gray-500 truncate max-w-xs mx-auto">{fileName}</p>
              <label htmlFor={id} className="relative cursor-pointer text-xs bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none">
                <Speakable as="span" text="Change file" speak={speak} lang={lang} voices={voices}>Change file</Speakable>
                <input id={id} name={name || id} type="file" className="sr-only" onChange={handleFileChange} />
              </label>
            </>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                  <Speakable as="span" text="Upload a file" speak={speak} lang={lang} voices={voices}>Upload a file</Speakable>
                  <input id={id} name={name || id} type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <Speakable as="p" text="or drag and drop" speak={speak} lang={lang} voices={voices} className="pl-1">or drag and drop</Speakable>
              </div>
              <Speakable as="p" text="PNG, JPG, PDF up to 10MB" speak={speak} lang={lang} voices={voices} className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</Speakable>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Screens ---

const IntroScreen = ({ onFinish }) => {
  useEffect(() => {
    class AgrivelanAnimator {
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
        .intro-container { font-family: 'Roboto', Arial, sans-serif; min-height: 100vh; width: 100%; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #145214 0%, #2a7a2a 60%, #1f4e1f 100%); overflow: hidden; }
        .logo-container { padding: 50px 80px; position: relative; background: transparent; border-radius: 15px; }
        .logo { display: flex; align-items: baseline; font-size: 64px; font-weight: 700; position: relative; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        .agri-text { margin-right: 8px; color: white; z-index: 1; }
        .velan-container { position: relative; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; width: 190px; height: 60px; }
        .velan-text { color: #F4E03F; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; font-size: 46px; line-height: 1.1; position: relative; left: 0; z-index: 1; }
        @keyframes slideInRight { from { transform: translateX(100%) scale(0.8); opacity: 0; filter: blur(2px);} to { transform: translateX(0) scale(1); opacity: 1; filter: blur(0);} }
        @keyframes slideOutLeft { from { transform: translateX(0) scale(1); opacity: 1; filter: blur(0);} to { transform: translateX(-100%) scale(0.8); opacity: 0; filter: blur(2px);} }
        @keyframes glow { 0%, 100% { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); } 50% { text-shadow: 2px 2px 4px rgba(0,0,0,0.3), 0 0 20px #F4E03F; } }
        .slide-in { animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;}
        .slide-out { animation: slideOutLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;}
        .glow-effect { animation: glow 0.5s ease-in-out;}
        .font-english { font-family: 'Roboto', Arial, sans-serif; } .font-tamil { font-family: 'Noto Sans Tamil', sans-serif; } .font-hindi { font-family: 'Noto Sans Devanagari', sans-serif; } .font-telugu { font-family: 'Noto Sans Telugu', sans-serif; } .font-malayalam { font-family: 'Noto Sans Malayalam', sans-serif; } .font-kannada { font-family: 'Noto Sans Kannada', sans-serif; }
        @media (max-width: 768px) { .logo { font-size: 48px; } .velan-text { font-size: 30px; } .logo-container { padding: 40px 25px;} .velan-container { width: 120px; height: 40px;} }
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


const LanguageSelectionScreen = ({ onSelect, speak, voices }) => {
  const { isListening, startListening, stopListening } = useSpeechRecognition((transcript) => {
    const spokenLanguage = transcript.toLowerCase().trim();
    // Check for Tamil, Telugu, Malayalam, Kannada, Hindi, and English
    const langMap = {
      'tamil': 'ta', 'telugu': 'te', 'malayalam': 'ml',
      'kannada': 'kn', 'hindi': 'hi', 'english': 'en'
    };
    const recognizedCode = langMap[spokenLanguage];
    if (recognizedCode) {
      const confirmation = translations[recognizedCode].languageSelected;
      speak(confirmation, recognizedCode, voices);
      onSelect(recognizedCode);
    } else {
      speak("Sorry, I didn't recognize that language. Please try again.", 'en', voices);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center h-full bg-stone-100 p-4">
      <div className="flex items-center space-x-4 mb-10">
        <Speakable as="h1" text={translations.en.selectLanguage} speak={speak} lang="en" voices={voices} className="text-4xl font-bold text-stone-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {translations.en.selectLanguage}
        </Speakable>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-2xl">
        {languages.map(language => (
          <button
            key={language.code}
            onClick={() => {
              const confirmation = translations[language.code].languageSelected;
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
  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-stone-100 p-4">
      <BackButton onClick={onBack} />
      <Speakable as="h2" text={t.registerAs} speak={speak} lang={lang} voices={voices} className="text-4xl font-bold text-stone-800 mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.registerAs}</Speakable>
      <div className="space-y-6 w-full max-w-sm">
        <button
          onClick={() => { speak(t.farmer, lang, voices); onSelectRole('farmer'); }}
          className="w-full text-white bg-green-800 hover:bg-green-900 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-xl px-5 py-4 text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          {t.farmer}
        </button>
        <button
          onClick={() => { speak(t.buyer, lang, voices); onSelectRole('buyer'); }}
          className="w-full text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-xl px-5 py-4 text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          {t.buyer}
        </button>
      </div>
    </div>
  );
};

const RegistrationScreen = ({ t, role, onRegister, onSwitchToLogin, onBack, speak, lang, voices, onFileVerified }: any) => {
  const isFarmer = role === 'farmer';
  const title = t.registrationTitle(isFarmer ? t.farmer : t.buyer);
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [formDataState, setFormDataState] = useState<any>(null);

  const handleDetailsSubmit = (e: any) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    if (!formData.has('mobile')) {
      const mobileInput = formRef.current.querySelector('#mobile') as HTMLInputElement;
      if (mobileInput && mobileInput.value) {
        formData.append('mobile', mobileInput.value);
      }
    }

    const data = Object.fromEntries(formData.entries());

    if (!data.googleMail || !data.password || !data.mobile) {
      alert("Please fill in all required fields.");
      return;
    }
    if (data.password !== document.getElementById('confirmPassword').value) {
      alert("Passwords/PINs do not match.");
      return;
    }

    setFormDataState(data);

    // Bypass Face step, Register directly
    handleDirectRegister(data, role);
  };

  const handleDirectRegister = async (formData: any, userRole: any) => {
    setLoading(true);
    try {
      const cleanMobile = String(formData.mobile).trim();
      const cleanPin = String(formData.password).trim();
      const emailForAuth = `${cleanMobile}@agrivelan.com`;
      // 1. Authenticate FIRST (Required for Storage permissions)
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, emailForAuth, cleanPin);
      const user = userCredential.user;
      const newUid = user.uid;

      // 2. Upload Files in Parallel (Now that we are authenticated)
      // Helper to upload only if it's a valid file with size > 0
      const uploadFile = async (fileInput: any, path: string) => {
        if (fileInput && typeof fileInput !== 'string' && fileInput.size > 0) {
          return await api.uploadImage(fileInput, path);
        }
        return "";
      };

      const agriDocPromise = formData.agriDoc ? uploadFile(formData.agriDoc, `docs/${cleanMobile}/agriDoc`) : Promise.resolve("");
      const licensePromise = formData.businessLicense ? uploadFile(formData.businessLicense, `docs/${cleanMobile}/license`) : Promise.resolve("");

      // timeout if upload takes too long
      const uploadOrTimeout = Promise.all([agriDocPromise, licensePromise]);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("File upload timed out")), 20000));

      const [agriDocUrl, businessLicenseUrl] = await Promise.race([uploadOrTimeout, timeoutPromise]) as string[];

      const userData = {
        uid: newUid,
        fullName: formData.fullName,
        mobile: cleanMobile,
        role: userRole,
        pin: cleanPin,
        faceImage: "",
        faceEmbedding: null,
        location: formData.location,
        googleMail: formData.googleMail,
        aadhar: formData.aadhar,
        businessName: formData.businessName || '',
        businessType: formData.businessType || '',
        gst: formData.gst || '',
        businessAddress: formData.businessAddress || '',
        agriDoc: agriDocUrl,
        businessLicense: businessLicenseUrl,
        createdAt: new Date().toISOString()
      };

      // 2. Save to Firestore (Fast write)
      await setDoc(doc(db, "users", newUid), userData);

      localStorage.setItem('user_session', JSON.stringify(userData));
      onRegister(userData);

    } catch (error: any) {
      console.error("Registration Error:", error);
      let msg = error.message;
      if (msg.includes("email-already-in-use")) msg = "Mobile number registered.";
      if (msg.includes("permission-denied")) msg = "Database Permission Denied. Check Firestore Rules.";
      alert("Registration Failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-100">
      <BackButton onClick={onBack} />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Speakable as="h2" text={title} speak={speak} lang={lang} voices={voices} className="mt-6 text-center text-4xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {title}
        </Speakable>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-12">
          <form ref={formRef} className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleDetailsSubmit(e); }}>
            <InputField name="fullName" id="name" label={t.fullName} placeholder="John Doe" speak={speak} lang={lang} voices={voices} />
            <MobileVerificationField t={t} speak={speak} lang={lang} voices={voices} />
            <InputField name="location" id="location" label={t.location} placeholder="Your City" speak={speak} lang={lang} voices={voices} />
            <InputField name="aadhar" id="aadhar" label={t.aadharVerification} type="text" placeholder="XXXX XXXX XXXX" speak={speak} lang={lang} voices={voices} />
            <InputField name="googleMail" id="googleMail" label={t.googleMail} type="email" placeholder="you@example.com" speak={speak} lang={lang} voices={voices} />

            {isFarmer && <FileInputField name="agriDoc" id="agriDoc" label={t.uploadAgriDoc} speak={speak} lang={lang} voices={voices} onFileVerified={onFileVerified} />}

            {!isFarmer && (<>
              <InputField name="businessName" id="businessName" label={t.businessName} placeholder="Agri Traders Inc." speak={speak} lang={lang} voices={voices} />
              <InputField name="businessType" id="businessType" label={t.businessType} placeholder="Wholesaler, Retailer, etc." speak={speak} lang={lang} voices={voices} />
              <InputField name="gst" id="gst" label={t.gstNumber} placeholder="22AAAAA0000A1Z5" speak={speak} lang={lang} voices={voices} />
              <FileInputField name="businessLicense" id="businessLicense" label={t.uploadBusinessLicense} speak={speak} lang={lang} voices={voices} onFileVerified={() => { }} />
              <InputField name="businessAddress" id="businessAddress" label={t.businessAddress} placeholder="123 Market St, Your City" speak={speak} lang={lang} voices={voices} />
            </>)}

            <InputField name="password" id="password" label={t.password} type="password" speak={speak} lang={lang} voices={voices} />
            <InputField id="confirmPassword" label={t.confirmPassword} type="password" speak={speak} lang={lang} voices={voices} />

            <div>
              <button type="submit" disabled={loading} onClick={() => speak("Register", lang, voices)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:bg-gray-400">
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            <Speakable as="a" href="#" text={t.alreadyRegistered} speak={speak} lang={lang} voices={voices} onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} className="font-medium text-amber-600 hover:text-amber-500">
              {t.alreadyRegistered}
            </Speakable>
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ t, onLogin, onDemoLogin, onSwitchToRegister, onBack, speak, lang, voices, role, setUserData }: any) => {
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');

  const handleCredentialsSubmit = async (e: any) => {
    e.preventDefault();
    if (!mobile || !pin) {
      alert("Please enter Mobile Number and PIN");
      return;
    }

    const cleanMobile = mobile.trim();
    const cleanPin = pin.trim();

    // Also support hardcoded demo credentials
    if ((cleanMobile === '1234567890' && cleanPin === '123456')) {
      setLoading(true);
      setTimeout(() => {
        const userData = role === 'buyer' ? demoBuyer : demoUser;
        if (setUserData) setUserData(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        speak("Login Successful!", lang, voices);
        onDemoLogin();
        setLoading(false);
      }, 800);
    } else {
      setLoading(true);
      try {
        // 1. Find user email by mobile
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("mobile", "==", cleanMobile));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("User not found.");
        }

        const userData = querySnapshot.docs[0].data();

        // 2. Authenticate with Firebase Auth
        const emailForAuth = `${cleanMobile}@agrivelan.com`;
        const { signInWithEmailAndPassword } = await import('firebase/auth');

        await signInWithEmailAndPassword(auth, emailForAuth, cleanPin);

        // Login Success
        if (setUserData) setUserData(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        speak("Login Successful!", lang, voices);
        onLogin();

      } catch (e: any) {
        console.error("Login Error", e);
        let msg = e.message;
        if (msg.includes("auth/wrong-password") || msg.includes("auth/user-not-found") || msg.includes("invalid-credential")) {
          msg = "Invalid Mobile Number or PIN.";
        }
        alert("Login Error: " + msg);
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="relative min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-100">
      <BackButton onClick={onBack} />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Speakable as="h2" text={t.loginTitle} speak={speak} lang={lang} voices={voices} className="mt-6 text-center text-4xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.loginTitle}</Speakable>
        <Speakable as="p" text="Enter Mobile & PIN" speak={speak} lang={lang} voices={voices} className="mt-2 text-center text-sm text-gray-600">
          Please enter your registered mobile and PIN.
        </Speakable>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-12">

          <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
            <div>
              <Speakable as="label" htmlFor="mobile" text={t.mobileNumber} speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-gray-700">{t.mobileNumber}</Speakable>
              <input id="mobile" name="mobile" type="tel" required
                value={mobile} onChange={e => setMobile(e.target.value)}
                className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="999999999" />
            </div>

            <div>
              <Speakable as="label" htmlFor="pin" text="PIN (6 Digits)" speak={speak} lang={lang} voices={voices} className="block text-sm font-medium text-gray-700">PIN (6 Digits)</Speakable>
              <input id="pin" name="pin" type="password" required maxLength={6}
                value={pin} onChange={e => setPin(e.target.value)}
                className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="******" />
            </div>

            <div className="flex space-x-2">
              <button type="submit" disabled={loading} onClick={() => speak("Login", lang, voices)}
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:bg-gray-400">
                Login
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            <Speakable as="a" href="#" text={t.backToRegistration} speak={speak} lang={lang} voices={voices} onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }} className="font-medium text-amber-600 hover:text-amber-500">
              {t.backToRegistration}
            </Speakable>
          </p>
        </div>
      </div>
    </div>
  );
};


// --- Dashboard Components ---
const FarmerDashboard = ({ t, navigate, speak, lang, setLang, voices, isFarmerVerified, showModal, handleTrackOrder, userData, isDemoMode }: any) => {
  const [showIncomeChart, setShowIncomeChart] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
              Coimbatore, TN
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher lang={lang} setLang={setLang} languages={languages} />
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
            {mockMarketData.concat(mockMarketData).map((item, index) => (
              <div key={index} className="flex items-center space-x-1">
                <span className="font-bold text-gray-300">{item.name}:</span>
                <span className="font-semibold">{item.price}</span>
                <span className={`${item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                  {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '-'}
                </span>
                <span className="text-gray-500 hidden sm:inline">({item.predicted})</span>
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
            <Bar options={chartOptions} data={chartData} />
          </section>
        )}

        {/* 4. AI Camera Grading (Always Visible) */}
        <section className="bg-green-800 rounded-2xl shadow-xl p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">AI Camera Grading</h2>
            <p className="text-green-100 mb-6 text-sm">Take a picture of your produce to get an instant quality grade.</p>
            <button onClick={() => navigate('camera')} className="bg-white text-green-900 font-bold py-3 px-10 rounded-full shadow-lg hover:bg-gray-50 transition-colors transform active:scale-95">
              {t.capture}
            </button>
          </div>
        </section>

        {/* 5. My Posts */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t.myPosts}</h2>
          {loading ? <p className="text-center text-gray-400">Loading...</p> : (
            <div className="space-y-4">
              {posts.length === 0 && <p className="text-gray-400 text-sm italic">No posts yet.</p>}
              {posts.map(post => (
                <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{post.name || post.productName}</p>
                    <p className="text-xs text-gray-500">{post.quantity} | {post.price}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <span className="font-bold text-amber-600 text-sm">{post.rating}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Ongoing Orders */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t.ongoingOrders}</h2>
          <div className="space-y-3">
            {isDemoMode ? (
              mockUserOrders.filter(o => o.statusKey === 'ongoing').map(order => (
                <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-orange-200 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">{t[order.itemKey]}</p>
                    <p className="text-xs text-gray-500 mt-1">Buyer: Fresh Veggies Co. <span className="text-gray-300">|</span> <span className="font-mono">{order.id}</span></p>
                  </div>
                  <button onClick={() => handleTrackOrder(order)} className="bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-full shadow-md hover:bg-amber-600 transition-colors">
                    {t.trackOrder}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">No ongoing orders.</p>
            )}
          </div>
        </section>
      </main>

      {/* 7. Bottom Navigation */}
      {/* 7. Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-8 flex justify-between items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Active Item: Home (Velan AI) */}
        <button className="flex flex-col items-center space-y-1 text-green-700 w-16">
          <img
            src="https://pub-141831e61e69445289222976a15b6fb3.r2.dev/Image_to_url_V2/IMG_20251207_114151-removebg-preview-imagetourl.cloud-1769594503880-gn7kxd.png"
            alt="Velan AI"
            className="h-6 w-6 object-contain"
          />
          <span className="text-[10px] font-bold tracking-wide">VELAN AI</span>
        </button>

        {/* Inactive Item: Orders */}
        <button onClick={() => navigate('orders')} className="flex flex-col items-center space-y-1 text-gray-400 hover:text-gray-600 transition-colors w-16">
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

const OrdersScreen = ({ t, navigate, lang, setLang, userData, isDemoMode }: any) => {

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
        <LanguageSwitcher lang={lang} setLang={setLang} languages={languages} />
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
          productName: item.productName || item.name,
          // Simple logic to assign image based on name or default
          productImg: item.productImg || (item.name?.toLowerCase().includes('tomato')
            ? "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1000"
            : item.name?.toLowerCase().includes('carrot')
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

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden relative flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Discount/Offer Tag - absolute top left */}
      <div className="absolute top-0 left-0 bg-[#54b226] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
        15% OFF
      </div>

      <div onClick={() => onSelectProduct(product)} className="w-full h-32 p-4 flex items-center justify-center cursor-pointer bg-white">
        <img src={product.productImg} alt={product.productName} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300" />
      </div>

      <div className="p-3 flex flex-col flex-grow">
        {/* Time Badge */}
        <div className="flex items-center space-x-1 mb-1">
          <div className="bg-gray-100 rounded-md px-1.5 py-0.5 flex items-center">
            <svg className="w-3 h-3 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[10px] font-bold text-gray-600">12 MINS</span>
          </div>
        </div>

        <h3 className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 mb-1 h-9">
          {product.productName}
        </h3>

        <p className="text-xs text-gray-500 mb-3">1 kg</p>

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
  const [status, setStatus] = useState('capture');
  const [grade, setGrade] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [quantity, setQuantity] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (err) {
          console.error("Error accessing the camera:", err);
          showModal(t.cameraError);
          navigate('dashboard');
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
  }, [status, navigate, showModal, t.cameraError]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setStatus('detecting');
      speak(t.detecting, lang, voices);

      try {
        const blob = await (await fetch(imageDataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');

        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.detected) {
          const mapped = {
            name: data.productName,
            grade: data.grade,
            freshness: `${data.freshnessScore}% (${data.grade})`,
            expiry_days: data.estimatedExpiryDays
          };
          setDetectionResult(mapped);
          setGrade(mapped.grade);
          speak(`Detected ${mapped.name}. Grade ${mapped.grade}.`, lang, voices);
          setStatus('detected');
        } else {
          const reason = data.reason || "No produce detected.";
          showModal(reason);
          speak(reason, lang, voices);
          setStatus('capture');
        }
      } catch (err) {
        console.error(err);
        showModal("AI Service Error. Is backend running?");
        speak("Service Error.", lang, voices);
        setStatus('capture');
      }
    }
  };

  const handlePostSale = async () => {
    if (!quantity || !detectionResult) {
      speak("Please enter quantity", lang, voices);
      return;
    }

    try {
      // Calculate a random price for demo if not set
      // In real app, user might input rate
      const saleData = {
        name: detectionResult.name,
        grade: detectionResult.grade,
        freshness: detectionResult.freshness,
        expiry_days: detectionResult.expiry_days,
        quantity: parseFloat(quantity),
        farmerId: userData?.uid,
        farmerName: userData?.fullName || 'Unknown Farmer',
        location: userData?.location || 'Unknown Location',
        rate: Math.floor(Math.random() * 40) + 20, // Random rate 20-60
        timestamp: new Date().toISOString(),
        productName: detectionResult.name // consistent naming
      };

      await api.createPost(saleData);
      showModal(t.postedForSale);
      navigate('dashboard');
    } catch (e) {
      console.error(e);
      showModal(t.postedForSale);
      navigate('dashboard');
    }
  }

  return (
    <div className="relative bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
      <BackButton onClick={() => navigate('dashboard')} />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center">
        {status === 'capture' && (
          <>
            <h2 className="text-2xl font-bold mb-4">{t.cameraGrading}</h2>
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-6">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            </div>
            <button onClick={handleCapture} className="w-full bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
              {t.capture}
            </button>
          </>
        )}
        {status === 'detecting' && (
          <>
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6 animate-pulse">
              <img src={capturedImage || "https://placehold.co/400x300/e2e8f0/e2e8f0"} alt="Captured" className="rounded-lg max-h-full" />
            </div>
            <p className="text-xl font-semibold">{t.detecting}</p>
          </>
        )}
        {status === 'detected' && detectionResult && (
          <>
            <h2 className="text-2xl font-bold mb-2">{detectionResult.name} Detected!</h2>
            <p className="mb-4 text-gray-600">Freshness: {detectionResult.freshness} | Expiry: {detectionResult.expiry_days} days</p>
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
              <img src={capturedImage} alt="Detected Produce" className="rounded-lg max-h-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-100 p-4 rounded-lg">
                <p className="text-sm text-amber-800">{t.grade}</p>
                <p className="text-2xl font-bold">{detectionResult.grade}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="text-sm text-blue-800">{t.quantity}</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="kg"
                  className="text-2xl font-bold w-full bg-transparent text-center focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <button onClick={handlePostSale} disabled={!quantity} className="w-full bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {t.postForSale}
            </button>
          </>
        )}
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
        <LanguageSwitcher lang={lang} setLang={setLang} languages={languages} />
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
            <p><strong>{t.googleMail}:</strong> {userData?.googleMail || 'N/A'}</p>
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
            <Popup autoOpen>
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
            <p className="text-sm text-gray-500">#ORD790</p>
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

const ProductDetailScreen = ({ t, navigate, product, quantity, setQuantity }) => {
  if (!product) return null;
  return (
    <div className="bg-stone-100 min-h-screen">
      <header className="relative">
        <img src={product.productImg} alt={product.productName} className="w-full h-64 object-cover" />
        <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>
        <BackButton onClick={() => navigate('buyerDashboard')} />
      </header>
      <main className="p-6 bg-white rounded-t-3xl -mt-8 relative z-10 pb-28">
        <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
        <p className="text-gray-500 mt-1">{product.farmerName} - {product.location}</p>
        <div className="flex items-center space-x-1 text-amber-500 my-3">
          <span className="font-bold text-lg">{product.rating}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        </div>
        <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

        <div className="flex items-center justify-between mt-6">
          <div>
            <p className="text-gray-500 text-sm">Total Price</p>
            <p className="text-3xl font-bold text-green-700">₹{product.rate * quantity}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-300 transition">-</button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-300 transition">+</button>
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

const CheckoutScreen = ({ t, navigate, product, quantity, showModal }) => {
  const [transport, setTransport] = useState('onlineVendor');
  const [payment, setPayment] = useState('onlinePayment');

  const handleConfirmOrder = () => {
    if (payment === 'onlinePayment') {
      navigate('paymentPartners');
    } else {
      showModal(t.orderConfirmed);
      // After COD confirmation, go to tracker
      navigate('liveMapTracker');
    }
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

// --- The Main App Component ---
export default function App() {
  const [history, setHistory] = useState(['splash']);
  const [lang, setLang] = useState('en');
  const [role, setRole] = useState(null); // farmer, buyer
  const [voices, setVoices] = useState([]);
  const [isFarmerVerified, setIsFarmerVerified] = useState(false);
  const [userData, setUserData] = useState(null); // Can hold data for farmer or buyer
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
    // Also check local storage for simplified flow fallback
    const storedUser = localStorage.getItem('user_session');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (!userData) setUserData(parsed);
        // If we have data, we stay logged in
      } catch (e) { console.error(e); }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData(data);
            setRole(data.role);
            if (data.role === 'farmer' && data.agriDoc) {
              setIsFarmerVerified(true);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
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
  const t = translations[lang];

  const navigate = (newView) => {
    if (view === newView) return;
    setHistory(prev => [...prev, newView]);
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const navigateAndReset = (newView, baseView) => {
    setHistory([baseView, newView]);
  }

  const handleSelectLanguage = (langCode) => {
    setLang(langCode);
    navigate('role');
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    navigate('register');
  };

  const handleRegistration = (data) => {
    setUserData(data);
    navigate('login');
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
    navigate('language');
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

  const renderView = () => {
    switch (view) {
      case 'splash': return <IntroScreen onFinish={() => navigate('language')} />;
      case 'language': return <LanguageSelectionScreen onSelect={handleSelectLanguage} speak={speakText} voices={voices} />;
      case 'role': return <RoleSelectionScreen t={t} onSelectRole={handleSelectRole} onBack={handleBack} speak={speakText} lang={lang} voices={voices} />;
      case 'register': return <RegistrationScreen t={t} role={role} onRegister={handleRegistration} onSwitchToLogin={() => navigate('login')} onBack={handleBack} speak={speakText} lang={lang} voices={voices} onFileVerified={setIsFarmerVerified} />;
      case 'login': return <LoginScreen t={t} role={role} onLogin={handleLogin} onDemoLogin={handleDemoLogin} onSwitchToRegister={() => navigate('role')} onBack={handleBack} speak={speakText} lang={lang} voices={voices} setUserData={setUserData} />;
      case 'dashboard': return <FarmerDashboard t={t} navigate={navigate} speak={speakText} lang={lang} setLang={setLang} voices={voices} isFarmerVerified={isFarmerVerified} showModal={showModal} handleTrackOrder={handleTrackOrder} userData={userData} isDemoMode={isDemoMode} />;
      case 'orders': return <OrdersScreen t={t} navigate={navigate} lang={lang} setLang={setLang} userData={userData} isDemoMode={isDemoMode} />;
      case 'buyerDashboard': return <BuyerContainer t={t} navigate={navigate} onSelectProduct={handleSelectProduct} buyerData={userData} lang={lang} setLang={setLang} handleTrackOrder={handleTrackOrder} isDemoMode={isDemoMode} />;
      case 'camera': return <CameraScreen t={t} navigate={navigate} speak={speakText} lang={lang} voices={voices} showModal={showModal} userData={userData} />;
      case 'profile': return <ProfileScreen t={t} navigate={navigate} isFarmerVerified={isFarmerVerified} userData={userData} setUserData={setUserData} role="farmer" lang={lang} setLang={setLang} onLogout={handleLogout} />;
      case 'buyerProfile': return <ProfileScreen t={t} navigate={navigate} isFarmerVerified={false} userData={userData} setUserData={setUserData} role="buyer" lang={lang} setLang={setLang} onLogout={handleLogout} />;
      case 'liveMapTracker': return <LiveMapTrackerScreen t={t} navigate={navigate} handleBack={handleBack} product={selectedProduct || mockBuyerFeed[1]} buyerLocation={{ lat: 11.0568, lng: 77.0558 }} showModal={showModal} />;
      case 'productDetail': return <ProductDetailScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} setQuantity={setOrderQuantity} />;
      case 'checkout': return <CheckoutScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} showModal={showModal} />;
      case 'paymentPartners': return <PaymentPartnerScreen t={t} navigate={navigate} onSelectPartner={handleSelectPartner} />;
      case 'simulatedPayment': return <SimulatedPaymentScreen t={t} navigate={navigate} product={selectedProduct} quantity={orderQuantity} partner={paymentPartner} onPaymentSuccess={handlePaymentSuccess} />;
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