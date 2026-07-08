import { Share2, MoreHorizontal, Zap, ChartBar, MessageCircle, MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";

export default function Navbar() {
  const { conversations, selectedConversation } = useSelector(state => state.conversation);
  const {messages} = useSelector(state => state.message);
  return (
    <div className="h-14 flex items-center justify-between px-5 border-b border-[#2A2A30] bg-[#121212]">

      {/* Left — chat title */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/20">
          <MessageSquare size={13} className="text-[#2DD4BF]" />
        </div>
        <h2 className="text-[14px] font-semibold text-[#E5E5E0] tracking-tight">
          {selectedConversation?.title}
        </h2>
        <span className="text-[10px] font-medium text-[#6B6B70] bg-[#1A1A1E] border border-[#2A2A30] px-2 py-0.5 rounded-full">
          {messages.length} Messages
        </span>
      </div>

      {/* Right — actions */}
     

    </div>
  );
}