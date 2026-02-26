import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Send, 
  RefreshCw, 
  Youtube, 
  Twitter, 
  Newspaper, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  User,
  Bot,
  Settings
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ReportService } from './services/reportService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [feishuWebhook, setFeishuWebhook] = useState('');
  const [sendingToFeishu, setSendingToFeishu] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report, loading, phase]);

  const formatForFeishu = (md: string) => {
    return md
      .replace(/^#+ /gm, (match) => match.length > 2 ? '📌 ' : '🚀 ')
      .replace(/^> /gm, '💬 ')
      .replace(/\|/g, ' ')
      .replace(/^- /gm, '• ')
      .replace(/\*\*(.*?)\*\*/g, '$1');
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setSendSuccess(false);
    setReport(null);
    setPhase("正在初始化 AI 代理...");
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");
      
      const service = new ReportService(apiKey);
      const content = await service.generateReport((p) => setPhase(p));
      setReport(content);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
      setPhase('');
    }
  };

  const sendToFeishu = async () => {
    if (!report || !feishuWebhook) return;
    setSendingToFeishu(true);
    try {
      const formattedReport = formatForFeishu(report);
      const response = await fetch('/api/send-to-feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formattedReport, webhookUrl: feishuWebhook })
      });
      if (!response.ok) throw new Error("Failed to send to Feishu");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send to Feishu");
    } finally {
      setSendingToFeishu(false);
    }
  };

  const downloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `抄手的AI日报_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Layout className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">抄手的AI日报</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* User Question */}
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm max-w-[80%]">
              <p className="text-gray-800">你好，请告诉我今日AI资讯。</p>
            </div>
          </div>

          {/* Bot Answer */}
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[100px]">
                <AnimatePresence mode="wait">
                  {!report && !loading && !error && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-8 text-center"
                    >
                      <p className="text-gray-500 mb-6">点击下方按钮开始为您检索今日情报</p>
                      <button
                        onClick={generateReport}
                        className="px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10 flex items-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        立即生成日报
                      </button>
                    </motion.div>
                  )}

                  {loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <p className="text-gray-800 font-medium">您好，正在为您搜集今日 AI 资讯，请稍候...</p>
                      <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-bold tracking-wide">{phase || "正在搜集情报..."}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-[90%] animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-[95%] animate-pulse" />
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">{error}</p>
                      <button onClick={generateReport} className="ml-auto underline text-xs">重试</button>
                    </motion.div>
                  )}

                  {report && (
                    <motion.div
                      key="report"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <p className="text-gray-800 font-medium">您好，以下是今日为您生成的日报：</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={downloadMarkdown}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            title="下载 Markdown"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="prose prose-emerald max-w-none prose-headings:font-bold prose-a:text-emerald-600">
                        <Markdown>{report}</Markdown>
                      </div>

                      <div className="pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">生成于 {new Date().toLocaleString()}</p>
                          <button
                            onClick={sendToFeishu}
                            disabled={!feishuWebhook || sendingToFeishu}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-200"
                          >
                            {sendingToFeishu ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            推送到飞书
                          </button>
                        </div>
                        {sendSuccess && (
                          <p className="text-emerald-600 text-xs font-bold mt-2 text-right">已成功推送至飞书！</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" /> 配置设置
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">飞书机器人 Webhook</label>
                  <input
                    type="text"
                    value={feishuWebhook}
                    onChange={(e) => setFeishuWebhook(e.target.value)}
                    placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    用于将生成的日报自动推送到您的飞书群组或个人会话。
                  </p>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                >
                  保存并关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
