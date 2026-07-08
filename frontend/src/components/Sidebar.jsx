import { useEffect, useState } from "react";
import { Plus, MessageSquare, Settings, LogOut, User, PenSquare, Menu, X, } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/axios";
import { setUserData } from "../redux/user.slice";
import { createConversation, getConversations } from "../features/conversation.api";
import { addConversation, setConversations, setSelectedConversation } from "../redux/conversation.slice";
import { getMessages } from "../features/message.api";
import { setArtifacts, setMessages } from "../redux/message.slice";


export default function Sidebar() {
  const [hovered, setHovered] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imageError, setImageError] = useState(false)
  const { userData } = useSelector(state => state.user);
  const { conversations, selectedConversation } = useSelector(state => state.conversation);
  const dispatch = useDispatch();

  const logout = async () => {
    try {
      await api.get("/api/auth/logout");
      dispatch(setUserData(null));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        dispatch(setConversations(data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchConversations();
  }, [userData?._id]);

  const handleCreateConversation = () => {
    dispatch(setSelectedConversation(null));
    dispatch(setMessages([]));
    dispatch(setArtifacts([]));
    setMobileOpen(false);
  };

  const handleSelectConversation = async (conversation) => {
    setMobileOpen(false);
    dispatch(setSelectedConversation(conversation));
    const messages = await getMessages(conversation._id);
    dispatch(setMessages(messages));
    dispatch(setArtifacts(messages.artifacts));
  };

  const PanelIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );

  /* ── Collapsed rail — desktop only ── */
  const CollapsedRail = () => (
    <div className="hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#121212] border-r border-[#2A2A30] py-4 gap-1 shrink-0">
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:text-[#E5E5E0] hover:bg-[#1A1A1E] transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1"
      >
        <PanelIcon />
      </button>

      <button
        onClick={handleCreateConversation}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:text-[#E5E5E0] hover:bg-[#1A1A1E] transition-colors duration-150 bg-transparent border-none cursor-pointer"
      >
        <Plus size={17} />
      </button>

      <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-1">
        {conversations.map((chat) => {
          const isActive = selectedConversation?._id === chat._id;
          return (
            <button
              key={chat._id}
              onClick={() => handleSelectConversation(chat)}
              title={chat.title}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-150 border-none cursor-pointer
                ${isActive ? "bg-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-transparent text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-[#E5E5E0]"}`}
            >
              <MessageSquare size={15} />
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        {userData && (
          <div className="relative">
            {userData.avatar
              ? <img src={userData.avatar} alt={userData.name} className="w-8 h-8 rounded-[8px] object-cover border-2 border-[#2DD4BF]/25" />
              : <div className="w-8 h-8 rounded-[8px] bg-[#1A1A1E] flex items-center justify-center"><User size={14} className="text-[#9CA3AF]" /></div>
            }
            <span className="absolute -bottom-px -right-px w-2 h-2 bg-green-500 rounded-full border-[1.5px] border-[#121212] block" />
          </div>
        )}
      </div>
    </div>
  );

  /* ── Full sidebar content ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#2A2A30]">
        {/* Desktop collapse */}
        <button
          onClick={() => setCollapsed(true)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E0] hover:bg-[#1A1A1E] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <PanelIcon />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E0] hover:bg-[#1A1A1E] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <X size={15} />
        </button>

        <span className="text-[16px] font-semibold text-[#E5E5E0] tracking-tight flex-1">SynctisAI</span>


        <button
          onClick={handleCreateConversation}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E0] hover:bg-[#1A1A1E] transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          <PenSquare size={14} />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-4 pt-4 pb-1">
        <button
          onClick={handleCreateConversation}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:bg-[#14B8A6] transition-colors duration-150"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {
        conversations.length == 0 ? (

          <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-[#6B6B70]">
            No recent conversations
          </div>
        )
          :
          (

            <p className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-[#6B6B70]">
              Recents
            </p>

          )
      }

      {/* Section label */}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {conversations.map((chat) => {
          const isActive = selectedConversation?._id === chat._id;
          const isHov = hovered === chat._id;
          return (
            <div
              key={chat._id}
              onClick={() => handleSelectConversation(chat)}
              onMouseEnter={() => setHovered(chat._id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150
                ${isActive ? "bg-[#2DD4BF]/10 border-[#2DD4BF]/[0.18]"
                  : isHov ? "bg-[#1A1A1E] border-transparent"
                    : "bg-transparent border-transparent"}`}
            >
              <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150
                ${isActive ? "bg-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-[#1A1A1E] text-[#9CA3AF]"}`}>
                <MessageSquare size={13} />
              </div>
              <p className={`text-[13px] font-medium truncate ${isActive ? "text-[#E5E5E0]" : "text-[#C4C4C8]"}`}>
                {chat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-2.5 h-px bg-[#2A2A30]" />

      {/* Footer */}
      <div className="px-3.5 py-3.5">
        {userData ? (
          <div className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-[#1A1A1E] transition-colors duration-150">
            <div className="relative shrink-0">
              {
                !userData?.avatar || imageError ? (
                  <div className="w-9 h-9 rounded-[10px] bg-[#1A1A1E] flex items-center justify-center">
                    <User size={15} className="text-[#9CA3AF]" />
                  </div>
                ) : (
                  <img
                    src={userData.avatar}
                    alt={userData.name}
                    className="w-9 h-9 rounded-[10px] object-cover border-2 border-[#2DD4BF]/25"
                    onError={() => setImageError(true)}
                  />
                )
              }
              <span className="absolute -bottom-px -right-px w-[9px] h-[9px] bg-green-500 rounded-full border-2 border-[#121212] block" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-[#E5E5E0] truncate">{userData.name}</p>

            </div>
            <div className="flex gap-1">

              <button onClick={logout} className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-[#6B6B70] cursor-pointer hover:bg-[#2A2A30] hover:text-[#9CA3AF] transition-all duration-150">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-1">
            <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#E5E5E0] bg-[#1A1A1E] border border-[#2A2A30] rounded-xl py-[11px] cursor-pointer hover:bg-[#2A2A30] transition-colors duration-150">
              Login
            </button>
          </div>
        )}
      </div>

    </div>
  );

  if (collapsed) return <CollapsedRail />;

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#121212] border border-[#2A2A30] text-[#9CA3AF] hover:text-[#E5E5E0] transition-colors duration-150 cursor-pointer"
      >
        <Menu size={16} />
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* ── Sidebar panel ── */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[270px] h-screen shrink-0
        bg-[#121212] border-r border-[#2A2A30]
        transition-transform duration-250
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <SidebarContent />
      </div>

    </>
  );
}