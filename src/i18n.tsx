import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Supported Languages ───
export type Lang = 'en' | 'mr' | 'hi';

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  mr: 'मराठी',
  hi: 'हिन्दी',
};

// ─── Translation Dictionaries ───
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.lodge': 'Lodge',
    'nav.tracking': 'Tracking',
    'nav.summary': 'Summary',
    'nav.manage': 'Manage',
    'nav.departments': 'Departments',
    'nav.analytics': 'Analytics',
    'nav.manageIssues': 'Manage Issues',
    'nav.officers': 'Officers',
    'nav.signOut': 'Sign Out',
    'nav.darkMode': 'Dark Mode',
    'nav.lightMode': 'Light Mode',

    // Landing
    'landing.hero.title1': 'Smart',
    'landing.hero.title2': 'Nagrik',
    'landing.hero.title3': 'Seva',

    // Login
    'login.title': 'Welcome Back',
    'login.subtitle': 'Access the civic grievance portal',
    'login.email': 'Email Address',
    'login.password': 'Secure Password',
    'login.forgot': 'Forgot your password?',
    'login.submit': 'SIGN IN',
    'login.newUser': 'New to Smart Nagrik Seva?',
    'login.createAccount': 'Create an account',

    // Citizen Dashboard
    'citizen.welcome': 'Namaste',
    'citizen.portal': 'Citizen Portal',
    'citizen.subtitle': 'Your active participation drives the development of a smarter, cleaner, and more transparent city.',
    'citizen.reportIssue': 'Report Issue',
    'citizen.trackIssues': 'Track Issues',
    'citizen.recentActivity': 'Recent Activity',
    'citizen.viewAll': 'View All',
    'citizen.noComplaints': 'No active complaints found.',
    'citizen.noComplaintsHint': 'Report civic issues to see them tracked here.',
    'citizen.cityServices': 'City Services',
    'citizen.needHelp': 'Need Assistance?',
    'citizen.helpText': 'Contact the 24/7 civic helpdesk for urgent utility failures.',
    'citizen.helpline': 'Call 1913 Helpline',

    // Complaint Tracking
    'track.title': 'Track Grievances',
    'track.subtitle': 'Real-time monitoring and lifecycle tracking of your reported civic issues.',
    'track.citizenDashboard': 'Citizen Dashboard',
    'track.all': 'all',
    'track.active': 'active',
    'track.resolved': 'resolved',
    'track.noGrievances': 'No grievances found for your profile.',
    'track.noGrievancesHint': 'Adjust your filters or lodge a new complaint.',
    'track.viewDetails': 'View Full Details',
    'track.confirmResolution': 'Confirm Resolution',

    // Admin Dashboard
    'admin.welcome': 'Welcome back',
    'admin.sysAdmin': 'System Administrator',
    'admin.deptOfficial': 'Department Official',
    'admin.subtitle': 'Monitor real-time civic issues and performance metrics.',
    'admin.manageGrievances': 'Manage Grievances',
    'admin.pendingGrievances': 'Pending Grievances',
    'admin.resolvedCases': 'Resolved Cases',
    'admin.escalatedIssues': 'Escalated Issues',
    'admin.slaBreach': 'SLA Breached',
    'admin.recentLodged': 'Recently Lodged Grievances',
    'admin.viewAll': 'View All',
    'admin.noComplaints': 'No complaints logged yet.',
    'admin.zoneComplaints': 'Zone Complaints',
    'admin.auditLog': 'System Audit Log',
    'admin.noActivity': 'No activity recorded',

    // Complaint Management
    'manage.title': 'Manage Grievances',
    'manage.adminControl': 'Administrative Control',
    'manage.subtitle': 'Centralized grievance lifecycle tracking and resolution center.',
    'manage.list': 'LIST',
    'manage.geoMap': 'GEO MAP',
    'manage.dupMgmt': 'Duplicate Management',
    'manage.dupDesc': 'Auto-scan active complaints for geographical & textual similarities.',
    'manage.globalScan': 'Global Scan',
    'manage.allComplaints': 'ALL COMPLAINTS',
    'manage.pending': 'PENDING (ACTIVE)',
    'manage.resolvedFilter': 'RESOLVED',
    'manage.closedRejected': 'CLOSED / REJECTED',
    'manage.incident': 'Incident',
    'manage.status': 'Status',
    'manage.priority': 'Priority',
    'manage.dateLodged': 'Date Lodged',
    'manage.action': 'Action',
    'manage.noResults': 'No complaints match your current filters.',

    // Analytics
    'analytics.title': 'Grievance',
    'analytics.title2': 'Analytics',
    'analytics.badge': 'Performance Intelligence',
    'analytics.subtitle': 'Live data analytics and SLA compliance metrics.',
    'analytics.clickHint': 'Click any card below to view those complaints.',
    'analytics.totalComplaints': 'Total Complaints',
    'analytics.overdueSla': 'Overdue SLA',
    'analytics.totalResolved': 'Total Resolved',
    'analytics.completionRate': 'Completion Rate',
    'analytics.trend': 'Daily Complaint Trends',
    'analytics.catDist': 'Category Distribution',
    'analytics.heatmap': 'Geographic Incident Heatmap',
    'analytics.heatmapDesc': 'Complaint density across the region — red zones have the highest complaint concentration.',
    'analytics.density': 'Density:',
    'analytics.low': 'Low',
    'analytics.med': 'Med',
    'analytics.high': 'High',
    'analytics.veryHigh': 'Very High',
    'analytics.critical': 'Critical',
    'analytics.zoneLoad': 'Zone Load Distribution',

    // General
    'general.loading': 'Loading...',
    'general.save': 'Save',
    'general.cancel': 'Cancel',
    'general.confirm': 'Confirm',
    'general.delete': 'Delete',
    'general.edit': 'Edit',
    'general.submit': 'Submit',
    'general.search': 'Search...',
  },

  mr: {
    // Nav
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.lodge': 'तक्रार',
    'nav.tracking': 'ट्रॅकिंग',
    'nav.summary': 'सारांश',
    'nav.manage': 'व्यवस्थापन',
    'nav.departments': 'विभाग',
    'nav.analytics': 'विश्लेषण',
    'nav.manageIssues': 'समस्या व्यवस्थापन',
    'nav.officers': 'अधिकारी',
    'nav.signOut': 'बाहेर पडा',
    'nav.darkMode': 'गडद मोड',
    'nav.lightMode': 'उजळ मोड',

    // Landing
    'landing.hero.title1': 'स्मार्ट',
    'landing.hero.title2': 'नागरिक',
    'landing.hero.title3': 'सेवा',

    // Login
    'login.title': 'पुन्हा स्वागत',
    'login.subtitle': 'नागरिक तक्रार पोर्टलमध्ये प्रवेश करा',
    'login.email': 'ईमेल पत्ता',
    'login.password': 'सुरक्षित पासवर्ड',
    'login.forgot': 'पासवर्ड विसरलात?',
    'login.submit': 'साइन इन करा',
    'login.newUser': 'स्मार्ट नागरिक सेवा मध्ये नवीन?',
    'login.createAccount': 'खाते तयार करा',

    // Citizen Dashboard
    'citizen.welcome': 'नमस्कार',
    'citizen.portal': 'नागरिक पोर्टल',
    'citizen.subtitle': 'तुमचा सक्रिय सहभाग स्मार्ट, स्वच्छ आणि पारदर्शक शहराच्या विकासाला चालना देतो.',
    'citizen.reportIssue': 'समस्या नोंदवा',
    'citizen.trackIssues': 'समस्या ट्रॅक करा',
    'citizen.recentActivity': 'अलीकडील क्रियाकलाप',
    'citizen.viewAll': 'सर्व पहा',
    'citizen.noComplaints': 'सक्रिय तक्रारी आढळल्या नाहीत.',
    'citizen.noComplaintsHint': 'येथे पाहण्यासाठी नागरिक समस्या नोंदवा.',
    'citizen.cityServices': 'शहर सेवा',
    'citizen.needHelp': 'मदत हवी आहे?',
    'citizen.helpText': 'तातडीच्या सेवा बिघाडासाठी २४/७ हेल्पडेस्कशी संपर्क करा.',
    'citizen.helpline': '1913 हेल्पलाइन कॉल करा',

    // Complaint Tracking
    'track.title': 'तक्रारी ट्रॅक करा',
    'track.subtitle': 'तुमच्या नोंदवलेल्या नागरिक समस्यांचे रिअल-टाइम ट्रॅकिंग.',
    'track.citizenDashboard': 'नागरिक डॅशबोर्ड',
    'track.all': 'सर्व',
    'track.active': 'सक्रिय',
    'track.resolved': 'निराकरण',
    'track.noGrievances': 'तुमच्या प्रोफाइलसाठी कोणत्याही तक्रारी आढळल्या नाहीत.',
    'track.noGrievancesHint': 'फिल्टर बदला किंवा नवीन तक्रार नोंदवा.',
    'track.viewDetails': 'पूर्ण तपशील पहा',
    'track.confirmResolution': 'निराकरण पुष्टी करा',

    // Admin Dashboard
    'admin.welcome': 'पुन्हा स्वागत',
    'admin.sysAdmin': 'सिस्टम प्रशासक',
    'admin.deptOfficial': 'विभाग अधिकारी',
    'admin.subtitle': 'रिअल-टाइम नागरिक समस्या आणि कार्यप्रदर्शन मेट्रिक्सचे निरीक्षण करा.',
    'admin.manageGrievances': 'तक्रारी व्यवस्थापित करा',
    'admin.pendingGrievances': 'प्रलंबित तक्रारी',
    'admin.resolvedCases': 'निराकरण झालेले',
    'admin.escalatedIssues': 'वाढवलेले मुद्दे',
    'admin.slaBreach': 'SLA उल्लंघन',
    'admin.recentLodged': 'अलीकडे नोंदवलेल्या तक्रारी',
    'admin.viewAll': 'सर्व पहा',
    'admin.noComplaints': 'अद्याप कोणत्याही तक्रारी नोंदवल्या नाहीत.',
    'admin.zoneComplaints': 'झोन तक्रारी',
    'admin.auditLog': 'सिस्टम ऑडिट लॉग',
    'admin.noActivity': 'कोणतीही क्रियाकलाप नोंदवलेली नाही',

    // Complaint Management
    'manage.title': 'तक्रारी व्यवस्थापित करा',
    'manage.adminControl': 'प्रशासकीय नियंत्रण',
    'manage.subtitle': 'केंद्रीकृत तक्रार जीवनचक्र ट्रॅकिंग आणि निराकरण केंद्र.',
    'manage.list': 'सूची',
    'manage.geoMap': 'नकाशा',
    'manage.dupMgmt': 'डुप्लिकेट व्यवस्थापन',
    'manage.dupDesc': 'भौगोलिक आणि मजकूर समानतेसाठी सक्रिय तक्रारी ऑटो-स्कॅन करा.',
    'manage.globalScan': 'ग्लोबल स्कॅन',
    'manage.allComplaints': 'सर्व तक्रारी',
    'manage.pending': 'प्रलंबित (सक्रिय)',
    'manage.resolvedFilter': 'निराकरण',
    'manage.closedRejected': 'बंद / नाकारले',
    'manage.incident': 'घटना',
    'manage.status': 'स्थिती',
    'manage.priority': 'प्राधान्य',
    'manage.dateLodged': 'नोंदणी तारीख',
    'manage.action': 'कृती',
    'manage.noResults': 'तुमच्या फिल्टरशी कोणत्याही तक्रारी जुळत नाहीत.',

    // Analytics
    'analytics.title': 'तक्रार',
    'analytics.title2': 'विश्लेषण',
    'analytics.badge': 'कार्यप्रदर्शन बुद्धिमत्ता',
    'analytics.subtitle': 'लाइव्ह डेटा विश्लेषण आणि SLA अनुपालन मेट्रिक्स.',
    'analytics.clickHint': 'त्या तक्रारी पाहण्यासाठी खालील कार्डवर क्लिक करा.',
    'analytics.totalComplaints': 'एकूण तक्रारी',
    'analytics.overdueSla': 'मुदतबाह्य SLA',
    'analytics.totalResolved': 'एकूण निराकरण',
    'analytics.completionRate': 'पूर्णता दर',
    'analytics.trend': 'दैनिक तक्रार ट्रेंड',
    'analytics.catDist': 'श्रेणी वितरण',
    'analytics.heatmap': 'भौगोलिक घटना हीटमॅप',
    'analytics.heatmapDesc': 'तक्रार घनता — लाल झोनमध्ये सर्वाधिक तक्रार एकाग्रता.',
    'analytics.density': 'घनता:',
    'analytics.low': 'कमी',
    'analytics.med': 'मध्यम',
    'analytics.high': 'उच्च',
    'analytics.veryHigh': 'खूप उच्च',
    'analytics.critical': 'गंभीर',
    'analytics.zoneLoad': 'झोन लोड वितरण',

    // General
    'general.loading': 'लोड होत आहे...',
    'general.save': 'जतन करा',
    'general.cancel': 'रद्द करा',
    'general.confirm': 'पुष्टी करा',
    'general.delete': 'हटवा',
    'general.edit': 'संपादित करा',
    'general.submit': 'सबमिट करा',
    'general.search': 'शोधा...',
  },

  hi: {
    // Nav
    'nav.dashboard': 'डैशबोर्ड',
    'nav.lodge': 'शिकायत',
    'nav.tracking': 'ट्रैकिंग',
    'nav.summary': 'सारांश',
    'nav.manage': 'प्रबंधन',
    'nav.departments': 'विभाग',
    'nav.analytics': 'विश्लेषण',
    'nav.manageIssues': 'समस्या प्रबंधन',
    'nav.officers': 'अधिकारी',
    'nav.signOut': 'लॉग आउट',
    'nav.darkMode': 'डार्क मोड',
    'nav.lightMode': 'लाइट मोड',

    // Landing
    'landing.hero.title1': 'स्मार्ट',
    'landing.hero.title2': 'नागरिक',
    'landing.hero.title3': 'सेवा',

    // Login
    'login.title': 'वापस स्वागत है',
    'login.subtitle': 'नागरिक शिकायत पोर्टल तक पहुँचें',
    'login.email': 'ईमेल पता',
    'login.password': 'सुरक्षित पासवर्ड',
    'login.forgot': 'पासवर्ड भूल गए?',
    'login.submit': 'साइन इन करें',
    'login.newUser': 'स्मार्ट नागरिक सेवा में नए हैं?',
    'login.createAccount': 'खाता बनाएं',

    // Citizen Dashboard
    'citizen.welcome': 'नमस्ते',
    'citizen.portal': 'नागरिक पोर्टल',
    'citizen.subtitle': 'आपकी सक्रिय भागीदारी एक स्मार्ट, स्वच्छ और पारदर्शी शहर के विकास को संचालित करती है।',
    'citizen.reportIssue': 'समस्या दर्ज करें',
    'citizen.trackIssues': 'समस्या ट्रैक करें',
    'citizen.recentActivity': 'हालिया गतिविधि',
    'citizen.viewAll': 'सभी देखें',
    'citizen.noComplaints': 'कोई सक्रिय शिकायत नहीं मिली।',
    'citizen.noComplaintsHint': 'यहाँ देखने के लिए नागरिक मुद्दे दर्ज करें।',
    'citizen.cityServices': 'शहर सेवाएं',
    'citizen.needHelp': 'मदद चाहिए?',
    'citizen.helpText': 'तत्काल सेवा विफलताओं के लिए 24/7 हेल्पडेस्क से संपर्क करें।',
    'citizen.helpline': '1913 हेल्पलाइन पर कॉल करें',

    // Complaint Tracking
    'track.title': 'शिकायतें ट्रैक करें',
    'track.subtitle': 'आपकी दर्ज की गई नागरिक समस्याओं की रियल-टाइम ट्रैकिंग।',
    'track.citizenDashboard': 'नागरिक डैशबोर्ड',
    'track.all': 'सभी',
    'track.active': 'सक्रिय',
    'track.resolved': 'हल किया',
    'track.noGrievances': 'आपकी प्रोफ़ाइल के लिए कोई शिकायत नहीं मिली।',
    'track.noGrievancesHint': 'फ़िल्टर बदलें या नई शिकायत दर्ज करें।',
    'track.viewDetails': 'पूरा विवरण देखें',
    'track.confirmResolution': 'समाधान पुष्टि करें',

    // Admin Dashboard
    'admin.welcome': 'वापस स्वागत है',
    'admin.sysAdmin': 'सिस्टम प्रशासक',
    'admin.deptOfficial': 'विभाग अधिकारी',
    'admin.subtitle': 'रियल-टाइम नागरिक मुद्दों और प्रदर्शन मेट्रिक्स की निगरानी करें।',
    'admin.manageGrievances': 'शिकायतें प्रबंधित करें',
    'admin.pendingGrievances': 'लंबित शिकायतें',
    'admin.resolvedCases': 'हल किए गए मामले',
    'admin.escalatedIssues': 'बढ़ाए गए मुद्दे',
    'admin.slaBreach': 'SLA उल्लंघन',
    'admin.recentLodged': 'हाल ही में दर्ज शिकायतें',
    'admin.viewAll': 'सभी देखें',
    'admin.noComplaints': 'अभी तक कोई शिकायत दर्ज नहीं हुई।',
    'admin.zoneComplaints': 'ज़ोन शिकायतें',
    'admin.auditLog': 'सिस्टम ऑडिट लॉग',
    'admin.noActivity': 'कोई गतिविधि दर्ज नहीं',

    // Complaint Management
    'manage.title': 'शिकायतें प्रबंधित करें',
    'manage.adminControl': 'प्रशासनिक नियंत्रण',
    'manage.subtitle': 'केंद्रीकृत शिकायत जीवनचक्र ट्रैकिंग और समाधान केंद्र।',
    'manage.list': 'सूची',
    'manage.geoMap': 'मानचित्र',
    'manage.dupMgmt': 'डुप्लिकेट प्रबंधन',
    'manage.dupDesc': 'भौगोलिक और पाठ समानता के लिए सक्रिय शिकायतों को ऑटो-स्कैन करें।',
    'manage.globalScan': 'ग्लोबल स्कैन',
    'manage.allComplaints': 'सभी शिकायतें',
    'manage.pending': 'लंबित (सक्रिय)',
    'manage.resolvedFilter': 'हल किया',
    'manage.closedRejected': 'बंद / अस्वीकृत',
    'manage.incident': 'घटना',
    'manage.status': 'स्थिति',
    'manage.priority': 'प्राथमिकता',
    'manage.dateLodged': 'दर्ज तिथि',
    'manage.action': 'कार्रवाई',
    'manage.noResults': 'आपके फ़िल्टर से कोई शिकायत मेल नहीं खाती।',

    // Analytics
    'analytics.title': 'शिकायत',
    'analytics.title2': 'विश्लेषण',
    'analytics.badge': 'प्रदर्शन बुद्धिमत्ता',
    'analytics.subtitle': 'लाइव डेटा विश्लेषण और SLA अनुपालन मेट्रिक्स।',
    'analytics.clickHint': 'उन शिकायतों को देखने के लिए नीचे किसी भी कार्ड पर क्लिक करें।',
    'analytics.totalComplaints': 'कुल शिकायतें',
    'analytics.overdueSla': 'अतिदेय SLA',
    'analytics.totalResolved': 'कुल हल',
    'analytics.completionRate': 'पूर्णता दर',
    'analytics.trend': 'दैनिक शिकायत रुझान',
    'analytics.catDist': 'श्रेणी वितरण',
    'analytics.heatmap': 'भौगोलिक घटना हीटमैप',
    'analytics.heatmapDesc': 'शिकायत घनत्व — लाल ज़ोन में सबसे अधिक शिकायत एकाग्रता।',
    'analytics.density': 'घनत्व:',
    'analytics.low': 'कम',
    'analytics.med': 'मध्यम',
    'analytics.high': 'उच्च',
    'analytics.veryHigh': 'बहुत उच्च',
    'analytics.critical': 'गंभीर',
    'analytics.zoneLoad': 'ज़ोन लोड वितरण',

    // General
    'general.loading': 'लोड हो रहा है...',
    'general.save': 'सहेजें',
    'general.cancel': 'रद्द करें',
    'general.confirm': 'पुष्टि करें',
    'general.delete': 'हटाएं',
    'general.edit': 'संपादित करें',
    'general.submit': 'जमा करें',
    'general.search': 'खोजें...',
  },
};

// ─── Context ───
interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export const useI18n = () => useContext(I18nContext);

// ─── Provider ───
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sns_lang') as Lang) || 'en';
    }
    return 'en';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('sns_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nContext;
