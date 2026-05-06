import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, Key, CheckCircle2 } from 'lucide-react';

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [keys, setKeys] = useState({ openai: '', gemini: '' });
  const { setKeys: saveKeys, setGoogleLinked } = useUserStore();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setGoogleLinked(true);
      setStep(2);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSaveKeys = () => {
    saveKeys({ openaiKey: keys.openai, geminiKey: keys.gemini });
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md bg-[#0f172a] border-slate-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            {step === 1 ? <LogIn className="text-indigo-400 w-6 h-6" /> : <Key className="text-emerald-400 w-6 h-6" />}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {step === 1 ? '歡迎使用 PT-CDSS' : '連結您的 AI 助手'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {step === 1 ? '請先登入您的 Google 帳戶以開始使用' : '請輸入您的 API Key 以啟用臨床決策支援'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {step === 1 ? (
            <Button 
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              使用 Google 帳戶登入
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OpenAI API Key (選填)</label>
                <Input 
                  type="password"
                  placeholder="sk-..."
                  className="bg-slate-900/50 border-slate-800 text-white h-11"
                  value={keys.openai}
                  onChange={(e) => setKeys({...keys, openai: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gemini API Key (選填)</label>
                <Input 
                  type="password"
                  placeholder="AIzaSy..."
                  className="bg-slate-900/50 border-slate-800 text-white h-11"
                  value={keys.gemini}
                  onChange={(e) => setKeys({...keys, gemini: e.target.value})}
                />
              </div>
              <p className="text-[11px] text-slate-500 italic text-center px-4">
                * 您的 Key 將儲存在本地瀏覽器中，我們不會在伺服器端儲存您的私密金鑰。
              </p>
              <Button 
                onClick={handleSaveKeys}
                disabled={!keys.openai && !keys.gemini}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all mt-4"
              >
                <CheckCircle2 className="w-5 h-5" />
                完成設定並開始
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
