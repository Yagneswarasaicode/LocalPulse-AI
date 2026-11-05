import React, { useState } from 'react';
import { Language } from '../../types';
import { aiAdvisorService } from '../../services/AIAdvisorService';
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  RotateCcw 
} from 'lucide-react';

interface SupermarketCopilotProps {
  businessId: string;
  language: Language;
}

export const SupermarketCopilot: React.FC<SupermarketCopilotProps> = ({
  businessId,
  language,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; textEn: string; textTe: string }>>([
    {
      sender: 'copilot',
      textEn: 'Hello! I am your LocalPulse Supermarket Intelligence Copilot. I analyze your POS sales velocity, active warehouse SKUs, and supplier quotes to recommend profit-safe purchasing and surplus liquidation.',
      textTe: 'నమస్కారం! నేను మీ లోకల్‌పల్స్ సూపర్‌మార్కెట్ AI కోపైలట్. మీ అమ్మకాలు, నిల్వలు మరియు సప్లయర్ ధరలను విశ్లేషించి వ్యాపార సలహాలు అందిస్తాను.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    { en: 'Which products need restocking?', te: 'ఏ వస్తువులు వెంటనే రీస్టాక్ చేయాలి?' },
    { en: 'Which products are expiring soon?', te: 'గడువు తీరబోయే వస్తువులు ఏమిటి?' },
    { en: 'What stock could I sell locally on P2P?', te: 'P2P లోకల్ మార్కెట్లో ఏ మిగులు సరుకు అమ్మవచ్చు?' },
    { en: 'What sold most last week?', te: 'గత వారం ఎక్కువగా అమ్ముడైనది ఏమిటి?' },
  ];

  const handleSendQuestion = async (queryEn: string, queryTe?: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'user', textEn: queryEn, textTe: queryTe || queryEn }]);

    try {
      const response = await aiAdvisorService.askSupermarketCopilot(queryEn, language, businessId);
      setMessages(prev => [
        ...prev,
        { sender: 'copilot', textEn: response.answerEn, textTe: response.answerTe }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'copilot',
          textEn: 'Could not process query. All deterministic data services remain active.',
          textTe: 'ప్రశ్న ప్రాసెస్ చేయడం సాధ్యం కాలేదు. అన్ని డేటా సేవలు అందుబాటులో ఉన్నాయి.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    handleSendQuestion(inputQuery.trim());
    setInputQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
              Enterprise Retail Assistant
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Supermarket AI Advisor & Copilot
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Grounded bilingual retail advisor interpreting inventory valuation, margin gaps, and local mandi conditions.
          </p>
        </div>
      </div>

      {/* Quick Question Chips */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card">
        <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-2">
          Recommended Analytical Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q.en, q.te)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-navy-50 hover:bg-emerald-50 text-navy-800 hover:text-emerald-800 border border-navy-200 hover:border-emerald-300 transition-all text-left"
            >
              💡 {language === 'te' ? q.te : q.en}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-6 space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl text-xs sm:text-sm ${
                msg.sender === 'user'
                  ? 'bg-navy-900 text-white ml-8 shadow-sm'
                  : 'bg-emerald-50/70 border border-emerald-200 text-navy-900 mr-8'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-emerald-600">
                {msg.sender === 'user' ? 'Supermarket Manager' : 'LocalPulse Copilot (Deterministic Insights)'}
              </div>
              <p className="font-medium leading-relaxed">
                {language === 'te' ? msg.textTe : msg.textEn}
              </p>
              {language === 'te' && (
                <p className="text-[11px] text-navy-500 mt-1 italic border-t border-emerald-200/60 pt-1">
                  {msg.textEn}
                </p>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing stock velocity and supplier price matrices...</span>
            </div>
          )}
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-surface-border">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about restocking, revenue, expiry risks, or supplier quotes..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-xs sm:text-sm focus:border-emerald-500 bg-white"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
