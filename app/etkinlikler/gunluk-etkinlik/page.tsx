'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Clock, X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DailyQuestion = {
    id: string;
    soru: string;
    puan: number;
    cevap: string;
    ipucu_bas: string;
    ipucu_son: string;
    daha_once_soruldu: boolean;
};

type UserAnswer = {
    questionId: string;
    answer: string[];
    isCorrect: boolean;
    hintsUsed: number;
    earnedPoints: number;
    showHints: boolean;
};

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DailyActivity() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<DailyQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(UserAnswer | null)[]>(Array(6).fill(null));
    const [timeLeft, setTimeLeft] = useState(100);
    const [gameStatus, setGameStatus] = useState<'not-started' | 'playing' | 'finished'>('not-started');
    const [inputValues, setInputValues] = useState<string[]>(['']);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const fetchDailyQuestions = async () => {
            try {
                const { data: activityRecord, error: recordError } = await supabase
                    .from('daily_activity_records')
                    .select('*')
                    .eq('date', new Date().toISOString().split('T')[0])
                    .single();

                if (recordError && recordError.code !== 'PGRST116') throw recordError;

                if (activityRecord?.completed) {
                    setGameStatus('finished');
                    setQuestions(JSON.parse(JSON.stringify(activityRecord.questions)));
                    setUserAnswers(JSON.parse(JSON.stringify(activityRecord.answers)));
                    setScore(activityRecord.score);
                    setLoading(false);
                    return;
                }

                const { data: questionsData, error: questionsError } = await supabase
                    .from('daily_activity_questions')
                    .select('*')
                    .eq('daha_once_soruldu', false)
                    .order('puan', { ascending: true });

                if (questionsError) throw questionsError;

                if (questionsData.length < 6) {
                    const { data: oldQuestions, error: oldError } = await supabase
                        .from('daily_activity_questions')
                        .select('*')
                        .order('puan', { ascending: true })
                        .limit(6 - questionsData.length);

                    if (oldError) throw oldError;
                    questionsData.push(...oldQuestions);
                }

                const selectedQuestions = [
                    ...questionsData.filter(q => q.puan === 10).slice(0, 1),
                    ...questionsData.filter(q => q.puan === 20).slice(0, 1),
                    ...questionsData.filter(q => q.puan === 30).slice(0, 1),
                    ...questionsData.filter(q => q.puan === 40).slice(0, 1),
                    ...questionsData.filter(q => q.puan === 50).slice(0, 1),
                    ...questionsData.filter(q => q.puan === 60).slice(0, 1),
                ].filter(Boolean);

                setQuestions(selectedQuestions);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching daily questions:', error);
                setLoading(false);
            }
        };

        fetchDailyQuestions();
    }, []);

    useEffect(() => {
        if (gameStatus !== 'playing') return;

        timerRef.current = setTimeout(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [gameStatus, timeLeft]);

    const startGame = () => {
        setGameStatus('playing');
        setTimeLeft(100);
        setScore(0);
        setUserAnswers(Array(6).fill(null));
        setCurrentQuestionIndex(0);
        setInputValues(['']);
        setHintsUsed(0);
        setShowHints(false);
    };

    const finishGame = useCallback(async () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setGameStatus('finished');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('daily_streak')
                    .eq('id', user.id)
                    .single();

                if (!error) {
                    const newStreak = (profile?.daily_streak || 0) + 1;
                    setStreak(newStreak);
                    await supabase
                        .from('profiles')
                        .update({ daily_streak: newStreak })
                        .eq('id', user.id);
                }

                await supabase
                    .from('daily_activity_records')
                    .upsert({
                        user_id: user.id,
                        date: new Date().toISOString().split('T')[0],
                        questions: questions,
                        answers: userAnswers,
                        score: score,
                        time_spent: 100 - timeLeft,
                        completed: true,
                    });

                await supabase
                    .from('daily_activity_questions')
                    .update({ daha_once_soruldu: true })
                    .in('id', questions.map(q => q.id));
            }
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }, [questions, userAnswers, score, timeLeft]);

    const checkAnswer = useCallback(() => {
        if (!questions[currentQuestionIndex]) return;

        const currentQuestion = questions[currentQuestionIndex];
        const userAnswer = inputValues.join('').toLowerCase().trim();
        const correctAnswer = currentQuestion.cevap.toLowerCase().trim();
        const isCorrect = userAnswer === correctAnswer;

        const earnedPoints = Math.max(5, currentQuestion.puan - (hintsUsed * 5));

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = {
            questionId: currentQuestion.id,
            answer: [...inputValues],
            isCorrect,
            hintsUsed,
            earnedPoints: isCorrect ? earnedPoints : 0,
            showHints
        };

        setUserAnswers(newAnswers);

        if (isCorrect) {
            setScore(prev => prev + earnedPoints);

            const isLastQuestion = currentQuestionIndex === questions.length - 1;

            if (isLastQuestion) {
                finishGame();
            } else {
                const nextIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIndex);
                setInputValues(newAnswers[nextIndex]?.answer || ['']);
                setHintsUsed(newAnswers[nextIndex]?.hintsUsed || 0);
                setShowHints(newAnswers[nextIndex]?.showHints || false);
            }
        }
    }, [currentQuestionIndex, questions, inputValues, hintsUsed, userAnswers, finishGame, showHints]);

    const useHint = useCallback(() => {
        if (hintsUsed >= 3 || !questions[currentQuestionIndex]) return;

        const newHintsUsed = hintsUsed + 1;
        setHintsUsed(newHintsUsed);
        setShowHints(true);

        const currentQuestion = questions[currentQuestionIndex];
        let newValues = [...inputValues];

        switch (hintsUsed) {
            case 0:
                newValues = Array(currentQuestion.cevap.length).fill('');
                break;
            case 1:
                const startHint = currentQuestion.ipucu_bas;
                for (let i = 0; i < startHint.length && i < newValues.length; i++) {
                    newValues[i] = startHint[i];
                }
                break;
            case 2:
                const endHint = currentQuestion.ipucu_son;
                for (let i = 0; i < endHint.length; i++) {
                    const pos = newValues.length - endHint.length + i;
                    if (pos >= 0 && pos < newValues.length) {
                        newValues[pos] = endHint[i];
                    }
                }
                break;
        }

        setInputValues(newValues);
    }, [currentQuestionIndex, questions, inputValues, hintsUsed]);

    const handleInputChange = useCallback((index: number, value: string, inputElement: HTMLInputElement) => {
        setInputValues(prev => {
            const newValues = [...prev];

            if (value && value.length === 1) {
                newValues[index] = value.toLowerCase();

                if (index === newValues.length - 1 && newValues.length < 30) {
                    newValues.push('');
                    setTimeout(() => {
                        inputRefs.current[index + 1]?.focus();
                    }, 0);
                } else if (index < newValues.length - 1) {
                    setTimeout(() => {
                        inputRefs.current[index + 1]?.focus();
                    }, 0);
                }
            }
            else if (value === '' && index >= 0) {
                newValues[index] = '';
                if (index > 0 && newValues[index] === '') {
                    newValues.splice(index, 1);
                    setTimeout(() => {
                        inputRefs.current[index - 1]?.focus();
                    }, 0);
                }
            }

            return newValues;
        });
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            checkAnswer();
        } else if (e.key === 'Backspace' && inputValues[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [checkAnswer, inputValues]);

    useEffect(() => {
        if (gameStatus !== 'playing') return;

        const currentAnswer = userAnswers[currentQuestionIndex];
        setInputValues(currentAnswer?.answer || ['']);
        setHintsUsed(currentAnswer?.hintsUsed || 0);
        setShowHints(currentAnswer?.showHints || false);
    }, [currentQuestionIndex, gameStatus, userAnswers]);

    useEffect(() => {
        if (gameStatus === 'playing' && inputRefs.current.length > 0) {
            const lastFilledIndex = inputValues.findIndex(val => val === '');
            const focusIndex = lastFilledIndex === -1 ? inputValues.length - 1 : Math.max(0, lastFilledIndex - 1);
            inputRefs.current[focusIndex]?.focus();
        }
    }, [inputValues, gameStatus]);

    const goToNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, questions.length]);

    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    }, [questions.length]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
    }

    if (gameStatus === 'finished') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="rounded-3xl shadow-2xl bg-black/15 p-6 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-center mb-4">Günlük Etkinlik Tamamlandı!</h1>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-100 dark:bg-blue-600 p-4 rounded-lg text-center">
                            <p className="text-sm text-blue-600 dark:text-blue-300">Puan</p>
                            <p className="text-2xl font-bold">{score}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-600 p-4 rounded-lg text-center">
                            <p className="text-sm text-green-600 dark:text-green-300">Seri</p>
                            <p className="text-2xl font-bold">{streak} Gün</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        {questions.map((question, index) => {
                            const userAnswer = userAnswers[index];
                            const isCorrect = userAnswer?.isCorrect;
                            const earnedPoints = userAnswer?.earnedPoints || 0;

                            return (
                                <div key={question.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{question.soru}</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                                            {earnedPoints}p
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">
                                        Cevap: <span className="font-semibold">{question.cevap}</span>
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    if (gameStatus === 'not-started') {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
                <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl bg-black/15">
                    <h1 className="text-2xl font-bold text-center mb-4">Günlük Etkinlik</h1>
                    <p className="mb-6">
                        Her gün 6 farklı zorlukta soruyla karşılaşacak, 100 saniyede en yüksek puanı toplamaya çalışacaksınız.
                    </p>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-700 rounded-full mr-3">
                                <HelpCircle className="w-8 h-4 text-blue-600 dark:text-blue-300" />
                            </div>
                            <p>3 ipucu hakkınız var, her ipucu puanı 5 azaltır. Soru değeri minimum 5 puana düşebilir.</p>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-700 rounded-full mr-3">
                                <Clock className="w-8 h-4 text-green-600 dark:text-green-300" />
                            </div>
                            <p>100 saniyeniz ve sınırsız deneme hakkınız var. Bir soruyu doğru yanıtlamadan diğerine geçemezsiniz.</p>
                        </div>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        Başla
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const currentAnswer = userAnswers[currentQuestionIndex];
    const isAnswered = currentAnswer?.isCorrect;
    const maxPoints = currentQuestion.puan;
    const currentPoints = Math.max(5, maxPoints - (hintsUsed * 5));

    return (
        <div className="min-h-[calc(100vh-200px)] justify-center p-4">
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <Clock className="text-gray-700" />
                        <span className="font-bold">{timeLeft}s</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-bold">{score} Puan</span>
                    </div>
                </div>

                <div className="flex justify-center space-x-2 mb-6">
                    {questions.map((_, index) => {
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = userAnswers[index]?.isCorrect;

                        return (
                            <button
                                key={index}
                                onClick={() => goToQuestion(index)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-medium transition-colors ${isCurrent
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : isAnswered
                                        ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-700'
                                        : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-500 dark:text-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-2xl mx-auto rounded-3xl shadow-2xl bg-black/15 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{currentQuestion.soru}</h2>
                    <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100 rounded-full text-sm font-medium">
                            {currentPoints}p
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                        {Array(3).fill(0).map((_, i) => (
                            <div
                                key={i}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${i < hintsUsed ? 'bg-blue-600' : 'rounded-3xl shadow-2xl bg-black/30'
                                    }`}
                            >
                                {i < hintsUsed && <HelpCircle className="w-4 h-4 text-white" />}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={useHint}
                        disabled={hintsUsed >= 3 || isAnswered}
                        className={`px-3 py-3 rounded-lg text-sm font-medium ${hintsUsed >= 3 || isAnswered
                            ? 'transition dark:bg-green-700 dark:text-green-200 cursor-not-allowed'
                            : 'transition dark:bg-green-700 dark:text-green-200 dark:hover:bg-green-800'
                            }`}
                    >
                        İpucu Kullan
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {!showHints ? (
                            <div className="w-full">
                                <input
                                    ref={el => { inputRefs.current[0] = el; }}
                                    type="text"
                                    value={inputValues[0] || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setInputValues([value.toLowerCase()]);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') checkAnswer();
                                    }}
                                    disabled={isAnswered}
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md font-medium text-lg bg-transparent focus:outline-none"
                                    placeholder="Cevabınızı yazın..."
                                />
                            </div>
                        ) : (
                            inputValues.map((value, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-center w-10 h-12 border-2 rounded-md ${isAnswered
                                        ? value.toLowerCase() === currentQuestion.cevap[index]?.toLowerCase()
                                            ? 'border-green-500 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                            : 'border-red-500 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <input
                                        ref={el => { inputRefs.current[index] = el; }}
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleInputChange(index, e.target.value, e.target)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        maxLength={1}
                                        disabled={isAnswered}
                                        className="w-full h-full text-center font-medium text-lg bg-transparent focus:outline-none uppercase"
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {showHints && hintsUsed === 1 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Cevap {currentQuestion.cevap.length} harfli.
                        </p>
                    )}
                </div>

                <button
                    onClick={checkAnswer}
                    disabled={isAnswered || inputValues.join('').length === 0}
                    className={`w-full py-3 rounded-lg font-medium ${isAnswered
                        ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        : 'bg-blue-600 hover:bg-blue-700 text-white transition'
                        }`}
                >
                    {isAnswered ? 'Doğru!' : 'Kontrol Et'}
                </button>
            </div>

            <div className="max-w-2xl mx-auto flex justify-between">
                <button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`flex items-center px-4 py-2 rounded-lg ${currentQuestionIndex === 0
                        ? 'text-white rounded-3xl shadow-2xl bg-black/40 cursor-not-allowed'
                        : 'text-white rounded-3xl shadow-2xl bg-black/40 hover:bg-blue-600 transition'
                        }`}
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Önceki
                </button>

                <button
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1 || !currentAnswer?.isCorrect}
                    className={`flex items-center px-4 py-2 rounded-lg ${currentQuestionIndex === questions.length - 1 || !currentAnswer?.isCorrect
                        ? 'text-white rounded-3xl shadow-2xl bg-black/40 cursor-not-allowed'
                        : 'text-white rounded-3xl shadow-2xl bg-black/40 hover:bg-blue-600 transition'
                        }`}
                >
                    Sonraki
                    <ChevronRight className="w-5 h-5 ml-1" />
                </button>
            </div>
        </div>
    );
}