import './App.css'
import { Chat } from './components/Chat'
import LinkButton from './components/LinkButton';

function App() {
  const openWebsite = () => {
    window.open('https://yahav-hamias.co.il/', '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
        {/* Header עם כפתור לפתיחת האתר */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-3">
                  <span className="text-white text-2xl font-bold">יהב</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">יהב חמיאס - ציוד תעשייתי</h1>
                  <p className="text-gray-600">מסועים, ציוד הרמה ופתרונות תעשייתיים</p>
                </div>
              </div>
              <button
                onClick={openWebsite}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <span>🌐</span>
                <span>בקר באתר המלא</span>
                <span className="text-sm opacity-80 group-hover:opacity-100">↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* תוכן ראשי */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* צד שמאל - מידע */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-800 leading-tight">
                  פתרונות תעשייתיים
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    מתקדמים ואמינים
                  </span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  אנחנו מתמחים בפיתוח וייצור ציוד תעשייתי איכותי, כולל מסועים חלזוניים, 
                  ציוד הרמה ופתרונות מותאמים אישית לתעשייה.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-3xl mb-3">🏭</div>
                  <h3 className="font-semibold text-gray-800 mb-2">מסועים חלזוניים</h3>
                  <p className="text-gray-600 text-sm">פתרונות שינוע יעילים לחומרים כמו חול, גרגירים ועוד</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-3xl mb-3">⚙️</div>
                  <h3 className="font-semibold text-gray-800 mb-2">ציוד הרמה</h3>
                  <p className="text-gray-600 text-sm">מכשירי הרמה מתקדמים ובטוחים לתעשייה</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-3xl mb-3">🔧</div>
                  <h3 className="font-semibold text-gray-800 mb-2">פתרונות מותאמים</h3>
                  <p className="text-gray-600 text-sm">פיתוח ציוד מותאם לצרכים הספציפיים שלכם</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-3xl mb-3">🛠️</div>
                  <h3 className="font-semibold text-gray-800 mb-2">תחזוקה ותמיכה</h3>
                  <p className="text-gray-600 text-sm">שירות מקצועי ותמיכה טכנית מתמשכת</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={openWebsite}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  צפה בקטלוג המלא
                </button>
                <button
                  onClick={() => window.open('tel:+972-50-123-4567', '_self')}
                  className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  📞 צור קשר
                </button>
              </div>
            </div>

            {/* צד ימין - תמונה או וידאו */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-xl">
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <div className="text-6xl mb-6">🏭</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">ציוד תעשייתי מתקדם</h3>
                  <p className="text-gray-600 mb-6">
                    למידע מפורט על המוצרים שלנו ולקבלת הצעת מחיר, 
                    בקר באתר שלנו או שאל את הצ'אט בוט!
                  </p>
                  <div dir='rtl' className="flex justify-center flex-col">

                    <LinkButton href="https://yahav-hamias.co.il/" icon="🌐" children="בקר באתר"/>
                    <LinkButton href="https://yahav-hamias.co.il/" icon="🌐" children="בקר באתר"/>
                    <LinkButton href="https://yahav-hamias.co.il/" icon="🌐" children="בקר באתר"/>
                    <LinkButton href="https://yahav-hamias.co.il/" icon="🌐" children="בקר באתר"/>
                    <LinkButton href="https://yahav-hamias.co.il/" icon="🌐" children="בקר באתר"/>
                    
                    <button
                      onClick={openWebsite}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      בקר באתר 🌐
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
      <Chat/>
    </>
  )
}

export default App
