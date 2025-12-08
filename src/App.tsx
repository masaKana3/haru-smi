import React, { useEffect, useMemo, useState } from "react";
import SMIQuestionScreen from "./screens/SMIQuestionScreen";
import DashboardScreen from "./screens/DashboardScreen";
import DailyCheckScreen from "./screens/DailyCheckScreen";
import { calculateClusters, generateDailyQuestions } from "./logic/smiLogic";
import DailyCheckDetail from "./screens/DailyCheckDetail";
import HistoryScreen from "./screens/HistoryScreen";
import PeriodInputScreen from "./screens/PeriodInputScreen";
import InsightScreen from "./screens/InsightScreen";
import CommunityScreen from "./screens/CommunityScreen";
import PostCreateScreen from "./screens/PostCreateScreen";
import ThreadScreen from "./screens/ThreadScreen";
import DiaryScreen from "./screens/DiaryScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import { DailyQuestion, DailyRecord } from "./types/daily";
import { PeriodRecord } from "./types/period";
import { SMIConvertedAnswer } from "./types/smi";

type Screen =
  | "smi"
  | "result"
  | "dashboard"
  | "daily"
  | "detail"
  | "history"
  | "periodInput"
  | "insight"
  | "community"
  | "postCreate"
  | "thread"
  | "diary"
  | "postDetail";

type ResultScreenProps = {
  total: number | null;
  onGoDashboard: () => void;
};

