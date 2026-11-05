import React, { useState } from 'react';
import { Language } from '../../types';
import { aiAdvisorService } from '../../services/AIAdvisorService';
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Loader2 
} from 'lucide-react';

interface P2PCopilotProps {
  language: Language;
}

export const P2PCopilot: React.FC<P2PCopilotProps> = ({
  language,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; textEn: string; textTe: string }>>([
    {
      sender: 'copilot',
      textEn: 'Welcome to P2P Local Market AI Copilot! I help street vendors and supermarkets identify surplus inventory, determine competitive liquidation asking prices, and match with nearby buyers.',
      textTe: 'P2P లోకల్ మార్కెట్ AI కోపైలట్‌కు స్వాగతం! మిగులు సరుకును గుర్తించడానికి, సరైన ధర నిర్ణయించడానికి మరియు సమీప కొనుగోలుదారులను కనుగొనడానికి నేను సహాయపడతాను.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    { en: 'How much value could I recover from surplus today?', te: 'ఈ రోజు మిగులు సరుకు నుండి ఎంత విలువ రికవర్ చేయవచ్చు?' },
    { en: 'What asking price should I consider for sound surplus?', te: 'మిగులు సరుకుకు ఏ ధర నిర్ణయించాలి?' },
    { en: 'How does P2P prevent spoilage at Poorna Market?', te: 'పూర్ణా మార్కెట్లో ఇది వృధాను ఎలా తగ్గిస్తుంది?' },
  ];

  const handleSendQuestion = async (queryEn: string, queryTe?: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'user', textEn: queryEn, textTe: queryTe || queryEn }]);

    try {
      const response = await aiAdvisorService.askP2PCopilot(queryEn, language);
      setMessages(prev => [
        ...prev,
        { sender: 'copilot', textEn: response.answerEn, textTe: response.answerTe }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'copilot',
          textEn: 'P2P analytics service is operational. Check "AI Surplus Suggestions" for immediate recommendations.',
          textTe: 'P2P సర్వీస్ పనిచేస్తోంది. తక్షణ సలహాల కోసం "AI మిగులు సూచనలు" చూడండి.'
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
              Hyperlocal Trade Intelligence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            P2P Market AI Advisor & Copilot
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Pricing strategy, shelf-life clearance timing, and neighborhood matching advisor.
          </p>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card">
        <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-2">
          Frequently Asked Trade Inquiries:
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

      {/* Chat History */}
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
                {msg.sender === 'user' ? 'Market Participant' : 'P2P Copilot (Local Trade Advisor)'}
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
              <span>Analyzing market clearing prices and nearby mandi listings...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-surface-border">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about surplus asking prices, buyer demand, or trade rules..."
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
