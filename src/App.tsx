import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Download, RefreshCw, TrendingUp, Search, Calendar, Menu, X, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStockIntelligence } from "./services/geminiService";

interface Report {
  id: string;
  date: string;
  summary: string;
  details: string;
  stocks: string[];
}

export default function App() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [newStock, setNewStock] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStocks();
    fetchReports();
  }, []);

  const fetchStocks = async () => {
    const res = await fetch("/api/stocks");
    const data = await res.json();
    setStocks(data);
  };

  const fetchReports = async () => {
    const res = await fetch("/api/reports");
    const data = await res.json();
    setReports(data);
  };

  const addStock = async () => {
    if (!newStock) return;
    const updatedStocks = [...stocks, newStock.toUpperCase()];
    setStocks(updatedStocks);
    setNewStock("");
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stocks: updatedStocks }),
    });
  };

  const removeStock = async (stock: string) => {
    const updatedStocks = stocks.filter((s) => s !== stock);
    setStocks(updatedStocks);
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stocks: updatedStocks }),
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const result = await getStockIntelligence(stocks);
      if (result) {
        const newReport: Report = {
          id: Date.now().toString(),
          stocks: [...stocks],
          ...result,
        };
        setReports([newReport, ...reports]);
        setActiveReport(newReport);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas text-text-primary font-sans relative">
      {/* Sidebar: Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Stock Pool Management */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-white flex flex-col p-5 border-r border-white/10 shrink-0
        transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-bold tracking-widest">
            <TrendingUp className="w-5 h-5 text-accent-blue" />
            AI 智能头条
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/10 rounded-lg p-2 flex items-center mb-5 border border-white/5">
          <input
            type="text"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder="代码 (如: 600519)"
            className="bg-transparent border-none text-white outline-none text-xs w-full px-2"
            onKeyDown={(e) => e.key === "Enter" && addStock()}
          />
          <button onClick={addStock} className="opacity-50 hover:opacity-100 transition-opacity">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto stock-list space-y-1">
          <AnimatePresence>
            {stocks.map((stock) => (
              <motion.div
                key={stock}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex justify-between items-center py-2 border-b border-white/5 group"
              >
                <div>
                  <span className="text-xs font-bold block">{stock}</span>
                  <span className="text-[10px] text-white/40 font-mono">STOCK POOL</span>
                </div>
                <button 
                  onClick={() => removeStock(stock)}
                  className="text-accent-red md:opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-4 text-[10px] text-white/30 text-center border-t border-white/5">
          Powered by Gemini AI (A股深度定制)
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-5 overflow-y-auto w-full bg-bg-canvas">
        <header className="flex justify-between items-center sticky top-0 bg-bg-canvas/80 backdrop-blur-sm z-10 py-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-white border border-border-theme rounded-lg shadow-sm"
            >
              <Menu className="w-5 h-5 text-text-primary" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-text-primary">深研金融内参 · 每日早报</h1>
              <p className="text-[10px] md:text-[11px] text-text-secondary mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {activeReport ? new Date(activeReport.date).toLocaleString() : "选择或生成最新情报"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={generateReport}
              disabled={loading || stocks.length === 0}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-accent-blue text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-accent-blue/20"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{loading ? "分析中..." : "生成早报"}</span>
            </button>
          </div>
        </header>

        {/* Mobile Stats Bar */}
        <div className="flex gap-2 md:hidden overflow-x-auto pb-1 no-scrollbar">
          {stocks.slice(0, 5).map(s => (
            <div key={s} className="px-3 py-1 bg-white rounded-full border border-border-theme text-[10px] font-bold whitespace-nowrap">
              {s}
            </div>
          ))}
          {stocks.length > 5 && <div className="px-3 py-1 bg-white/50 rounded-full border border-dashed border-border-theme text-[10px] text-text-secondary whitespace-nowrap">+{stocks.length - 5}只</div>}
        </div>

        {/* Essence Box */}
        {activeReport && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 md:p-5 rounded-xl border-l-4 border-accent-blue shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-3 h-3 text-accent-blue" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-blue block">今日摘要 (Daily Summary)</span>
            </div>
            <div className="text-sm md:text-base leading-relaxed font-serif italic text-slate-700">
              {activeReport.summary}
            </div>
          </motion.div>
        )}

        {/* Analysis Grid / Content */}
        <div className="flex-1">
          {activeReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-border-theme flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-theme">
                  <span className="text-xs font-bold text-text-primary">早报详细复盘</span>
                  <span className="text-[10px] px-2 py-0.5 bg-accent-blue/10 rounded text-accent-blue font-bold">A-Share Deep</span>
                </div>
                <div className="text-xs md:text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap font-sans space-y-2">
                  {activeReport.details.split('\n').map((line, idx) => {
                    const isHeader = line.includes('[') && line.includes(']');
                    // Check for dates older than early April 2026
                    const isPotentiallyOld = /202[0-5]|2026-0[1-3]/.test(line) || (line.includes('2026-04') && !/04-(1[2-7])/.test(line) && /\d{2}-\d{2}/.test(line));
                    
                    return (
                      <div key={idx} className={isHeader ? "font-bold text-accent-blue mt-4 mb-2 block border-b border-accent-blue/10 pb-1" : "pl-2 border-l-2 border-slate-100 py-1"}>
                        {isPotentiallyOld && !isHeader && /\d/.test(line) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-accent-red font-bold mb-1 bg-accent-red/5 px-1.5 py-0.5 rounded mr-2">
                            ⚠️ 数据可能过期
                          </span>
                        )}
                        {line}
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="space-y-4 md:space-y-5">
                <section className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-border-theme flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-theme">
                    <span className="text-xs font-bold text-text-primary">宏观敏感维度</span>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-text-secondary">Global Macro</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent-green mt-1.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">市场流动性观察</h4>
                        <p className="text-[10px] md:text-[11px] text-text-secondary leading-normal mt-0.5">流动性预期平稳，科技成长板块配置价值显现。</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent-red mt-1.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">政策监管风险</h4>
                        <p className="text-[10px] md:text-[11px] text-text-secondary leading-normal mt-0.5">跟踪行业准入新规，防范估值溢价回调风险。</p>
                      </div>
                    </div>
                  </div>
                </section>
                
                {reports.length > 1 && (
                  <section className="hidden md:block bg-white rounded-xl p-5 shadow-sm border border-border-theme">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> 历史情报记录
                    </h3>
                    <div className="space-y-2">
                      {reports.slice(0, 3).map(r => (
                        <div key={r.id} onClick={() => setActiveReport(r)} className="p-2 border border-border-theme rounded hover:border-accent-blue transition-colors cursor-pointer flex justify-between items-center group">
                          <span className="text-[10px] font-bold">{new Date(r.date).toLocaleDateString()}</span>
                          <FileText className="w-3 h-3 text-text-secondary group-hover:text-accent-blue" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 px-10 text-center">
              <div className="relative mb-6">
                <FileText className="w-20 h-20" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-accent-blue w-6 h-6 rounded-full border-4 border-bg-canvas"
                />
              </div>
              <p className="text-sm font-bold max-w-[200px]">您的 A 股情报库已准备就绪。请输入代码或简称开始分析。</p>
            </div>
          )}
        </div>

        {/* Mobile History (Bottom Scroll) */}
        {reports.length > 0 && (
          <div className="md:hidden mt-4 pb-10">
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary mb-3">历史记录</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  onClick={() => setActiveReport(report)}
                  className={`flex-shrink-0 w-40 p-3 rounded-lg border ${activeReport?.id === report.id ? 'border-accent-blue bg-white' : 'border-border-theme bg-white/50'} shadow-sm`}
                >
                  <p className="text-[10px] font-bold mb-1">{new Date(report.date).toLocaleDateString()}</p>
                  <p className="text-[10px] text-text-secondary truncate">{report.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
