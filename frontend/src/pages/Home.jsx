import { useDispatch, useSelector } from "react-redux";
import { FaGoogle } from "react-icons/fa";
import ArtifactPanel from "../components/ArtifactPanel";
import ChatArea from "../components/ChatArea";
import Sidebar from "../components/Sidebar";
import api from "../utils/axios";
import { setUserData } from "../redux/user.slice";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

function Home() {
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch()
  const login = async (token) => {
    try {
      const { data } = await api.post(`/api/auth/login`, { token })
      dispatch(setUserData(data.user))
    } catch (error) {
      console.log(error)
    }
  }
  const handleGoogleLogin = async () => {
    const result =
      await signInWithPopup(auth, googleProvider);

    const token = await result.user.getIdToken();
    await login(token)
  };

  return (
    <div className="h-screen flex  bg-[#121212] text-white overflow-hidden">
      <Sidebar />
      <ChatArea />
      <ArtifactPanel />

      {!userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[340px] bg-[#1A1A1E] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5">

            <div className="flex flex-col gap-1">
              <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">Welcome to SynctisAI</h2>
              <p className="text-[13px] text-slate-500">Please login to continue using the app.</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-7006 border border-[#2DD4BF]/30 shadow-lg shadow-[#2DD4BF]/20 hover:shadow-[#2DD4BF]/30 transition-all duration-150 cursor-pointer"
            >
              <FaGoogle size={15} className="text-white" />
              Continue with Google
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default Home;