// ★ SMI結果画面
function ResultScreen({ total, onGoDashboard }: ResultScreenProps) {
  const safeTotal = total ?? 0;

  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center p-8 text-brandText">
      <div className="max-w-sm w-full bg-white rounded-card p-8 shadow-sm text-center">
        <h2 className="text-[20px] font-semibold mb-6">あなたの更年期指数（SMI）</h2>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-brandTrack"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
            />
            <path
              className="text-brandAccent"
              strokeWidth="3.5"
              strokeDasharray={`${(safeTotal / 100) * 100}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-brandTextStrong">
            {safeTotal}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-brandText mb-6">
          {safeTotal <= 25 && "上手に更年期を過ごしています。"}
          {safeTotal > 25 && safeTotal <= 50 && "生活の見直しに気を配りましょう。"}
          {safeTotal > 50 && safeTotal <= 65 && "医師・カウンセリングの相談が有用です。"}
          {safeTotal > 65 && safeTotal <= 80 && "長期的なケアが必要です。"}
          {safeTotal > 80 && "専門医での長期的な対応が必要です。"}
        </p>

        <button
          onClick={onGoDashboard}
          className="w-full py-3 bg-brandAccent text-white rounded-button"
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("smi");
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [smiAnswers, setSmiAnswers] = useState<SMIConvertedAnswer[] | null>(null);
  const [dailyItems, setDailyItems] = useState<DailyQuestion[]>([]);
  const [todayDaily, setTodayDaily] = useState<DailyRecord | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null); // ★コミュニティ用
  const [activePostId, setActivePostId] = useState<string | null>(null);   // ★コミュニティ用
  const currentUserId = "me"; // ★コミュニティ用の仮ユーザーID


  // ★ 過去日対応
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // ▼ 最新の月経記録を取得（なければ null）
  function getLatestPeriod(): PeriodRecord | null {
    const raw = localStorage.getItem("haru_periods");
    if (!raw) return null;

    try {
      const list = JSON.parse(raw) as PeriodRecord[];
      if (list.length === 0) return null;
      list.sort((a, b) => (a.start < b.start ? 1 : -1));
      return list[0];
    } catch {
      return null;
    }
  }


  // SMI 完了
  const handleFinishSMI = (total: number, answers: SMIConvertedAnswer[]) => {
    setTotalScore(total);
    setSmiAnswers(answers);

    // ★ 保存（追加）
    localStorage.setItem("haru_smi_total", String(total));
    localStorage.setItem("haru_smi_answers", JSON.stringify(answers));
    localStorage.setItem("haru_smi_done", "true");

    setScreen("result");
  };

  // ダッシュボードへ
  const handleGoDashboard = () => {
    setScreen("dashboard");
  };

  // ★ カレンダーの日付が選択されたら
  const handleSelectDate = (dateStr: string) => {
    console.log("選択された日付:", dateStr);

    const today = new Date().toISOString().slice(0, 10);

    setSelectedDate(dateStr);

    const raw = localStorage.getItem(`haru_daily_${dateStr}`);

    // ▼ 未来の日付は禁止
    if (dateStr > today) {
      console.log("未来の日付のため記録できません");
      setTodayDaily(null);
      setScreen("dashboard"); 
      return;
    }

    // ▼ 過去 or 今日で “データがある場合” → 詳細画面へ
    if (raw) {
      const parsed = JSON.parse(raw) as DailyRecord;
      setTodayDaily(parsed);

      // 今日以外の過去は閲覧のみ → detail へ
      if (dateStr !== today) {
        setScreen("detail");
        return;
      }

      // 今日のデータがある → 通常どおり dashboard を更新
      setScreen("dashboard");
      return;
    }

    // ▼ 過去でデータがない（閲覧のみ、入力不可）
    if (dateStr < today) {
      console.log("その日は記録がありません");
      setTodayDaily(null);
      setScreen("dashboard");
      return;
    }

    // ▼ 今日でデータがまだない → dashboard で記録ボタンを押させる
    if (dateStr === today) {
      setTodayDaily(null);
      setScreen("dashboard");
      return;
    }
  };

  // ★ デイリーチェック開始（今日以外は絶対に入れない）
  const handleStartDailyCheck = () => {
    const today = new Date().toISOString().slice(0, 10);

    // 今日以外は daily を開かせない
    if (selectedDate !== today) {
      alert("今日の記録のみ入力できます。");
      return;
    }

    // 今日の場合のみ入力画面へ
    if (!smiAnswers) {
      setDailyItems([]);
    } else {
      const cluster = calculateClusters(smiAnswers);
      const items = generateDailyQuestions(cluster);
      setDailyItems(items);
    }

    setScreen("daily");
  };

  // デイリーチェック保存
  const handleSaveDaily = (data: DailyRecord) => {
    setTodayDaily(data);

    const key = `haru_daily_${data.date}`;
    localStorage.setItem(key, JSON.stringify(data));

    setSelectedDate(data.date);
    setScreen("dashboard");
  };

  // ★ 今日 / 過去 の詳細を見る
  const handleShowDetail = () => {
    setPrevScreen("dashboard");   // ★ 追加
    setScreen("detail");
  };

  // 履歴画面へ
  const handleShowHistory = () => {
    setScreen("history");
  };

  const openInsight = () => setScreen("insight");
  const closeInsight = () => setScreen("dashboard");

  const handleOpenCommunity = () => {
    setScreen("community");
  };

  // ★コミュニティ：投稿作成画面へ
  const handleCreatePost = (opts?: { topicId?: string; type?: "thread" | "diary" }) => {
    setActiveTopicId(opts?.topicId ?? null);
    setScreen("postCreate");
  };

  // ★コミュニティ：特定スレッドへ
  const handleOpenThread = (topicId: string) => {
    setActiveTopicId(topicId);
    setScreen("thread");
  };

  // ★コミュニティ：日記一覧へ
  const handleOpenDiary = () => {
    setScreen("diary");
  };

  // ★コミュニティ：投稿詳細へ
  const handleOpenPostDetail = (postId: string) => {
    setActivePostId(postId);
    setScreen("postDetail");
  };

  // ★ SMI を再実施する
  const handleStartSMI = () => {
    setScreen("smi");
  };

  // ★★★ Step B：SMIを復元（←ここに追加）
  useEffect(() => {
    const smiDone = localStorage.getItem("haru_smi_done");

    if (smiDone === "true") {
      const savedTotal = localStorage.getItem("haru_smi_total");
      const savedAnswers = localStorage.getItem("haru_smi_answers");

      if (savedTotal) setTotalScore(Number(savedTotal));
      if (savedAnswers) setSmiAnswers(JSON.parse(savedAnswers) as SMIConvertedAnswer[]);

      setScreen("dashboard");
    }
  }, []);

  // 今日の記録の復元
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `haru_daily_${today}`;
    const raw = localStorage.getItem(key);

    if (raw) {
      setTodayDaily(JSON.parse(raw) as DailyRecord);
    }
  }, []);

  // ▼ 過去の記録を全部取得して並べる
  const historyRecords: DailyRecord[] = useMemo(() => {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("haru_daily_"))
      .map((key) => {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
          return JSON.parse(value) as DailyRecord;
        } catch {
          return null;
        }
      })
      .filter((record): record is DailyRecord => record !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [todayDaily, selectedDate]);

  // ★ アプリ起動時：SMI を受けたことがあるなら dashboard へ
  useEffect(() => {
    const smiDone = localStorage.getItem("haru_smi_done");

    if (smiDone === "true") {
      setScreen("dashboard");
    }
  }, []);


  return (
    <>
      {screen === "smi" && <SMIQuestionScreen onFinish={handleFinishSMI} />}

      {screen === "result" && (
        <ResultScreen total={totalScore} onGoDashboard={handleGoDashboard} />
      )}

      {screen === "dashboard" && (
        <DashboardScreen
          total={totalScore}
          onDailyCheck={handleStartDailyCheck}
          todayDaily={todayDaily}
          onDetail={handleShowDetail}
          onSelectDate={handleSelectDate}
          selectedDate={selectedDate}
          onShowHistory={handleShowHistory}
          onStartSMI={handleStartSMI}   // ★追加
          onStartPeriodInput={() => setScreen("periodInput")} // ← 追加
          onOpenInsight={openInsight}
          onOpenCommunity={handleOpenCommunity}
          latestPeriod={getLatestPeriod()}  // ← 追加
        />
      )}

      {screen === "daily" && (
        <DailyCheckScreen
          dailyItems={dailyItems}
          onSave={handleSaveDaily}
          onCancel={handleGoDashboard}
        />
      )}

      {screen === "detail" && (
        <DailyCheckDetail
          data={todayDaily}
          selectedDate={selectedDate}
          isToday={selectedDate === new Date().toISOString().slice(0, 10)}
          readOnly={selectedDate !== new Date().toISOString().slice(0, 10)}
          // ▼ ここを修正
          onBack={() => setScreen(prevScreen || "dashboard")}
          onUpdate={(updated) => setTodayDaily(updated)}
        />
      )}

      {screen === "history" && (
        <HistoryScreen
          records={historyRecords}   // ← ★これが抜けていた！！
          onBack={() => setScreen("dashboard")}
          onSelectDate={(date) => {
            handleSelectDate(date); // 過去日の読み込み
            setPrevScreen("history");  // ★ 追加：戻り先を記録
            setScreen("detail");    // 詳細画面へ遷移
          }}
        />
      )}

      {screen === "periodInput" && (
        <PeriodInputScreen
          onBack={() => setScreen("dashboard")}
          onSaved={() => setScreen("dashboard")}
        />
      )}

      {screen === "community" && (
        <CommunityScreen
          onBack={() => setScreen("dashboard")}
          onCreatePost={handleCreatePost}
          onOpenThread={handleOpenThread}
          onOpenDiary={handleOpenDiary}
          onOpenPostDetail={handleOpenPostDetail}
        />
      )}

      {screen === "postCreate" && (
        <PostCreateScreen
          onBack={() => setScreen("community")}
          onSaved={(postId) => {
            setActivePostId(postId);
            setScreen("postDetail");
          }}
          defaultTopicId={activeTopicId}
          defaultType={activeTopicId ? "thread" : "diary"}
          currentUserId={currentUserId}
        />
      )}

      {screen === "thread" && activeTopicId && (
        <ThreadScreen
          topicId={activeTopicId}
          onBack={() => setScreen("community")}
          onCreatePost={(topicId) => handleCreatePost({ topicId, type: "thread" })}
          onOpenPostDetail={handleOpenPostDetail}
        />
      )}

      {screen === "diary" && (
        <DiaryScreen
          onBack={() => setScreen("community")}
          onOpenPostDetail={handleOpenPostDetail}
          onCreateDiary={() => handleCreatePost({ type: "diary" })}
          currentUserId={currentUserId}
        />
      )}

      {screen === "postDetail" && activePostId && (
        <PostDetailScreen
          postId={activePostId}
          onBack={() => setScreen("community")}
        />
      )}

      {screen === "insight" && (
        <InsightScreen
          todayDaily={todayDaily}
          onBack={closeInsight}
        />
      )}

      
    </>
  );
}
