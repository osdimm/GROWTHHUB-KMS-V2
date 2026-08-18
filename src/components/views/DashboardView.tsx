import React, { useState } from 'react';
import { ActivityLog, PopularTopic, NavigationTab, User, KnowledgeArticle, HandoverDoc, ForumTopic } from '../../types';

interface DashboardViewProps {
  activities?: ActivityLog[];
  popularTopics?: PopularTopic[];
  forumTopics?: ForumTopic[];
  setActiveTab: (tab: NavigationTab) => void;
  users?: User[];
  articles?: KnowledgeArticle[];
  handoverDocs?: HandoverDoc[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  forumTopics = [],
  setActiveTab,
  users = [],
  articles = [],
  handoverDocs = []
}) => {
  const [showToast, setShowToast] = useState(true);
  const [timeRange, setTimeRange] = useState('30 Hari Terakhir');

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'Aktif').length;
  const totalContentCount = articles.length + handoverDocs.length;
  const totalKbArticles = articles.length;
  const totalHandovers = handoverDocs.length;

  // Derive real Topik Populer from actual forumTopics state
  const displayForumTopics = forumTopics || [];

  // Sort topics by views and comments to show truly popular topics
  const sortedPopularTopics = [...displayForumTopics]
    .sort((a, b) => {
      const aScore = (a.views || 0) + (a.comments?.length || a.commentCount || 0) * 5;
      const bScore = (b.views || 0) + (b.comments?.length || b.commentCount || 0) * 5;
      return bScore - aScore;
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Ikhtisar kinerja sistem dan distribusi pengetahuan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006194]"
          >
            <option>30 Hari Terakhir</option>
            <option>7 Hari Terakhir</option>
            <option>Tahun Ini (2026)</option>
          </select>
        </div>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div
          onClick={() => setActiveTab('data-pengguna')}
          className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="p-4 bg-sky-100 text-[#001d31] rounded-2xl group-hover:bg-[#006194] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[36px]">group</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalUsersCount}</h3>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{activeUsersCount} Akun Aktif</span>
              <span className="font-normal text-slate-400 ml-1">terdaftar di sistem</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setActiveTab('knowledge-base')}
          className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="p-4 bg-indigo-100 text-indigo-900 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konten Diunggah</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalContentCount}</h3>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-600 text-xs font-bold">
              <span className="material-symbols-outlined text-base">description</span>
              <span>{totalKbArticles} KB</span>
              <span className="font-normal text-slate-400 ml-1">• {totalHandovers} Handover</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Popular Topics Box */}
        <div className="col-span-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Topik Diskusi Populer</h4>
                <p className="text-xs text-slate-500 mt-0.5">Topik paling aktif didiskusikan oleh anggota tim</p>
              </div>
              <button
                onClick={() => setActiveTab('forum-diskusi')}
                className="text-xs text-[#006194] hover:underline font-bold flex items-center gap-1"
              >
                <span>Lihat Semua Forum</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sortedPopularTopics.map((topic, idx) => {
                const commentNum = topic.comments?.length ?? topic.commentCount ?? 0;
                const viewsNum = topic.views || 0;
                return (
                  <div
                    key={topic.id}
                    onClick={() => setActiveTab('forum-diskusi')}
                    className="flex items-center gap-3.5 p-4 border border-slate-200/80 bg-white hover:bg-sky-50/80 hover:border-sky-300 rounded-2xl transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#006194] flex items-center justify-center font-black text-sm group-hover:bg-[#006194] group-hover:text-white transition-colors shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-[#006194] font-extrabold text-[10px] rounded uppercase shrink-0">
                          {topic.category}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {topic.author.split('(')[0].trim()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#006194] transition-colors">
                        {topic.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">visibility</span>
                          {viewsNum.toLocaleString('id-ID')}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">chat_bubble</span>
                          {commentNum} komentar
                        </span>
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-[#006194] group-hover:translate-x-0.5 transition-all shrink-0">
                      chevron_right
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('forum-diskusi')}
            className="w-full mt-6 text-[#006194] font-semibold text-xs py-2.5 border border-sky-200 rounded-xl hover:bg-sky-50 transition-colors"
          >
            Buka Forum Diskusi Lengkap
          </button>
        </div>
      </div>
    </div>
  );
};
