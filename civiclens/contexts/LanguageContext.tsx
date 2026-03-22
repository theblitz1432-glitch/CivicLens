'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Bengali' | 'Gujarati' | 'Punjabi' | 'Kannada' | 'Malayalam' | 'Marathi';

const translations: Record<Language, Record<string, string>> = {
  English: {
    welcome: 'Welcome', overview: 'Overview', map: 'Live Map', complaints: 'Complaints',
    analytics: 'Analytics', settings: 'Settings', fileComplaint: 'FILE A COMPLAINT',
    registerComplaint: 'Register Complaint', trackComplaint: 'Track Complaints',
    ongoingProjects: 'Ongoing Projects', authorityDetails: 'Authority Details',
    submitComplaint: 'Submit Complaint', category: 'Category', description: 'Description',
    photoEvidence: 'Photo Evidence', locationAttached: 'Location attached automatically',
    myComplaints: 'My Complaints', home: 'Home', complaint: 'Complaint', updates: 'Updates',
    profile: 'Profile', logout: 'Logout', deleteAccount: 'Delete Account',
    changePassword: 'Change Password', theme: 'Theme', language: 'App Language',
    notifications: 'Push Notifications', voiceAssistant: 'Voice Assistant',
    takePhoto: 'Take Photo', noProjects: 'No projects found', noAuthority: 'No authorities found',
    total: 'Total', resolved: 'Resolved', inProgress: 'In Progress', pending: 'Pending',
    submitted: 'Submitted', done: 'Done', active: 'Active', refresh: 'Refresh',
    aiVerified: 'AI verified for authenticity', photoRequired: 'Camera required for verification',
    notifyAuth: 'Auto-notifies authority', development: 'Development',
  },
  Hindi: {
    welcome: 'स्वागत है', overview: 'अवलोकन', map: 'लाइव मैप', complaints: 'शिकायतें',
    analytics: 'विश्लेषण', settings: 'सेटिंग्स', fileComplaint: 'शिकायत दर्ज करें',
    registerComplaint: 'शिकायत दर्ज करें', trackComplaint: 'शिकायत ट्रैक करें',
    ongoingProjects: 'चल रहे प्रोजेक्ट', authorityDetails: 'अधिकारी विवरण',
    submitComplaint: 'शिकायत सबमिट करें', category: 'श्रेणी', description: 'विवरण',
    photoEvidence: 'फोटो साक्ष्य', locationAttached: 'स्थान स्वचालित रूप से जुड़ा',
    myComplaints: 'मेरी शिकायतें', home: 'होम', complaint: 'शिकायत', updates: 'अपडेट',
    profile: 'प्रोफ़ाइल', logout: 'लॉगआउट', deleteAccount: 'खाता हटाएं',
    changePassword: 'पासवर्ड बदलें', theme: 'थीम', language: 'ऐप भाषा',
    notifications: 'पुश नोटिफिकेशन', voiceAssistant: 'वॉयस असिस्टेंट',
    takePhoto: 'फोटो लें', noProjects: 'कोई प्रोजेक्ट नहीं मिला', noAuthority: 'कोई अधिकारी नहीं मिला',
    total: 'कुल', resolved: 'हल किया', inProgress: 'प्रगति में', pending: 'लंबित',
    submitted: 'सबमिट किया', done: 'पूर्ण', active: 'सक्रिय', refresh: 'रिफ्रेश',
    aiVerified: 'AI द्वारा प्रमाणित', photoRequired: 'सत्यापन के लिए कैमरा आवश्यक',
    notifyAuth: 'अधिकारी को स्वचालित सूचना', development: 'विकास कार्य',
  },
  Punjabi: {
    welcome: 'ਸੁਆਗਤ ਹੈ', overview: 'ਸੰਖੇਪ', map: 'ਲਾਈਵ ਨਕਸ਼ਾ', complaints: 'ਸ਼ਿਕਾਇਤਾਂ',
    analytics: 'ਵਿਸ਼ਲੇਸ਼ਣ', settings: 'ਸੈਟਿੰਗਜ਼', fileComplaint: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
    registerComplaint: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ', trackComplaint: 'ਸ਼ਿਕਾਇਤ ਟਰੈਕ ਕਰੋ',
    ongoingProjects: 'ਚੱਲ ਰਹੇ ਪ੍ਰੋਜੈਕਟ', authorityDetails: 'ਅਧਿਕਾਰੀ ਵੇਰਵੇ',
    submitComplaint: 'ਸ਼ਿਕਾਇਤ ਜਮ੍ਹਾ ਕਰੋ', category: 'ਸ਼੍ਰੇਣੀ', description: 'ਵੇਰਵਾ',
    photoEvidence: 'ਫੋਟੋ ਸਬੂਤ', locationAttached: 'ਟਿਕਾਣਾ ਆਪਣੇ ਆਪ ਜੁੜਿਆ',
    myComplaints: 'ਮੇਰੀਆਂ ਸ਼ਿਕਾਇਤਾਂ', home: 'ਹੋਮ', complaint: 'ਸ਼ਿਕਾਇਤ', updates: 'ਅਪਡੇਟ',
    profile: 'ਪ੍ਰੋਫਾਈਲ', logout: 'ਲੌਗਆਉਟ', deleteAccount: 'ਖਾਤਾ ਮਿਟਾਓ',
    changePassword: 'ਪਾਸਵਰਡ ਬਦਲੋ', theme: 'ਥੀਮ', language: 'ਐਪ ਭਾਸ਼ਾ',
    notifications: 'ਪੁਸ਼ ਨੋਟੀਫਿਕੇਸ਼ਨ', voiceAssistant: 'ਵੌਇਸ ਅਸਿਸਟੈਂਟ',
    takePhoto: 'ਫੋਟੋ ਲਓ', noProjects: 'ਕੋਈ ਪ੍ਰੋਜੈਕਟ ਨਹੀਂ', noAuthority: 'ਕੋਈ ਅਧਿਕਾਰੀ ਨਹੀਂ',
    total: 'ਕੁੱਲ', resolved: 'ਹੱਲ ਹੋਇਆ', inProgress: 'ਪ੍ਰਗਤੀ ਵਿੱਚ', pending: 'ਬਕਾਇਆ',
    submitted: 'ਜਮ੍ਹਾ ਕੀਤਾ', done: 'ਪੂਰਾ', active: 'ਸਰਗਰਮ', refresh: 'ਤਾਜ਼ਾ ਕਰੋ',
    aiVerified: 'AI ਦੁਆਰਾ ਤਸਦੀਕ', photoRequired: 'ਤਸਦੀਕ ਲਈ ਕੈਮਰਾ ਜ਼ਰੂਰੀ',
    notifyAuth: 'ਅਧਿਕਾਰੀ ਨੂੰ ਆਪਣੇ ਆਪ ਸੂਚਿਤ', development: 'ਵਿਕਾਸ ਕਾਰਜ',
  },
  Tamil: {
    welcome: 'வரவேற்கிறோம்', overview: 'கண்ணோட்டம்', map: 'நேரடி வரைபடம்', complaints: 'புகார்கள்',
    analytics: 'பகுப்பாய்வு', settings: 'அமைப்புகள்', fileComplaint: 'புகார் செய்யுங்கள்',
    registerComplaint: 'புகார் பதிவு செய்யுங்கள்', trackComplaint: 'புகாரை கண்காணி',
    ongoingProjects: 'நடந்துவரும் திட்டங்கள்', authorityDetails: 'அதிகாரி விவரங்கள்',
    submitComplaint: 'புகார் சமர்ப்பி', category: 'வகை', description: 'விளக்கம்',
    photoEvidence: 'புகைப்பட சான்று', locationAttached: 'இடம் தானாக இணைக்கப்பட்டது',
    myComplaints: 'என் புகார்கள்', home: 'முகப்பு', complaint: 'புகார்', updates: 'புதுப்பிப்புகள்',
    profile: 'சுயவிவரம்', logout: 'வெளியேறு', deleteAccount: 'கணக்கை நீக்கு',
    changePassword: 'கடவுச்சொல் மாற்று', theme: 'தீம்', language: 'ஆப் மொழி',
    notifications: 'அறிவிப்புகள்', voiceAssistant: 'குரல் உதவியாளர்',
    takePhoto: 'புகைப்படம் எடு', noProjects: 'திட்டங்கள் இல்லை', noAuthority: 'அதிகாரிகள் இல்லை',
    total: 'மொத்தம்', resolved: 'தீர்க்கப்பட்டது', inProgress: 'நடந்துகொண்டிருக்கிறது', pending: 'நிலுவையில்',
    submitted: 'சமர்ப்பிக்கப்பட்டது', done: 'முடிந்தது', active: 'செயலில்', refresh: 'புதுப்பி',
    aiVerified: 'AI மூலம் சரிபார்க்கப்பட்டது', photoRequired: 'சரிபார்ப்புக்கு கேமரா தேவை',
    notifyAuth: 'அதிகாரிக்கு தானாக அறிவிப்பு', development: 'வளர்ச்சி பணிகள்',
  },
  Telugu: {
    welcome: 'స్వాగతం', overview: 'అవలోకనం', map: 'లైవ్ మ్యాప్', complaints: 'ఫిర్యాదులు',
    analytics: 'విశ్లేషణ', settings: 'సెట్టింగ్‌లు', fileComplaint: 'ఫిర్యాదు నమోదు చేయండి',
    registerComplaint: 'ఫిర్యాదు నమోదు', trackComplaint: 'ఫిర్యాదు ట్రాక్ చేయండి',
    ongoingProjects: 'జరుగుతున్న ప్రాజెక్టులు', authorityDetails: 'అధికారి వివరాలు',
    submitComplaint: 'ఫిర్యాదు సమర్పించండి', category: 'వర్గం', description: 'వివరణ',
    photoEvidence: 'ఫోటో సాక్ష్యం', locationAttached: 'స్థానం స్వయంచాలకంగా జతచేయబడింది',
    myComplaints: 'నా ఫిర్యాదులు', home: 'హోమ్', complaint: 'ఫిర్యాదు', updates: 'అప్‌డేట్‌లు',
    profile: 'ప్రొఫైల్', logout: 'లాగ్అవుట్', deleteAccount: 'ఖాతా తొలగించండి',
    changePassword: 'పాస్‌వర్డ్ మార్చండి', theme: 'థీమ్', language: 'యాప్ భాష',
    notifications: 'నోటిఫికేషన్లు', voiceAssistant: 'వాయిస్ అసిస్టెంట్',
    takePhoto: 'ఫోటో తీయండి', noProjects: 'ప్రాజెక్టులు లేవు', noAuthority: 'అధికారులు లేరు',
    total: 'మొత్తం', resolved: 'పరిష్కరించబడింది', inProgress: 'జరుగుతోంది', pending: 'పెండింగ్',
    submitted: 'సమర్పించబడింది', done: 'పూర్తయింది', active: 'క్రియాశీలం', refresh: 'రిఫ్రెష్',
    aiVerified: 'AI ద్వారా ధృవీకరించబడింది', photoRequired: 'ధృవీకరణకు కెమెరా అవసరం',
    notifyAuth: 'అధికారికి స్వయంచాలకంగా తెలియజేయండి', development: 'అభివృద్ధి పనులు',
  },
  Bengali: { welcome: 'স্বাগতম', overview: 'সারসংক্ষেপ', map: 'লাইভ ম্যাপ', complaints: 'অভিযোগ', analytics: 'বিশ্লেষণ', settings: 'সেটিংস', fileComplaint: 'অভিযোগ দায়ের করুন', registerComplaint: 'অভিযোগ নথিভুক্ত করুন', trackComplaint: 'অভিযোগ ট্র্যাক করুন', ongoingProjects: 'চলমান প্রকল্প', authorityDetails: 'কর্তৃপক্ষের বিবরণ', submitComplaint: 'অভিযোগ জমা দিন', category: 'বিভাগ', description: 'বিবরণ', photoEvidence: 'ফটো প্রমাণ', locationAttached: 'অবস্থান স্বয়ংক্রিয়ভাবে সংযুক্ত', myComplaints: 'আমার অভিযোগ', home: 'হোম', complaint: 'অভিযোগ', updates: 'আপডেট', profile: 'প্রোফাইল', logout: 'লগআউট', deleteAccount: 'অ্যাকাউন্ট মুছুন', changePassword: 'পাসওয়ার্ড পরিবর্তন', theme: 'থিম', language: 'অ্যাপ ভাষা', notifications: 'বিজ্ঞপ্তি', voiceAssistant: 'ভয়েস সহকারী', takePhoto: 'ছবি তুলুন', noProjects: 'কোনো প্রকল্প নেই', noAuthority: 'কোনো কর্তৃপক্ষ নেই', total: 'মোট', resolved: 'সমাধান হয়েছে', inProgress: 'চলছে', pending: 'মুলতুবি', submitted: 'জমা দেওয়া হয়েছে', done: 'সম্পন্ন', active: 'সক্রিয়', refresh: 'রিফ্রেশ', aiVerified: 'AI দ্বারা যাচাইকৃত', photoRequired: 'যাচাইয়ের জন্য ক্যামেরা প্রয়োজন', notifyAuth: 'কর্তৃপক্ষকে স্বয়ংক্রিয় বিজ্ঞপ্তি', development: 'উন্নয়নমূলক কাজ' },
  Gujarati: { welcome: 'સ્વાગત છે', overview: 'ઝાંખી', map: 'લાઇવ નકશો', complaints: 'ફરિયાદો', analytics: 'વિશ્લેષણ', settings: 'સેટિંગ્સ', fileComplaint: 'ફરિયાદ નોંધો', registerComplaint: 'ફરિયાદ નોંધો', trackComplaint: 'ફરિયાદ ટ્રૅક કરો', ongoingProjects: 'ચાલુ પ્રોજેક્ટ', authorityDetails: 'અધિકારી વિગતો', submitComplaint: 'ફરિયાદ સબમિટ કરો', category: 'શ્રેણી', description: 'વર્ણન', photoEvidence: 'ફોટો પુરાવો', locationAttached: 'સ્થાન આપોઆપ જોડાયું', myComplaints: 'મારી ફરિયાદો', home: 'હોમ', complaint: 'ફરિયાદ', updates: 'અપડેટ', profile: 'પ્રોફાઇલ', logout: 'લૉગઆઉટ', deleteAccount: 'એકાઉન્ટ ડિલીટ', changePassword: 'પાસવર્ડ બદલો', theme: 'થીમ', language: 'એપ ભાષા', notifications: 'સૂચનાઓ', voiceAssistant: 'વૉઇસ સહાયક', takePhoto: 'ફોટો લો', noProjects: 'કોઈ પ્રોજેક્ટ નથી', noAuthority: 'કોઈ અધિકારી નથી', total: 'કુલ', resolved: 'ઉકેલ્યું', inProgress: 'ચાલી રહ્યું', pending: 'બાકી', submitted: 'સબમિટ', done: 'પૂર્ણ', active: 'સક્રિય', refresh: 'રિફ્રેશ', aiVerified: 'AI દ્વારા ચકાસાયેલ', photoRequired: 'ચકાસણી માટે કેમેરો જરૂરી', notifyAuth: 'અધિકારીને આપોઆપ સૂચના', development: 'વિકાસ કાર્ય' },
  Kannada: { welcome: 'ಸ್ವಾಗತ', overview: 'ಅವಲೋಕನ', map: 'ಲೈವ್ ನಕ್ಷೆ', complaints: 'ದೂರುಗಳು', analytics: 'ವಿಶ್ಲೇಷಣೆ', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', fileComplaint: 'ದೂರು ದಾಖಲಿಸಿ', registerComplaint: 'ದೂರು ನೋಂದಾಯಿಸಿ', trackComplaint: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', ongoingProjects: 'ನಡೆಯುತ್ತಿರುವ ಯೋಜನೆಗಳು', authorityDetails: 'ಅಧಿಕಾರಿ ವಿವರಗಳು', submitComplaint: 'ದೂರು ಸಲ್ಲಿಸಿ', category: 'ವರ್ಗ', description: 'ವಿವರಣೆ', photoEvidence: 'ಫೋಟೋ ಸಾಕ್ಷ್ಯ', locationAttached: 'ಸ್ಥಳ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ', myComplaints: 'ನನ್ನ ದೂರುಗಳು', home: 'ಮುಖಪುಟ', complaint: 'ದೂರು', updates: 'ಅಪ್‌ಡೇಟ್‌ಗಳು', profile: 'ಪ್ರೊಫೈಲ್', logout: 'ಲಾಗ್‌ಔಟ್', deleteAccount: 'ಖಾತೆ ಅಳಿಸಿ', changePassword: 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ', theme: 'ಥೀಮ್', language: 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ', notifications: 'ಅಧಿಸೂಚನೆಗಳು', voiceAssistant: 'ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್', takePhoto: 'ಫೋಟೋ ತೆಗೆಯಿರಿ', noProjects: 'ಯಾವುದೇ ಯೋಜನೆಗಳಿಲ್ಲ', noAuthority: 'ಯಾವುದೇ ಅಧಿಕಾರಿಗಳಿಲ್ಲ', total: 'ಒಟ್ಟು', resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ', inProgress: 'ನಡೆಯುತ್ತಿದೆ', pending: 'ಬಾಕಿ', submitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ', done: 'ಮುಗಿದಿದೆ', active: 'ಸಕ್ರಿಯ', refresh: 'ರಿಫ್ರೆಶ್', aiVerified: 'AI ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗಿದೆ', photoRequired: 'ಪರಿಶೀಲನೆಗೆ ಕ್ಯಾಮೆರಾ ಅಗತ್ಯ', notifyAuth: 'ಅಧಿಕಾರಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಸೂಚನೆ', development: 'ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳು' },
  Malayalam: { welcome: 'സ്വാഗതം', overview: 'അവലോകനം', map: 'തത്സമയ ഭൂപടം', complaints: 'പരാതികൾ', analytics: 'വിശകലനം', settings: 'ക്രമീകരണങ്ങൾ', fileComplaint: 'പരാതി നൽകുക', registerComplaint: 'പരാതി രജിസ്റ്റർ ചെയ്യുക', trackComplaint: 'പരാതി ട്രാക്ക് ചെയ്യുക', ongoingProjects: 'നടന്നുകൊണ്ടിരിക്കുന്ന പദ്ധതികൾ', authorityDetails: 'അധികാരി വിവരങ്ങൾ', submitComplaint: 'പരാതി സമർപ്പിക്കുക', category: 'വിഭാഗം', description: 'വിവരണം', photoEvidence: 'ഫോട്ടോ തെളിവ്', locationAttached: 'സ്ഥലം സ്വയം ഘടിപ്പിച്ചു', myComplaints: 'എന്റെ പരാതികൾ', home: 'ഹോം', complaint: 'പരാതി', updates: 'അപ്‌ഡേറ്റുകൾ', profile: 'പ്രൊഫൈൽ', logout: 'ലോഗ്ഔട്ട്', deleteAccount: 'അക്കൗണ്ട് ഇല്ലാതാക്കുക', changePassword: 'പാസ്‌വേഡ് മാറ്റുക', theme: 'തീം', language: 'ആപ്പ് ഭാഷ', notifications: 'അറിയിപ്പുകൾ', voiceAssistant: 'വോയ്‌സ് അസിസ്റ്റന്റ്', takePhoto: 'ഫോട്ടോ എടുക്കുക', noProjects: 'പദ്ധതികൾ ഇല്ല', noAuthority: 'അധികാരികൾ ഇല്ല', total: 'ആകെ', resolved: 'പരിഹരിച്ചു', inProgress: 'പുരോഗതിയിൽ', pending: 'തീർപ്പാക്കിയിട്ടില്ല', submitted: 'സമർപ്പിച്ചു', done: 'പൂർത്തിയായി', active: 'സജീവം', refresh: 'പുതുക്കുക', aiVerified: 'AI സ്ഥിരീകരിച്ചു', photoRequired: 'സ്ഥിരീകരണത്തിന് ക്യാമറ ആവശ്യം', notifyAuth: 'അധികാരിക്ക് സ്വയം അറിയിപ്പ്', development: 'വികസന പ്രവർത്തനങ്ങൾ' },
  Marathi: { welcome: 'स्वागत आहे', overview: 'आढावा', map: 'लाइव्ह नकाशा', complaints: 'तक्रारी', analytics: 'विश्लेषण', settings: 'सेटिंग्ज', fileComplaint: 'तक्रार नोंदवा', registerComplaint: 'तक्रार नोंदणी', trackComplaint: 'तक्रार ट्रॅक करा', ongoingProjects: 'चालू प्रकल्प', authorityDetails: 'अधिकारी तपशील', submitComplaint: 'तक्रार सबमिट करा', category: 'श्रेणी', description: 'वर्णन', photoEvidence: 'फोटो पुरावा', locationAttached: 'स्थान आपोआप जोडले', myComplaints: 'माझ्या तक्रारी', home: 'होम', complaint: 'तक्रार', updates: 'अपडेट', profile: 'प्रोफाइल', logout: 'लॉगआउट', deleteAccount: 'खाते हटवा', changePassword: 'पासवर्ड बदला', theme: 'थीम', language: 'अ‍ॅप भाषा', notifications: 'सूचना', voiceAssistant: 'व्हॉइस असिस्टंट', takePhoto: 'फोटो काढा', noProjects: 'कोणतेही प्रकल्प नाहीत', noAuthority: 'कोणतेही अधिकारी नाहीत', total: 'एकूण', resolved: 'सोडवले', inProgress: 'प्रगतीत', pending: 'प्रलंबित', submitted: 'सबमिट केले', done: 'पूर्ण', active: 'सक्रिय', refresh: 'रिफ्रेश', aiVerified: 'AI द्वारे सत्यापित', photoRequired: 'सत्यापनासाठी कॅमेरा आवश्यक', notifyAuth: 'अधिकाऱ्यास आपोआप सूचना', development: 'विकास कामे' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('civiclens_language') as Language;
      if (saved && translations[saved]) setLanguageState(saved);
    } catch {}
  }, []);

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    try { localStorage.setItem('civiclens_language', l); } catch {}
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['English']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);